import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAttentionScore, scoreColor, scoreLabel } from '../src/services/attentionScore.js';

test('perfect day scores 100', () => {
  const score = computeAttentionScore(
    { totalSeconds: 3600, sessions: 2, longestSession: 1800, reopens: 1, nightSeconds: 0, breaksTaken: 1 },
    { dailyGoalMin: 90 },
  );
  assert.equal(score, 100);
});

test('staying within goal keeps score high', () => {
  const score = computeAttentionScore(
    { totalSeconds: 60 * 30, sessions: 3, longestSession: 1200, reopens: 2, nightSeconds: 0, breaksTaken: 0 },
    { dailyGoalMin: 90 },
  );
  assert.ok(score >= 75, `expected >=75, got ${score}`);
});

test('heavy over-goal usage lowers the score', () => {
  const score = computeAttentionScore(
    { totalSeconds: 60 * 240, sessions: 14, longestSession: 4800, reopens: 12, nightSeconds: 3600, breaksTaken: 0 },
    { dailyGoalMin: 60 },
  );
  assert.ok(score < 60, `expected <60, got ${score}`);
});

test('score never drops below 12 (no total-failure framing)', () => {
  const score = computeAttentionScore(
    { totalSeconds: 60 * 900, sessions: 99, longestSession: 60 * 60, reopens: 60, nightSeconds: 60 * 60 * 8, breaksTaken: 0 },
    { dailyGoalMin: 30 },
  );
  assert.ok(score >= 12, `got ${score}`);
});

test('taking breaks earns a small recovery bonus', () => {
  const noBreaks = computeAttentionScore(
    { totalSeconds: 60 * 60, sessions: 6, longestSession: 2400, reopens: 4, nightSeconds: 0, breaksTaken: 0 },
    { dailyGoalMin: 90 },
  );
  const withBreaks = computeAttentionScore(
    { totalSeconds: 60 * 60, sessions: 6, longestSession: 2400, reopens: 4, nightSeconds: 0, breaksTaken: 3 },
    { dailyGoalMin: 90 },
  );
  assert.ok(withBreaks >= noBreaks);
});

test('score helpers are bounded', () => {
  for (const s of [100, 80, 60, 40, 12]) {
    assert.ok(['good', 'mid', 'low'].includes(scoreColor(s)));
    assert.ok(typeof scoreLabel(s) === 'string' && scoreLabel(s).length > 0);
  }
});