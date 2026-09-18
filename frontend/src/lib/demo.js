// Demo-mode data layer.
//
// When VITE_DEMO_MODE=true the app uses this module instead of the network. It returns
// payloads with EXACTLY the same shape as the real API (see lib/api.js), so pages don't
// care where the data comes from. Every payload carries `demo: true` so the UI can show
// a clear, honest "Demo Data" badge. We never pass demo data off as real user data.
import { PLATFORMS } from '@shared/platforms.js';

const DEMO_USER_KEY = 'sg_demo_user';
const DEMO_TOKEN_KEY = 'sg_demo_token';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const todayKey = () => new Date().toISOString().slice(0, 10);
const minAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

function demoUser() {
  return {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@scrollguard.app',
    role: 'user',
    dailyGoal: 90,
    goals: ['Reduce social-media time', 'Stop endless scrolling'],
    platforms: ['tiktok', 'instagram', 'youtube', 'x', 'reddit'],
    scrollTimes: ['Evening', 'Before sleeping'],
    streak: 4,
    troubleLimitMin: 20,
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    demo: true,
  };
}

function persistSession(user) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  localStorage.setItem(DEMO_TOKEN_KEY, 'demo-token');
}

export function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USER_KEY)) || null;
  } catch {
    return null;
  }
}

function liveSessionObjects() {
  const mk = (platform, startOffsetMin, durationMin, source = 'web') => ({
    id: `demo-${platform}-${startOffsetMin}`,
    userId: 'demo-user-1',
    platformId: platform,
    startTime: minAgo(startOffsetMin),
    endTime: minAgo(startOffsetMin - durationMin),
    duration: durationMin * 60,
    tag: 'web',
    source,
    demo: true,
  });
  // Built to match the "wow moment": 9 opens today, longest 31 minutes.
  return [
    mk('instagram', 245, 12),
    mk('tiktok', 220, 9),
    mk('tiktok', 175, 31),   // longest session
    mk('youtube', 140, 18),
    mk('youtube', 95, 15),
    mk('x', 60, 6),
    mk('instagram', 35, 24),
    mk('reddit', 30, 5),
    mk('tiktok', 9, 14),
  ];
}

function perPlatformToday() {
  rawStat('tiktok', 1740, 3, 2), rawStat('instagram', 2340, 2, 1);
}

function rawStat(platformId, totalSeconds, sessions, longest) {
  return { platformId, totalSeconds, sessions, longestSession: longest, demo: true };
}

export async function auth() {
  await delay(400);
  return {
    token: localStorage.getItem(DEMO_TOKEN_KEY) || 'demo-token',
    user: getSessionUser() || demoUser(),
    demo: true,
  };
}

export async function login({ email, password }) {
  await delay(500);
  const user = demoUser();
  persistSession(user);
  return { token: 'demo-token', user, demo: true };
}

export async function register(payload) {
  await delay(500);
  const user = { ...demoUser(), name: payload.name, email: payload.email || 'demo@scrollguard.app', dailyGoal: payload.dailyGoalMin || 90, goals: payload.goals || [], platforms: payload.platforms || [], scrollTimes: payload.scrollTimes || [], demo: true };
  persistSession(user);
  return { token: 'demo-token', user, demo: true };
}

export async function logout() {
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem(DEMO_TOKEN_KEY);
  return { ok: true, demo: true };
}

export async function forgotPassword(email) {
  await delay(400);
  return { ok: true, message: "If that account exists, we've emailed you a reset link.", resetToken: 'demo-reset-token', demo: true };
}

export async function resetPassword() {
  await delay(400);
  return { ok: true, message: 'Password updated (demo).', demo: true };
}

export async function profile() {
  await delay(200);
  const stored = getSessionUser();
  // No stored session? Report an unauthenticated state so the router lands on the
  // landing page instead of pretending the demo user already logged in.
  return { user: stored ? { ...stored, demo: true } : null, demo: true };
}

export async function updateProfile(patch) {
  const user = { ...(getSessionUser() || demoUser()), ...patch, demo: true };
  persistSession(user);
  return { user, demo: true };
}

export async function deleteAccount() {
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem(DEMO_TOKEN_KEY);
  return { ok: true, message: 'Your account and all your data have been deleted.', demo: true };
}

export async function getToday() {
  await delay(450);
  const sessions = liveSessionObjects();
  const byPlatform = new Map();
  for (const s of sessions) {
    const e = byPlatform.get(s.platformId) || { platformId: s.platformId, totalSeconds: 0, sessions: 0, longestSession: 0 };
    e.totalSeconds += s.duration;
    e.sessions += 1;
    e.longestSession = Math.max(e.longestSession, s.duration);
    byPlatform.set(s.platformId, e);
  }
  const totalSeconds = sessions.reduce((a, s) => a + s.duration, 0); // 2h18m
  return {
    date: todayKey(),
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    goalMinutes: 90,
    sessions,
    sessionCount: sessions.length,
    longestSession: Math.max(...sessions.map((s) => s.duration)),
    reopens: 14,
    attentionScore: 72,
    perPlatform: [...byPlatform.values()].sort((a, b) => b.totalSeconds - a.totalSeconds).map((p) => ({ ...p, demo: true })),
    withinGoal: false,
    streak: 4,
    demo: true,
  };
}

function buildWeekly() {
  const days = [];
  const metrics = [
    [112, 8, 74],
    [138, 10, 70],
    [96, 6, 78],
    [151, 11, 64],
    [121, 9, 71],
    [98, 7, 77],
    [138, 7, 72],
  ];
  for (let i = metrics.length - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      totalMinutes: metrics[metrics.length - 1 - i][0],
      sessions: metrics[metrics.length - 1 - i][1],
      attentionScore: metrics[metrics.length - 1 - i][2],
      demo: true,
    });
  }
  const hourlyMinutes = new Array(24).fill(0);
  for (const [hour, min] of [[7, 8], [8, 14], [12, 18], [18, 20], [19, 34], [20, 48], [21, 62], [22, 58], [23, 40]]) hourlyMinutes[hour] = min;

  const platformRank = [
    { platformId: 'tiktok', totalMinutes: 365, sessions: 31, demo: true },
    { platformId: 'instagram', totalMinutes: 342, sessions: 28, demo: true },
    { platformId: 'youtube', totalMinutes: 270, sessions: 19, demo: true },
    { platformId: 'reddit', totalMinutes: 72, sessions: 9, demo: true },
    { platformId: 'x', totalMinutes: 48, sessions: 14, demo: true },
  ];

  return {
    range: { from: days[0].date, to: days[6].date },
    totalSeconds: days.reduce((a, d) => a + d.totalMinutes, 0) * 60,
    totalMinutes: days.reduce((a, d) => a + d.totalMinutes, 0),
    deltaSeconds: -78 * 60,
    deltaMinutes: -78,
    sessions: days.reduce((a, d) => a + d.sessions, 0),
    avgSessionSeconds: Math.round((days.reduce((a, d) => a + d.totalMinutes, 0) * 60) / 53),
    longestSession: 52 * 60,
    mostActiveHour: 21,
    hourlyMinutes,
    platformRank,
    daily: days,
    attentionScore: 72,
    demo: true,
  };
}

export async function getWeekly() {
  await delay(450);
  return { weekly: buildWeekly(), demo: true };
}

export async function getInsights() {
  await delay(450);
  const weekly = buildWeekly();
  return {
    weekly,
    pattern: {
      emoji: '🌙',
      text: 'Most of your longer sessions happen between 9 PM and 11 PM.',
      tag: 'night',
      action: 'Set a wind-down reminder',
      demo: true,
    },
    demo: true,
  };
}

export async function getPlatforms() {
  await delay(150);
  return { platforms: PLATFORMS.map((p) => ({ ...p, demo: p.demo !== undefined })), demo: true };
}

export async function getLimits() {
  await delay(200);
  return {
    limits: [
      { id: 'demo-limit-tiktok', userId: 'demo-user-1', platformId: 'tiktok', dailyLimitMin: 30, sessionLimitMin: 15, quietStart: '', quietEnd: '', demo: true },
      { id: 'demo-limit-instagram', userId: 'demo-user-1', platformId: 'instagram', dailyLimitMin: 45, sessionLimitMin: 20, quietStart: '', quietEnd: '', demo: true },
      { id: 'demo-limit-youtube', userId: 'demo-user-1', platformId: 'youtube', dailyLimitMin: 60, sessionLimitMin: 30, quietStart: '', quietEnd: '', demo: true },
      { id: 'demo-limit-global', userId: 'demo-user-1', platformId: null, dailyLimitMin: null, sessionLimitMin: null, quietStart: '22:00', quietEnd: '07:00', demo: true },
    ],
    demo: true,
  };
}

export async function saveLimit(payload) {
  await delay(250);
  return { limit: { id: `demo-${payload.platformId || 'global'}-1`, userId: 'demo-user-1', ...payload, demo: true }, demo: true };
}

export async function updateLimit(id, patch) {
  await delay(250);
  return { limit: { id, ...patch, demo: true }, demo: true };
}

export async function removeLimit() {
  await delay(200);
  return { ok: true, demo: true };
}

export async function getActive() {
  await delay(150);
  return { active: false, demo: true };
}

export async function startLive(platform) {
  await delay(200);
  return { sessionId: `demo-live-${platform}-${Date.now()}`, demo: true };
}

export async function endLive() {
  await delay(200);
  return { session: { duration: 0, endTime: new Date().toISOString(), demo: true }, demo: true };
}

export async function logSession() {
  await delay(250);
  return { session: { id: 'demo-logged', demo: true }, demo: true };
}

const CHALLENGES = [
  { id: 'stay-calm-morning', title: 'Morning treasure', description: 'Stay off social media for the first 30 minutes after waking.', category: 'morning', duration: '1 day', completedToday: false, demo: true },
  { id: 'screen-break', title: 'Breathe out loud', description: 'Take a 10-minute, totally screen-free break today.', category: 'focus', duration: '1 day', completedToday: false, demo: true },
  { id: 'no-scroll-meals', title: 'Savory without the scroll', description: 'Keep social media out of mealtimes today.', category: 'focus', duration: '1 day', completedToday: false, demo: true },
  { id: 'bedroom-phone-out', title: 'A phone-free bedroom', description: 'Keep social media outside the bedroom tonight.', category: 'evening', duration: '1 day', completedToday: false, demo: true },
  { id: 'intentional-session', title: 'One intentional session', description: 'Use social media intentionally — decide what you want before you open it.', category: 'general', duration: '1 day', completedToday: false, demo: true },
  { id: 'goal-20', title: 'Under the radar', description: 'Keep every scrolling session today under 20 minutes.', category: 'focus', duration: '1 day', completedToday: false, demo: true },
  { id: 'double-task', title: 'One less reopen', description: 'Open social media at least 2 fewer times than usual today.', category: 'general', duration: '1 day', completedToday: false, demo: true },
  { id: 'evening-replace', title: 'Softer evening', description: 'Replace one evening scroll with a walk, stretch, or a couple of pages of a book.', category: 'evening', duration: '1 day', completedToday: false, demo: true },
];

export async function getChallenges() {
  await delay(300);
  return { challenges: CHALLENGES, today: todayKey(), demo: true };
}

export async function completeChallenge(id) {
  await delay(250);
  return { ok: true, already: false, challengeId: id, demo: true };
}

export async function focusActive() {
  return { active: false, demo: true };
}

export async function focusStart(minutes, platforms = []) {
  await delay(250);
  return {
    focus: {
      id: `demo-focus-${Date.now()}`,
      userId: 'demo-user-1',
      plannedMin: minutes,
      platformsText: platforms || [],
      startTime: new Date().toISOString(),
      completed: 0,
      demo: true,
    },
    demo: true,
  };
}

export async function focusEnd(focusId) {
  await delay(200);
  return { focus: { id: focusId, completed: 1, demo: true }, demo: true };
}

// Guard copies the offline coach's supportive tone. No network, no key, no secrets.
function guardReply(text) {
  const t = (text || '').toLowerCase();
  if (/(suicide|self[- ]?harm|kill my|end my life|want to die)/.test(t)) {
    return {
      message:
        "Thank you for telling me that. You matter, and you don't have to carry this alone. ScrollGuard is a digital-wellbeing coach, not a therapist — please reach out to someone who can truly help right now.",
      insight: 'What you described sounds serious and painful.',
      suggestedAction: 'Contact a crisis line or a trusted professional today.',
      tone: 'gentle',
      safety: true,
      resources: [
        { label: 'Emergency services (local)', value: 'Call your local emergency number (e.g. 911 / 112 / 999)' },
        { label: '988 Suicide & Crisis Lifeline (US)', value: 'Call or text 988' },
      ],
    };
  }
  if (t.includes('night') || t.includes('sleep') || t.includes('midnight')) {
    return {
      message: 'Your data shows most of your longer sessions happen between 9 PM and 11 PM. A gentle wind-down reminder around 8:45 PM could help you close the day on your own terms.',
      insight: 'Night-time scrolling is the most common pattern we see.',
      suggestedAction: 'Set quiet hours in Limits to soften reminders after 10 PM.',
      tone: 'supportive',
    };
  }
  if (t.includes('this week') || t.includes('how did i do') || t.includes('progress')) {
    return {
      message: 'You reduced your average daily scrolling by about 11 minutes compared with last week. Your biggest improvement was on weekdays.',
      insight: 'Weekly time is down 1h 18m vs last week.',
      suggestedAction: 'Keep one limit you have set, or try today\'s challenge.',
      tone: 'encouraging',
    };
  }
  if (t.includes('feel like scrolling') || t.includes('urge') || t.includes('bored') || t.includes('stress')) {
    return {
      message: 'Try a 5-minute alternative first: walk around, stretch, reply to one important message, read one page, or simply put your phone down for two minutes.',
      insight: 'Most openings are triggered by boredom or a short stressful moment.',
      suggestedAction: 'Use the "I want to scroll" button to make the next opening intentional.',
      tone: 'supportive',
    };
  }
  if (t.includes('addict') || t.includes('too much') || t.includes('waste')) {
    return {
      message: "I won't label you, and you're not broken. Your data shows patterns — and patterns can change. Small, kind adjustments add up faster than dramatic ones.",
      insight: 'Average session this week: about 11 minutes. Most active: 9 PM – 11 PM.',
      suggestedAction: 'Start with one daily limit for your most-used platform.',
      tone: 'gentle',
    };
  }
  return {
    message: "Here's one observation from your data: most of your scrolling happens in the evening. A quiet-hours window there could make a real difference.",
    insight: 'Your longest sessions are consistently in the evening window.',
    suggestedAction: 'Ask me about limits, breaks, or night-time scrolling.',
    tone: 'supportive',
  };
}

export async function aiChat(text) {
  await delay(600);
  const reply = guardReply(text);
  return { reply, mode: 'demo', demo: true };
}

export async function aiPattern(text) {
  await delay(500);
  const reply = guardReply(text);
  const { message, insight, suggestedAction, tone } = reply;
  return { structured: { message, insight, suggestedAction, tone }, safety: Boolean(reply.safety), demo: true };
}