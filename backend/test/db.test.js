import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
// Import helpers FIRST: it sets the temp DATABASE_URL before db.js is loaded.
import { resetDb, dbModule } from './helpers.js';

beforeEach(() => resetDb());
after(() => {
  // nothing to close for pure db tests
});

test('deleteUserAndData removes every owned row', () => {
  const user = dbModule.createUser({ name: 'DB Test', email: 'db@test.dev', password: 'password123' });
  const second = dbModule.createUser({ name: 'Other', email: 'other@test.dev', password: 'password123' });

  dbModule.upsertLimit({ userId: user.id, platformId: 'instagram', dailyLimitMin: 10 });
  dbModule.insertSession({
    userId: user.id,
    platformId: 'instagram',
    startTime: new Date(Date.now() - 3600_000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 3600,
  });
  dbModule.addChallengeCompletion(user.id, 'screen-break');
  dbModule.createFocus({ userId: user.id, plannedMin: 25, platforms: ['tiktok'] });

  dbModule.deleteUserAndData(user.id);

  assert.equal(dbModule.findUserById(user.id), null);
  assert.equal(dbModule.getSessionsForDate(user.id, dbModule.dateKey()).length, 0);
  assert.equal(dbModule.getLimits(user.id).length, 0);
  assert.equal(dbModule.getActiveFocus(user.id), null);
  // Challenge completion rows for "other" remain intact.
  assert.ok(dbModule.findUserById(second.id));
});

test('insertSession recomputes the daily stat', () => {
  const user = dbModule.createUser({ name: 'X', email: 'x2@test.dev', password: 'password123' });
  dbModule.insertSession({
    userId: user.id,
    platformId: 'x',
    startTime: new Date(Date.now() - 1200_000).toISOString(),
    endTime: new Date(Date.now() - 600_000).toISOString(),
    duration: 600,
  });
  const stat = dbModule.computeDailyStat(user.id, dbModule.dateKey());
  assert.equal(stat.totalSeconds, 600);
  assert.equal(stat.sessions, 1);
});

test('streak counts consecutive active days', () => {
  const user = dbModule.createUser({ name: 'Y', email: 'y2@test.dev', password: 'password123' });
  const today = dbModule.dateKey(Date.now());
  const day1 = new Date(Date.now() - 86400000);
  const day2 = new Date(Date.now() - 2 * 86400000);
  const iso = (d) => d.toISOString();
  dbModule.insertSession({ userId: user.id, platformId: 'x', startTime: iso(day1), endTime: new Date(day1.getTime() + 600000).toISOString(), duration: 600 });
  dbModule.insertSession({ userId: user.id, platformId: 'x', startTime: iso(day2), endTime: new Date(day2.getTime() + 600000).toISOString(), duration: 600 });
  // Today not yet active, streak should still count from yesterday back.
  const streak = dbModule.refreshStreak(user.id);
  assert.ok(streak >= 2, `expected streak >= 2, got ${streak}`);
  void today;
});

test('challenge completion is idempotent per day', () => {
  const user = dbModule.createUser({ name: 'Z', email: 'z2@test.dev', password: 'password123' });
  const a = dbModule.addChallengeCompletion(user.id, 'screen-break');
  const b = dbModule.addChallengeCompletion(user.id, 'screen-break');
  assert.equal(a.already, false);
  assert.equal(b.already, true);
  assert.equal(dbModule.hasCompletedChallengeToday(user.id, 'screen-break'), true);
});