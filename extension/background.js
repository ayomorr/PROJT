// ScrollGuard — background worker (Manifest V3, ES module).
//
// Responsibilities (see docs/EXTENSION.md):
//   1. Track when the user is active on a supported platform (via content.js heartbeats).
//   2. Open a live session on the backend and commit it on close.
//   3. Poll the backend for the current intervention level and ask the tab to show a
//      calm reminder card.
//   4. Keep a small offline, 8-week local store (never fake data, clearly labeled).
//   5. Fall back to local-only tracking when the user isn't logged in.

import { platformById } from './platforms.js';

/* ------------------------------- config ------------------------------- */
const DEFAULTS = { apiBaseUrl: 'http://localhost:4000/api', token: '' };
const IDLE_MS = 60000; // consider the user idle after 60s without a heartbeat
const STORE_MAX_DAYS = 56;

async function cfg() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...s };
}

/* ------------------------------- state ------------------------------- */
let session = null; // { sessionId, platform, startedAt, lastSeen }
let idleTimer = null;

/* ------------------------------- fetch helper ------------------------------- */
async function api(c) {
  const headers = { 'Content-Type': 'application/json' };
  if (c.token) headers.Authorization = `Bearer ${c.token}`;
  let res;
  try {
    res = await fetch(`${c.apiBaseUrl}${c.path}`, {
      method: c.method || 'GET',
      headers,
      body: c.body ? JSON.stringify(c.body) : undefined,
    });
  } catch {
    return { offline: true };
  }
  try {
    const json = await res.json();
    return { status: res.status, ...json };
  } catch {
    return { status: res.status };
  }
}

const get = (c, path) => api({ ...c, path, method: 'GET' });
const post = (c, path, body) => api({ ...c, path, method: 'POST', body });

/* ------------------------------- local store ------------------------------- */
// Rolling per-day totals per platform so the popup has honest numbers even offline.
async function bumpLocal(platform, seconds) {
  const key = new Date().toISOString().slice(0, 10);
  const { store } = await chrome.storage.local.get('store');
  const days = store || {};
  const day = days[key] || {};
  day[platform] = (day[platform] || 0) + Math.round(seconds);
  days[key] = day;
  const keys = Object.keys(days).sort();
  while (keys.length > STORE_MAX_DAYS) {
    delete days[keys.shift()];
  }
  await chrome.storage.local.set({ store: days });
}

/* ------------------------------- session lifecycle ------------------------------- */
async function ensureSession(platform) {
  if (session && session.platform === platform) {
    session.lastSeen = Date.now();
    return;
  }
  if (session && session.platform !== platform) {
    await closeSession(platform);
  }
  const c = await cfg();
  const startedAt = Date.now();
  const res = await post(c, '/usage/session/start', { platform, source: 'extension' });
  session = {
    sessionId: res.sessionId || `local-${platform}-${startedAt}`,
    platform,
    startedAt,
    lastSeen: startedAt,
  };
  scheduleIdleCheck();
  chrome.storage.local.set({ lastSession: session });
}

async function closeSession(switchingTo = null) {
  if (!session) return;
  const c = await cfg();
  const s = session;
  session = null;
  clearTimeout(idleTimer);
  const now = Date.now();
  const seconds = Math.max(0, Math.round((now - s.startedAt) / 1000));
  await bumpLocal(s.platform, seconds);
  if (c.token && !s.sessionId.startsWith('local-')) {
    await post(c, '/usage/session/end', { sessionId: s.sessionId });
  }
  await chrome.storage.local.remove('lastSession');
  if (switchingTo) ensureSession(switchingTo);
}

function scheduleIdleCheck() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    const since = Date.now() - (session?.lastSeen || Date.now());
    if (session && since >= IDLE_MS) {
      await closeSession();
    }
  }, IDLE_MS + 2000);
}

/* ------------------------------- reminder polling ------------------------------- */
async function checkIntervention() {
  if (!session || !session.sessionId || session.sessionId.startsWith('local-')) return;
  const c = await cfg();
  if (!c.token) return;
  const res = await get(c, '/usage/active');
  const level = Number(res?.interventionLevel) || 0;
  const reminder = res?.reminder && typeof res.reminder === 'string' ? res.reminder : null;
  const decision = res?.decisionPrompt || '';

  if (level > 0) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const t = tabs[0];
      if (!t || !t.id) return;
      chrome.tabs.sendMessage(
        t.id,
        { type: 'sg-reminder', level, message: reminder || suggestFor(level) },
        () => void chrome.runtime.lastError, // tab may have navigated away
      );
    });
    if (level >= 3) {
      // Level 3: surface a decision rather than silently nagging.
      chrome.storage.local.set({ decisionPrompt: decision || 'take-a-break' });
    }
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const t = tabs[0];
      if (!t || !t.id) return;
      chrome.tabs.sendMessage(t.id, { type: 'sg-hide-reminder' }, () => void chrome.runtime.lastError);
    });
  }
  scheduleIdleCheck(); // keep checking only while a session is plausible
}

function suggestFor(level) {
  if (level >= 3) return "You've been going for a while. A proper break now protects the rest of your day.";
  if (level === 2) return 'Your feed will still be here in two minutes. Step away for a quick reset?';
  return 'A quick pause keeps this scroll intentional.';
}

// Keep the worker alive and poll while a session is running.
chrome.alarms.create('scrollguard-check', { periodInMinutes: 0.2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'scrollguard-check') checkIntervention();
});

/* ------------------------------- messaging from content.js ------------------------------- */
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  const handle = async () => {
    if (msg?.type === 'tab-active') {
      await ensureSession(msg.platform);
    } else if (msg?.type === 'tab-hidden' || msg?.type === 'tab-inactive') {
      if (session && msg.platform === session.platform) scheduleIdleCheck();
    } else if (msg?.type === 'decision' && session) {
      await recordDecision(msg.level, msg.decision);
    } else if (msg?.type === 'session-status') {
      return session
        ? { ok: true, session: { platform: session.platform, startedAt: session.startedAt } }
        : { ok: true, session: null };
    } else if (msg?.type === 'end-session') {
      const p = session?.platform;
      await closeSession();
      return { ok: true, ended: p || null };
    }
    return { ok: true };
  };
  handle().then(respond).catch(() => respond({ ok: true }));
  return true; // async response
});

// Tab focus changes count as activity too.
chrome.tabs.onActivated.addListener(() => {
  if (session) session.lastSeen = Date.now();
});

/* ------------------------------- idle handling ------------------------------- */
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'locked' || state === 'idle') {
    if (session) scheduleIdleCheck();
  }
});

/* ------------------------------- decisions ------------------------------- */
async function recordDecision(level, decision) {
  if (!session || session.sessionId.startsWith('local-')) return;
  const c = await cfg();
  if (!c.token) return;
  await post(c, '/usage/session/reminder', {
    sessionId: session.sessionId,
    level,
    decision,
  });
}

/* ------------------------------- startup cleanup ------------------------------- */
chrome.runtime.onStartup.addListener(() => {
  session = null;
  clearTimeout(idleTimer);
});

export { platformById };