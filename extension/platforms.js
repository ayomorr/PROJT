// Mirror of shared/platforms.js — Chrome packages content_scripts/workers inside the
// extension folder, so we keep a byte-for-byte copy here. When you add a platform,
// update BOTH this file and shared/platforms.js (and the matches lists in manifest.json).

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

export function platformIdForHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
  for (const [suffix, id] of HOST_PATTERNS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return id;
  }
  return null;
}

export function platformById(id) {
  return PLATFORMS.find((p) => p.id === id) || null;
}

export default PLATFORMS;