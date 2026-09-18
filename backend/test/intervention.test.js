import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  thresholdSeconds,
  interventionLevel,
  reminderForLevel,
  inQuietHours,
  formatQuietHours,
} from '../src/services/intervention.js';

const baseUser = { troubleLimitMin: 20 };

test('thresholdSeconds uses limit when present', () => {
  assert.equal(thresholdSeconds(baseUser, { sessionLimitMin: 10 }), 600);
  assert.equal(thresholdSeconds(baseUser, null), 1200);
});

test('intervention levels escalate with elapsed time', () => {
  const l1 = interventionLevel({ user: baseUser, platformLimit: null, elapsedSec: 20 * 60 });
  const l2 = interventionLevel({ user: baseUser, platformLimit: null, elapsedSec: 31 * 60 });
  const l3 = interventionLevel({ user: baseUser, platformLimit: null, elapsedSec: 51 * 60 });
  assert.equal(l1, 1);
  assert.equal(l2, 2);
  assert.equal(l3, 3);
});

test('no reminder under threshold', () => {
  const l0 = interventionLevel({ user: baseUser, platformLimit: null, elapsedSec: 5 * 60 });
  assert.equal(l0, 0);
});

test('daily-limit breach also triggers level 1', () => {
  const level = interventionLevel({
    user: baseUser,
    platformLimit: { dailyLimitMin: 10 },
    elapsedSec: 60,
    todayPlatformSec: 11 * 60,
    todayDailyLimitMin: 10,
  });
  assert.equal(level, 1);
});

test('reminder messages are supportive, never shaming', () => {
  for (const level of [1, 2, 3]) {
    const r = reminderForLevel(level, { elapsedMin: 25, plannedMin: 20, platformName: 'tiktok', quietHours: false });
    assert.ok(r.message.length > 10);
    const lower = r.message.toLowerCase();
    for (const forbidden of ['waste', 'fail', 'lazy', 'addict']) {
      assert.ok(!lower.includes(forbidden), `"${forbidden}" should not appear in level ${level}`);
    }
  }
});

test('level 3 includes reset suggestions', () => {
  const r = reminderForLevel(3, { elapsedMin: 60, plannedMin: 20, platformName: 'x', quietHours: false });
  assert.ok(r.resetOptions.includes('Breathe'));
  assert.ok(r.buttons.some((b) => b.includes('reset')));
});

test('quiet hours detection handles overnight ranges', () => {
  const day = new Date(2026, 8, 18, 12, 0);
  const night = new Date(2026, 8, 18, 23, 0);
  const early = new Date(2026, 8, 18, 5, 0);
  assert.equal(inQuietHours(day, '22:00', '07:00'), false);
  assert.equal(inQuietHours(night, '22:00', '07:00'), true);
  assert.equal(inQuietHours(early, '22:00', '07:00'), true);
  assert.equal(inQuietHours(day, '09:00', '17:00'), true);
  assert.equal(inQuietHours(day, '', ''), false);
});

test('formatQuietHours', () => {
  assert.equal(formatQuietHours('22:00', '07:00'), '22:00 – 07:00');
  assert.equal(formatQuietHours('', ''), '');
});