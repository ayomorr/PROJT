// Shared platform definitions used by the frontend, backend and extension.
// Keeping one source of truth means the "supported platforms" story is always
// consistent everywhere.

export const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵', domain: 'tiktok.com', color: '#25F4EE' },
  { id: 'instagram', name: 'Instagram', icon: '📸', domain: 'instagram.com', color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', domain: 'youtube.com', color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: '👥', domain: 'facebook.com', color: '#1877F2' },
  { id: 'x', name: 'X', icon: '🐦', domain: 'x.com', color: '#1C1C1C' },
  { id: 'reddit', name: 'Reddit', icon: '👽', domain: 'reddit.com', color: '#FF4500' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', domain: 'snapchat.com', color: '#FFFC00' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', domain: 'linkedin.com', color: '#0A66C2' },
];

// Map every supported hostname to its platform id. Used by the extension to decide
// whether a given tab should open a live session, and by the demo data generator.
const HOST_PATTERNS = [
  ['tiktok.com', 'tiktok'],
  ['instagram.com', 'instagram'],
  ['youtube.com', 'youtube'],
  ['youtu.be', 'youtube'],
  ['facebook.com', 'facebook'],
  ['fb.com', 'facebook'],
  ['x.com', 'x'],
  ['twitter.com', 'x'],
  ['reddit.com', 'reddit'],
  ['snapchat.com', 'snapchat'],
  ['linkedin.com', 'linkedin'],
];

// Track extra hosts the extension should watch even if they are not a "platform"
// (these can still consume attention, e.g. short-form video sites).
export const EXTRA_WATCHED_GLOB_PATTERNS = [
  '*://*.tiktok.com/*',
  '*://*.instagram.com/*',
  '*://*.youtube.com/*',
  '*://*.facebook.com/*',
  '*://*.x.com/*',
  '*://*.twitter.com/*',
  '*://*.reddit.com/*',
  '*://*.snapchat.com/*',
  '*://*.linkedin.com/*',
];

export function platformById(id) {
  return PLATFORMS.find((p) => p.id === id) || null;
}

// Given a hostname like "www.instagram.com", return "instagram" or null.
export function platformIdForHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
  for (const [suffix, id] of HOST_PATTERNS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return id;
  }
  return null;
}

// The onboarding + limits use those exact ids (exported for tests).
export const PLATFORM_IDS = PLATFORMS.map((p) => p.id);

export default PLATFORMS;