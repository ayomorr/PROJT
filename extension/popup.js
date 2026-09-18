// ScrollGuard extension popup. Shows live session state + honest offline totals.
const DEFAULT_API = 'http://localhost:4000/api';

const $ = (id) => document.getElementById(id);
const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m === 0 ? `${sec}s` : `${m}m ${String(sec).padStart(2, '0')}s`;
};

const loadConfig = async () => chrome.storage.sync.get({ apiBaseUrl: DEFAULT_API, token: '' });

async function fetchToday(config) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;
  try {
    const res = await fetch(`${config.apiBaseUrl}/usage/today`, { headers });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

function localTodayTotal(store) {
  const key = new Date().toISOString().slice(0, 10);
  const day = (store || {})[key] || {};
  return Object.values(day).reduce((a, b) => a + b, 0);
}

async function render() {
  const config = await loadConfig();
  $('api').value = config.apiBaseUrl;
  $('token').value = config.token;

  const endBtn = $('endBtn');
  const line = $('sessionLine');
  const meta = $('sessionMeta');

  // Ask the worker about the live session if it has one.
  chrome.runtime.sendMessage({ type: 'session-status' }, (resp) => {
    if (resp?.session) {
      const mins = Math.max(0, Math.round((Date.now() - resp.session.startedAt) / 60000));
      line.textContent = `Active on a supported platform`;
      meta.textContent = `Session: ${resp.session.platform} · ${mins} min`;
      endBtn.classList.remove('hidden');
    } else {
      line.textContent = 'Not tracking right now';
      meta.textContent = 'Open a supported platform to start.';
      endBtn.classList.add('hidden');
    }
  });

  endBtn.onclick = () =>
    chrome.runtime.sendMessage({ type: 'end-session' }, () => setTimeout(render, 400));

  // Today's numbers: server when linked, otherwise the honest local store.
  const { store } = await chrome.storage.local.get('store');
  const localTotal = localTodayTotal(store);
  const online = await fetchToday(config);
  const badge = $('todayBadge');

  if (config.token && online && online.totalMinutes !== undefined) {
    badge.className = 'tag';
    badge.textContent = 'synced';
    $('todayTotals').textContent = `${online.totalMinutes}m`;
    $('todayDetail').textContent = `${online.sessionCount ?? 0} sessions · longest ${Math.round((online.longestSession || 0) / 60)}m`;
  } else {
    badge.className = 'tag off';
    badge.textContent = config.token ? 'server unreachable' : 'offline';
    $('todayTotals').textContent = localTotal ? fmt(localTotal) : '0m';
    $('todayDetail').textContent = localTotal
      ? 'Tracked locally (never sent anywhere)'
      : 'No sessions recorded locally yet';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  $('save').addEventListener('click', async () => {
    await chrome.storage.sync.set({
      apiBaseUrl: $('api').value.trim() || DEFAULT_API,
      token: $('token').value.trim(),
    });
    render();
  });
  $('openDash').addEventListener('click', () => {
    const origin = ($('api').value || DEFAULT_API).replace(/\/api\/?$/, '');
    chrome.tabs.create({ url: `${origin}/app` });
  });
});