// ScrollGuard content script.
//
// Told the background worker when the user is actually looking at a supported feed,
// and renders a calm, non-blocking reminder card when the background asks for one.
// It never inspects or reads page content — only the tab's own hostname.

(() => {
  if (window.__scrollguardLoaded) return;
  window.__scrollguardLoaded = true;

  const host = location.hostname;
  const active = () => document.visibilityState === 'visible';
  const platformFromHost = () => {
    // Local copy of the platform map kept in sync with shared/platforms.js.
    const hosts = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be', 'facebook.com', 'fb.com', 'x.com', 'twitter.com', 'reddit.com', 'snapchat.com', 'linkedin.com'];
    const h = host.toLowerCase().replace(/^www\./, '');
    for (const suffix of hosts) {
      if (h === suffix || h.endsWith(`.${suffix}`)) return suffix.replace('.com', '').replace('youtu.be', 'youtube').replace('fb.com', 'facebook').replace('twitter.com', 'x');
    }
    return null;
  };

  const current = platformFromHost();
  if (!current) return;

  const send = (type, extra = {}) => {
    try {
      chrome.runtime.sendMessage({ type, platform: current, ...extra });
    } catch {
      // Extension context may be invalidated (updates/reloads) — safe to ignore.
    }
  };

  function notify() {
    send(active() ? 'tab-active' : 'tab-hidden');
  }

  // Heartbeat so the worker doesn't end the session just because a tab was briefly hidden.
  setInterval(() => {
    if (active()) send('tab-active');
  }, 15000);

  document.addEventListener('visibilitychange', notify);
  window.addEventListener('focus', () => active() && send('tab-active'));
  window.addEventListener('blur', () => send('tab-inactive'));

  // A little wait so SPA pages settle, then announce.
  setTimeout(notify, 800);

  /* ------------------------------- reminder card ------------------------------- */
  let card = null;

  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg?.type === 'sg-reminder') {
      showReminder(msg.level, msg.message);
      respond({ ok: true });
    }
    if (msg?.type === 'sg-hide-reminder') {
      hideReminder();
      respond({ ok: true });
    }
    return true;
  });

  function showReminder(level, message, ) {
    hideReminder();
    const palette = {
      1: { accent: '#6D5AE6', label: 'A gentle nudge' },
      2: { accent: '#F2A93B', label: 'Still scrolling?' },
      3: { accent: '#E8735A', label: 'Time for a real break' },
    }[level] || { accent: '#6D5AE6', label: 'ScrollGuard' };

    const host = document.createElement('div');
    host.id = 'scrollguard-reminder';
    host.setAttribute(
      'style',
      'all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;',
    );

    const accent = palette.accent;
    const label = palette.label;
    const text = message || 'Pause for a second. Is this feed still serving you?';
    const copy = level === 3 ? 'A longer break now usually beats another 20 minutes of scrolling.' : 'A two-minute break is enough to reset the loop.';

    host.innerHTML = `
      <div style="width:320px;max-width:calc(100vw - 24px);background:#222b37;border:1px solid rgba(232,237,242,0.12);border-top:4px solid ${accent};border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.45);padding:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:${accent}22;color:${accent};width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:800;">S</span>
          <div style="flex:1;">
            <div style="font-weight:800;font-size:13px;color:#E8EDF2;">ScrollGuard</div>
            <div style="font-size:11px;color:${accent};font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">${label}</div>
          </div>
          <button data-sg="close" title="Dismiss" style="border:0;background:transparent;color:#6e7a87;font-size:18px;cursor:pointer;line-height:1;">×</button>
        </div>
        <p style="margin:12px 0 4px;font-size:14px;line-height:1.45;color:#E8EDF2;">${text}</p>
        <p style="margin:0 0 14px;font-size:12.5px;line-height:1.4;color:#A3AEBB;">${copy}</p>
        <div style="display:flex;gap:8px;">
          <button data-sg="break" style="flex:1;background:${accent};border:0;color:#fff;font-weight:800;font-size:13px;padding:9px 12px;border-radius:10px;cursor:pointer;">Take a break</button>
          <button data-sg="continue" style="flex:1;background:#1c1f3d;border:0;color:#E8EDF2;font-weight:700;font-size:13px;padding:9px 12px;border-radius:10px;cursor:pointer;">Continue</button>
        </div>
      </div>`;

    host.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sg]');
      if (!btn) return;
      const action = btn.getAttribute('data-sg');
      hideReminder();
      if (action === 'break' || action === 'continue') {
        send('decision', {
          level,
          decision: action === 'break' ? 'take-break' : 'continue',
        });
      }
      if (action === 'break') window.focus();
    });
    document.body.appendChild(host);
    card = host;
  }

  function hideReminder() {
    if (card) {
      card.remove();
      card = null;
    }
  }
})();