// Data facade — the ONLY place pages touch for data.
//
// It routes to the real backend (lib/api.js) or the labeled demo layer (lib/demo.js)
// depending on VITE_DEMO_MODE. Pages never care which one answered.
import * as real from './api.js';
import * as demo from './demo.js';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const i = () => (DEMO_MODE ? demo : real);

/* ---------- token helpers (unified for auth context) ---------- */
export const tokenStore = {
  get: () => (DEMO_MODE ? demo.getSessionUser() : real.getToken()),
  set: (t) => (DEMO_MODE ? real.setToken(t) : real.setToken(t)),
  clear: () => real.setToken(''),
};

/* ---------- auth ---------- */
export const authApi = {
  me: () => (DEMO_MODE ? demo.profile() : real.auth.me()),
  login: (payload) => (DEMO_MODE ? demo.login(payload) : real.auth.login(payload)),
  register: (payload) => (DEMO_MODE ? demo.register(payload) : real.auth.register(payload)),
  logout: () => (DEMO_MODE ? demo.logout() : real.auth.logout()),
  forgotPassword: (email) => (DEMO_MODE ? demo.forgotPassword(email) : real.auth.forgotPassword(email)),
  resetPassword: (token, password) => (DEMO_MODE ? demo.resetPassword(token, password) : real.auth.resetPassword(token, password)),
};

/* ---------- user ---------- */
export const userApi = {
  profile: () => (DEMO_MODE ? demo.profile() : real.user.profile()),
  update: (patch) => (DEMO_MODE ? demo.updateProfile(patch) : real.user.update(patch)),
  deleteAccount: () => (DEMO_MODE ? demo.deleteAccount() : real.user.deleteAccount()),
};

/* ---------- usage ---------- */
export const usageApi = {
  today: () => (DEMO_MODE ? demo.getToday() : real.usage.today()),
  weekly: () => (DEMO_MODE ? demo.getWeekly() : real.usage.weekly()),
  insights: () => (DEMO_MODE ? demo.getInsights() : real.usage.insights()),
  logSession: (payload) => (DEMO_MODE ? demo.logSession(payload) : real.usage.logSession(payload)),
  startLive: (platform) => (DEMO_MODE ? demo.startLive(platform) : real.usage.startLive(platform)),
  endLive: (sessionId) => (DEMO_MODE ? demo.endLive(sessionId) : real.usage.endLive(sessionId)),
  active: () => (DEMO_MODE ? demo.getActive() : real.usage.active()),
};

/* ---------- platform / limits ---------- */
export const platformsApi = {
  list: () => (DEMO_MODE ? demo.getPlatforms() : real.platforms.list()),
};
export const limitsApi = {
  list: () => (DEMO_MODE ? demo.getLimits() : real.limits.list()),
  save: (payload) => (DEMO_MODE ? demo.saveLimit(payload) : real.limits.save(payload)),
  update: (id, patch) => (DEMO_MODE ? demo.updateLimit(id, patch) : real.limits.update(id, patch)),
  remove: (id) => (DEMO_MODE ? demo.removeLimit(id) : real.limits.remove(id)),
};

/* ---------- ai / focus / challenges ---------- */
export const aiApi = {
  chat: (text, history = []) => (DEMO_MODE ? demo.aiChat(text, history) : real.ai.chat(text, history)),
  pattern: (text) => (DEMO_MODE ? demo.aiPattern(text) : real.ai.pattern(text)),
};
export const focusApi = {
  active: () => (DEMO_MODE ? demo.focusActive() : real.focus.active()),
  start: (minutes, platforms = []) => (DEMO_MODE ? demo.focusStart(minutes, platforms) : real.focus.start(minutes, platforms)),
  end: (focusId) => (DEMO_MODE ? demo.focusEnd(focusId) : real.focus.end(focusId)),
};

export const challengesApi = {
  list: () => (DEMO_MODE ? demo.getChallenges() : real.challengesApi.list()),
  complete: (id) => (DEMO_MODE ? demo.completeChallenge(id) : real.challengesApi.complete(id)),
};

export const adminApi = {
  stats: () => (DEMO_MODE ? demoAdminStats() : real.admin.stats()),
};

async function demoAdminStats() {
  await new Promise((r) => setTimeout(r, 400));
  return {
    totalUsers: 1240,
    activeUsers7d: 712,
    sessionsToday: 843,
    sessionsWeek: 5210,
    timeTodaySeconds: 186240,
    completionsToday: 96,
    platformDistribution: [
      { platformId: 'tiktok', sessions: 1610, totalMinutes: 4280 },
      { platformId: 'instagram', sessions: 1490, totalMinutes: 3920 },
      { platformId: 'youtube', sessions: 940, totalMinutes: 2880 },
      { platformId: 'x', sessions: 610, totalMinutes: 940 },
      { platformId: 'reddit', sessions: 560, totalMinutes: 720 },
    ],
    featureUsage: { focusSessionsWeek: 214, remindersWeek: 1712, limitsSet: 386 },
    demo: true,
  };
}