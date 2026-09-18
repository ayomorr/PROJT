// Formatting and time helpers shared across the app.

// 150 → "2h 30m" · 45 → "45m" · 3600 → "1h 00m"
export function fmtMinutes(min) {
  const n = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function fmtSeconds(sec) {
  return fmtMinutes((Number(sec) || 0) / 60);
}

// Friendly clock from an ISO timestamp.
export function fmtClock(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// "Good morning / Good afternoon / Good evening 👋"
export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up bright and early';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// "2026-09-18" → "Today" / "Yesterday" / "Fri 18 Sep".
// Day keys are UTC calendar dates throughout the app, so all math happens in UTC
// to stay timezone-independent.
export function fmtDayLabel(day, today) {
  const t = today || new Date().toISOString().slice(0, 10);
  if (day === t) return 'Today';
  const yesterday = new Date(`${t}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (day === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtDayShort(day) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString([], { weekday: 'short' });
}

export function titleCase(str) {
  return String(str || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Pluralization helper: plural(n, 'session') → "1 session" / "3 sessions"
export function plural(n, word) {
  const m = Math.abs(n);
  return `${n} ${m === 1 ? word : word + 's'}`;
}