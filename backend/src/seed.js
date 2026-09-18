// Dev/demo seeder.
//
// `npm run seed` loads:
//   1. The demo user (demo@scrollguard.app / demo1234) with realistic usage data.
//   2. The admin user (from env).
//   3. The challenge library.
//
// Demo data is FAKE — it exists so new developers can see the whole product working
// without waiting for real usage. The frontend labels it "Demo Data" whenever it is
// shown.
import { config } from './config.js';
import * as db from './db.js';

// Simple deterministic pseudo-random generator (seedable) so the demo data looks
// natural but is stable across runs.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const DAILY_PLAN = [
  // [platformId, avgMinutesBase, sessionsPerDay]
  ['instagram', 42, 4],
  ['tiktok', 30, 3],
  ['youtube', 38, 2],
  ['x', 12, 3],
  ['reddit', 9, 1],
];

function platformWeight(platform) {
  return platform[1];
}

// Build one week of usage starting a given number of days ago.
function generateWeek(userId, daysAgoStart, daysAgoEnd, rand, weekdayScale) {
  for (let d = daysAgoStart; d >= daysAgoEnd; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    const weekend = dow === 0 || dow === 6 ? 1.35 : 1;
    for (const [platformId, base, sessionCount] of DAILY_PLAN) {
      const sessions = Math.max(1, Math.round(sessionCount * weekdayScale * (0.7 + rand() * 0.6)));
      let cursor = new Date(date);
      cursor.setHours(7 + Math.floor(rand() * 3), Math.floor(rand() * 60), 0, 0);
      for (let i = 0; i < sessions; i++) {
        const minutes = Math.round(base * weekend * weekdayScale * (0.4 + rand() * 1.2));
        if (minutes < 1) continue;
        const start = new Date(cursor);
        const end = new Date(start.getTime() + minutes * 60000);
        db.insertSession({
          userId,
          platformId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          duration: minutes * 60,
          tag: 'web',
          source: 'demo',
        });
        // jump ahead 20–90 minutes before the next session
        cursor = new Date(start.getTime() + (20 + rand() * 70) * 60000);
      }
    }
  }
}

export function seedDemoUser() {
  const existing = db.findUserByEmail(config.demoUser.email);
  if (existing) {
    console.log('[seed] Demo user exists — skipping user creation (keeping existing data).');
    return existing;
  }

  const user = db.createUser({
    name: 'Demo User',
    email: config.demoUser.email,
    password: config.demoUser.password,
    dailyGoal: 90,
    goals: ['Reduce social-media time', 'Stop endless scrolling'],
    platforms: ['instagram', 'tiktok', 'youtube', 'x', 'reddit'],
    scrollTimes: ['Evening', 'Before sleeping'],
  });

  db.upsertLimit({ userId: user.id, platformId: 'instagram', dailyLimitMin: 45, sessionLimitMin: 20 });
  db.upsertLimit({ userId: user.id, platformId: 'tiktok', dailyLimitMin: 30, sessionLimitMin: 15 });
  db.upsertLimit({ userId: user.id, platformId: 'youtube', dailyLimitMin: 60, sessionLimitMin: 30 });
  db.upsertLimit({ userId: user.id, platformId: 'x', dailyLimitMin: 20, sessionLimitMin: 10 });
  db.upsertLimit({
    userId: user.id,
    platformId: null,
    dailyLimitMin: null,
    sessionLimitMin: null,
    quietStart: '22:00',
    quietEnd: '07:00',
  });

  const rand = rng(20260918);
  // Two weeks of history; last week slightly lighter than the week before (improvement story).
  generateWeek(user.id, 13, 7, rand, 1.0);
  generateWeek(user.id, 6, 0, rand, 0.82);

  // A few open "today" sessions are not needed — committed sessions are enough.
  db.refreshStreak(user.id);
  console.log(`[seed] Demo user ready: ${config.demoUser.email} / ${config.demoUser.password}`);
  return user;
}

export function seedAll() {
  seedDemoUser();
  const challenges = db.getChallenges().length;
  const users = db.countUsers();
  console.log(`[seed] Challenges: ${challenges} · Users: ${users}`);
  console.log('[seed] Done.');
}

// Running as a script directly.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href) {
  seedAll();
}