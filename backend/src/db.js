// Database layer — SQLite via Node's built-in `node:sqlite`.
//
// No native builds, no external database server needed, which keeps the MVP easy to
// run for beginners. The schema mirrors the PostgreSQL/MongoDB design in docs/DATABASE.md
// so swapping storage later means rewriting this one file, not the API.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

export function nowISO() {
  return new Date().toISOString();
}

// Day key (YYYY-MM-DD) for a given timestamp.
//
// IMPORTANT: usage_sessions rows are bucketed with `substr(startTime,1,10)` which is
// the UTC date of the ISO timestamp. `dateKey` deliberately uses the same UTC day so
// "today", streaks and daily charts always agree with the stored buckets.
export function dateKey(ts = Date.now()) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function newId() {
  return crypto.randomUUID();
}

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function openDatabase(filePath = config.databaseUrl) {
  ensureDir(filePath);
  const db = new DatabaseSync(filePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = OFF;');
  return db;
}

const db = openDatabase();
migrate(db);

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      dailyGoal INTEGER NOT NULL DEFAULT 90,
      goals TEXT NOT NULL DEFAULT '[]',
      platforms TEXT NOT NULL DEFAULT '[]',
      scrollTimes TEXT NOT NULL DEFAULT '[]',
      streak INTEGER NOT NULL DEFAULT 0,
      lastActiveDay TEXT,
      troubleLimitMin INTEGER NOT NULL DEFAULT 20,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '●',
      domain TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#0EA47E'
    );

    CREATE TABLE IF NOT EXISTS usage_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      platformId TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      tag TEXT NOT NULL DEFAULT 'web',
      source TEXT NOT NULL DEFAULT 'manual'
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_start ON usage_sessions(userId, startTime);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_open ON usage_sessions(userId, endTime);

    CREATE TABLE IF NOT EXISTS daily_stats (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      totalSeconds INTEGER NOT NULL DEFAULT 0,
      sessions INTEGER NOT NULL DEFAULT 0,
      longestSession INTEGER NOT NULL DEFAULT 0,
      attentionScore INTEGER NOT NULL DEFAULT 100,
      withinGoal INTEGER NOT NULL DEFAULT 1,
      UNIQUE(userId, date)
    );

    CREATE TABLE IF NOT EXISTS user_limits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      platformId TEXT,
      dailyLimitMin INTEGER,
      sessionLimitMin INTEGER,
      quietStart TEXT DEFAULT '',
      quietEnd TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_limits_user ON user_limits(userId);

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      duration TEXT NOT NULL DEFAULT '1 day'
    );

    CREATE TABLE IF NOT EXISTS challenge_completions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      challengeId TEXT NOT NULL,
      completedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cc_user_day
      ON challenge_completions(userId, substr(completedAt, 1, 10));

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      plannedMin INTEGER NOT NULL,
      platformsText TEXT NOT NULL DEFAULT '[]',
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reminder_events (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      level INTEGER NOT NULL,
      decision TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
  `);
  seedPlatforms(db);
  seedChallenges(db);
  bootstrapAdmin(db);
}

function seedPlatforms(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM platforms').get().n;
  if (count > 0) return;
  const insert = db.prepare(
    'INSERT INTO platforms (id, name, icon, domain, color) VALUES (?, ?, ?, ?, ?)',
  );
  const rows = [
    ['tiktok', 'TikTok', '🎵', 'tiktok.com', '#25F4EE'],
    ['instagram', 'Instagram', '📸', 'instagram.com', '#E1306C'],
    ['youtube', 'YouTube', '▶️', 'youtube.com', '#FF0000'],
    ['facebook', 'Facebook', '👥', 'facebook.com', '#1877F2'],
    ['x', 'X', '🐦', 'x.com', '#1C1C1C'],
    ['reddit', 'Reddit', '👽', 'reddit.com', '#FF4500'],
    ['snapchat', 'Snapchat', '👻', 'snapchat.com', '#FFFC00'],
    ['linkedin', 'LinkedIn', '💼', 'linkedin.com', '#0A66C2'],
  ];
  for (const r of rows) insert.run(...r);
}

function seedChallenges(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM challenges').get().n;
  if (count > 0) return;
  const insert = db.prepare(
    'INSERT INTO challenges (id, title, description, category, duration) VALUES (?, ?, ?, ?, ?)',
  );
  const rows = [
    ['stay-calm-morning', 'Morning treasure', 'Stay off social media for the first 30 minutes after waking.', 'morning', '1 day'],
    ['screen-break', 'Breathe out loud', 'Take a 10-minute, totally screen-free break today.', 'focus', '1 day'],
    ['no-scroll-meals', 'Savory without the scroll', 'Keep social media out of mealtimes today.', 'focus', '1 day'],
    ['bedroom-phone-out', 'A phone-free bedroom', 'Keep social media outside the bedroom tonight.', 'evening', '1 day'],
    ['intentional-session', 'One intentional session', 'Use social media intentionally — decide what you want before you open it.', 'general', '1 day'],
    ['goal-20', 'Under the radar', 'Keep every scrolling session today under 20 minutes.', 'focus', '1 day'],
    ['double-task', 'One less reopen', 'Open social media at least 2 fewer times than usual today.', 'general', '1 day'],
    ['evening-replace', 'Softer evening', 'Replace one evening scroll with a walk, stretch, or a couple of pages of a book.', 'evening', '1 day'],
    ['first-check', 'A delayed first check', 'Let your first social-media check of the day wait until after your morning routine.', 'morning', '1 day'],
    ['water-break', 'Hydration station', 'Between two scrolling sessions, drink a full glass of water.', 'focus', '1 day'],
  ];
  for (const r of rows) insert.run(...r);
}

function bootstrapAdmin(db) {
  if (!config.admin.bootstrap) return;
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existing) return;
  const insert = db.prepare(
    'INSERT INTO users (id, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
  );
  insert.run(
    newId(),
    'ScrollGuard Admin',
    config.admin.email.toLowerCase(),
    hashPassword(config.admin.password),
    'admin',
    nowISO(),
  );
  console.log(`[scrollguard] Bootstrap admin created: ${config.admin.email}`);
}

// ---------------------------------------------------------------- users

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase()) || null;
}

export function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

export function createUser({ name, email, password, dailyGoal = 90, goals = [], platforms = [], scrollTimes = [], role = 'user' }) {
  const id = newId();
  db.prepare(
    `INSERT INTO users (id, name, email, passwordHash, dailyGoal, goals, platforms, scrollTimes, role, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, name, email.toLowerCase(), hashPassword(password), dailyGoal, JSON.stringify(goals), JSON.stringify(platforms), JSON.stringify(scrollTimes), role, nowISO());
  return findUserById(id);
}

export function updateUser(id, patch) {
  const user = findUserById(id);
  if (!user) return null;
  const allowed = ['name', 'dailyGoal', 'goals', 'platforms', 'scrollTimes', 'troubleLimitMin'];
  const next = { ...user };
  for (const key of allowed) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  next.goals = JSON.stringify(next.goals);
  next.platforms = JSON.stringify(next.platforms);
  next.scrollTimes = JSON.stringify(next.scrollTimes);
  db.prepare(
    `UPDATE users SET name=?, dailyGoal=?, goals=?, platforms=?, scrollTimes=?, troubleLimitMin=? WHERE id=?`,
  ).run(next.name, next.dailyGoal, next.goals, next.platforms, next.scrollTimes, next.troubleLimitMin, id);
  return findUserById(id);
}

export function updateStreak(id, streak, lastActiveDay) {
  db.prepare('UPDATE users SET streak=?, lastActiveDay=? WHERE id=?').run(streak, lastActiveDay, id);
}

export function prepareUpdatePassword(id, plainPassword) {
  db.prepare('UPDATE users SET passwordHash=? WHERE id=?').run(hashPassword(plainPassword), id);
}

export function countUsers() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

// Delete a user and every owned row, in one transaction (there are no foreign-key
// cascades in SQLite by default, so we remove them explicitly).
export function deleteUserAndData(userId) {
  db.exec('BEGIN');
  try {
    for (const table of ['usage_sessions', 'daily_stats', 'user_limits', 'challenge_completions', 'focus_sessions', 'reminder_events', 'reset_tokens']) {
      db.prepare(`DELETE FROM ${table} WHERE userId = ?`).run(userId);
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
// For testing: reset the DB entirely.
export function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS reset_tokens;
    DROP TABLE IF EXISTS reminder_events;
    DROP TABLE IF EXISTS focus_sessions;
    DROP TABLE IF EXISTS challenge_completions;
    DROP TABLE IF EXISTS challenges;
    DROP TABLE IF EXISTS user_limits;
    DROP TABLE IF EXISTS daily_stats;
    DROP TABLE IF EXISTS usage_sessions;
    DROP TABLE IF EXISTS platforms;
    DROP TABLE IF EXISTS users;
  `);
  migrate(db);
}

// ---------------------------------------------------------------- platforms

export function getPlatforms() {
  return db.prepare('SELECT * FROM platforms ORDER BY name').all();
}

// ---------------------------------------------------------------- limits

export function getLimits(userId) {
  return db
    .prepare('SELECT * FROM user_limits WHERE userId = ? ORDER BY COALESCE(platformId, \'\')')
    .all(userId)
    .map((l) => ({ ...l, platformId: l.platformId || null }));
}

export function getLimitForPlatform(userId, platformId) {
  if (platformId) {
    return db.prepare('SELECT * FROM user_limits WHERE userId = ? AND platformId = ?').get(userId, platformId) || null;
  }
  return db.prepare('SELECT * FROM user_limits WHERE userId = ? AND platformId IS NULL').get(userId) || null;
}

export function getGlobalLimit(userId) {
  return getLimitForPlatform(userId, null);
}

export function upsertLimit({ userId, platformId, dailyLimitMin, sessionLimitMin, quietStart, quietEnd }) {
  const existing = getLimitForPlatform(userId, platformId || null);
  if (existing) {
    db.prepare(
      `UPDATE user_limits SET dailyLimitMin=?, sessionLimitMin=?, quietStart=?, quietEnd=? WHERE id=?`,
    ).run(
      dailyLimitMin ?? existing.dailyLimitMin,
      sessionLimitMin ?? existing.sessionLimitMin,
      quietStart ?? existing.quietStart ?? '',
      quietEnd ?? existing.quietEnd ?? '',
      existing.id,
    );
    return getLimitForPlatform(userId, existing.platformId ?? null);
  }
  const id = newId();
  db.prepare(
    `INSERT INTO user_limits (id, userId, platformId, dailyLimitMin, sessionLimitMin, quietStart, quietEnd)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, platformId ?? null, dailyLimitMin ?? null, sessionLimitMin ?? null, quietStart ?? '', quietEnd ?? '');
  return getLimitForPlatform(userId, platformId ?? null);
}

export function updateLimit(id, userId, patch) {
  const row = db.prepare('SELECT * FROM user_limits WHERE id = ? AND userId = ?').get(id, userId);
  if (!row) return null;
  db.prepare(
    `UPDATE user_limits SET dailyLimitMin=?, sessionLimitMin=?, quietStart=?, quietEnd=? WHERE id=?`,
  ).run(
    patch.dailyLimitMin !== undefined ? patch.dailyLimitMin : row.dailyLimitMin,
    patch.sessionLimitMin !== undefined ? patch.sessionLimitMin : row.sessionLimitMin,
    patch.quietStart !== undefined ? patch.quietStart : row.quietStart || '',
    patch.quietEnd !== undefined ? patch.quietEnd : row.quietEnd || '',
    id,
  );
  return db.prepare('SELECT * FROM user_limits WHERE id = ?').get(id);
}

export function deleteLimit(id, userId) {
  const row = db.prepare('SELECT * FROM user_limits WHERE id = ? AND userId = ?').get(id, userId);
  if (!row) return false;
  db.prepare('DELETE FROM user_limits WHERE id = ?').run(id);
  return true;
}

// ---------------------------------------------------------------- usage sessions

export function insertSession({ userId, platformId, startTime, endTime, duration, tag = 'web', source = 'manual' }) {
  const id = newId();
  // A live session starts with duration 0; committed sessions pass a real duration.
  const dur = Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0;
  db.prepare(
    `INSERT INTO usage_sessions (id, userId, platformId, startTime, endTime, duration, tag, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, platformId ?? null, startTime, endTime ?? null, dur, tag, source);
  recomputeStatsForSession(userId, startTime, endTime);
  return { id, userId, platformId: platformId ?? null, startTime, endTime: endTime ?? null, duration: dur, tag, source };
}

export function getOpenSession(userId) {
  return db.prepare('SELECT * FROM usage_sessions WHERE userId = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1').get(userId) || null;
}

export function getSessionById(id) {
  return db.prepare('SELECT * FROM usage_sessions WHERE id = ?').get(id) || null;
}

export function closeSession(id, endTime = nowISO()) {
  const row = getSessionById(id);
  if (!row || row.endTime) return row || null;
  const duration = Math.max(0, Math.round((new Date(endTime) - new Date(row.startTime)) / 1000));
  db.prepare('UPDATE usage_sessions SET endTime=?, duration=? WHERE id=?').run(endTime, duration, id);
  const updated = getSessionById(id);
  recomputeStatsForSession(updated.userId, updated.startTime, updated.endTime);
  return updated;
}

export function getSessionsForDate(userId, day) {
  return db
    .prepare('SELECT * FROM usage_sessions WHERE userId = ? AND substr(startTime,1,10) = ? ORDER BY startTime')
    .all(userId, day);
}

export function getSessionsBetween(userId, from, to) {
  return db
    .prepare('SELECT * FROM usage_sessions WHERE userId = ? AND startTime >= ? AND startTime < ?')
    .all(userId, from, to);
}

export function getRecentSessions(userId, limit = 20) {
  return db
    .prepare('SELECT * FROM usage_sessions WHERE userId = ? ORDER BY startTime DESC LIMIT ?')
    .all(userId, limit);
}

export function getDistinctActiveDays(userId) {
  return db.prepare('SELECT DISTINCT substr(startTime,1,10) AS day FROM usage_sessions WHERE userId = ? ORDER BY day').all(userId);
}

// ---------------------------------------------------------------- daily stats
// Lazy recompute — whenever sessions change we recompute only the affected day.

function recomputeStatsForSession(userId, startISO, endISO) {
  const day = dateKey(new Date(startISO).getTime());
  const dur = endISO ? Math.max(0, Math.round((new Date(endISO) - new Date(startISO)) / 1000)) : 0;
  const stmt = db.prepare(
    `SELECT COALESCE(SUM(duration),0) AS totalSeconds, COUNT(*) AS sessions, COALESCE(MAX(duration),0) AS longest
     FROM usage_sessions WHERE userId = ? AND substr(startTime,1,10) = ?`,
  );
  const agg = stmt.get(userId, day);
  const totalSeconds = agg.totalSeconds + dur;
  const sessions = agg.sessions + 1;
  const longest = Math.max(agg.longest, dur);
  upsertDailyStat(userId, day, { totalSeconds, sessions, longest });
}

export function upsertDailyStat(userId, day, { totalSeconds, sessions, longest }) {
  const existing = db.prepare('SELECT * FROM daily_stats WHERE userId = ? AND date = ?').get(userId, day);
  if (existing) {
    db.prepare('UPDATE daily_stats SET totalSeconds=?, sessions=?, longestSession=? WHERE id=?').run(totalSeconds, sessions, longest, existing.id);
  } else {
    db.prepare('INSERT INTO daily_stats (id, userId, date, totalSeconds, sessions, longestSession, attentionScore, withinGoal) VALUES (?, ?, ?, ?, ?, ?, 100, 1)').run(newId(), userId, day, totalSeconds, sessions, longest);
  }
}

export function computeDailyStat(userId, day) {
  const agg = db
    .prepare('SELECT COALESCE(SUM(duration),0) AS totalSeconds, COUNT(*) AS sessions, COALESCE(MAX(duration),0) AS longest FROM usage_sessions WHERE userId = ? AND substr(startTime,1,10) = ?')
    .get(userId, day);
  return {
    date: day,
    totalSeconds: agg.totalSeconds,
    sessions: agg.sessions,
    longestSession: agg.longest,
  };
}

export function getDailyStatsBetween(userId, fromDay, toDay) {
  const rows = db
    .prepare('SELECT * FROM daily_stats WHERE userId = ? AND date >= ? AND date <= ? ORDER BY date')
    .all(userId, fromDay, toDay);
  const byDay = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  for (let day = fromDay; day <= toDay; day = addDays(day, 1)) {
    if (byDay.has(day)) out.push(byDay.get(day));
    else out.push({ userId, date: day, totalSeconds: 0, sessions: 0, longestSession: 0, attentionScore: 100, withinGoal: 1 });
  }
  return out;
}

// Local-time day arithmetic on a "YYYY-MM-DD" string (avoids UTC boundary bugs).
export function addDays(dayStr, n) {
  const [y, m, d] = dayStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return localDayString(dt);
}

export function localDayString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Derives the streak (consecutive days with at least one tracked session, ending today
// or yesterday so an unused today doesn't break it).
export function refreshStreak(userId) {
  const days = getDistinctActiveDays(userId).map((r) => r.day);
  const set = new Set(days);
  const today = dateKey(Date.now());
  let cursor = today;
  // If today already has data, count from today; otherwise count from yesterday.
  if (!set.has(today)) cursor = addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  updateStreak(userId, streak, today);
  return streak;
}

// ---------------------------------------------------------------- reminders

export function recordReminder({ userId, sessionId, level, decision }) {
  db.prepare('INSERT INTO reminder_events (id, userId, sessionId, level, decision, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(newId(), userId, sessionId, level, decision, nowISO());
}

// ---------------------------------------------------------------- focus

export function createFocus({ userId, plannedMin, platforms }) {
  const id = newId();
  db.prepare('INSERT INTO focus_sessions (id, userId, startTime, plannedMin, platformsText, completed) VALUES (?, ?, ?, ?, ?, 0)').run(id, userId, nowISO(), plannedMin, JSON.stringify(platforms || []));
  return getFocusById(id);
}

export function getFocusById(id) {
  return db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(id) || null;
}

export function getActiveFocus(userId) {
  return db.prepare('SELECT * FROM focus_sessions WHERE userId = ? AND completed = 0 ORDER BY startTime DESC LIMIT 1').get(userId) || null;
}

export function endFocus(id, completed = true) {
  db.prepare('UPDATE focus_sessions SET completed=? WHERE id=?').run(completed ? 1 : 0, id);
  return getFocusById(id);
}

// ---------------------------------------------------------------- challenges

export function getChallenges() {
  return db.prepare('SELECT * FROM challenges ORDER BY category, title').all();
}

export function getChallengeById(id) {
  return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id) || null;
}

export function addChallengeCompletion(userId, challengeId) {
  if (hasCompletedChallengeToday(userId, challengeId)) return { already: true };
  const id = newId();
  db.prepare('INSERT INTO challenge_completions (id, userId, challengeId, completedAt) VALUES (?, ?, ?, ?)').run(id, userId, challengeId, nowISO());
  return { already: false };
}

export function hasCompletedChallengeToday(userId, challengeId) {
  const day = dateKey(Date.now());
  const row = db
    .prepare('SELECT id FROM challenge_completions WHERE userId = ? AND challengeId = ? AND substr(completedAt,1,10) = ?')
    .get(userId, challengeId, day);
  return Boolean(row);
}

export function countCompletionsToday() {
  const day = dateKey(Date.now());
  return db.prepare('SELECT COUNT(*) AS n FROM challenge_completions WHERE substr(completedAt,1,10) = ?').get(day).n;
}

// ---------------------------------------------------------------- reset tokens

export function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM reset_tokens WHERE userId = ?').run(userId);
  db.prepare('INSERT INTO reset_tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, userId, expires);
  return token;
}

export function findResetToken(token) {
  const row = db.prepare('SELECT * FROM reset_tokens WHERE token = ?').get(token) || null;
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  return row;
}

export function deleteResetToken(token) {
  db.prepare('DELETE FROM reset_tokens WHERE token = ?').run(token);
}

export { db };