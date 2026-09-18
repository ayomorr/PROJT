import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectCrisis, detectDistress, validateStructured, parseStructured, offlineCoach } from '../src/services/aiGuard.js';

test('crisis detection catches self-harm mentions', () => {
  for (const t of ['I want to kill myself', 'I keep self harming', 'I want to die', "I don't want to live anymore"]) {
    assert.equal(detectCrisis(t), true, `should detect: ${t}`);
  }
  assert.equal(detectCrisis('I want to scroll less'), false);
});

test('distress detection catches anxiety/depression mentions', () => {
  assert.equal(detectDistress('I feel so anxious'), true);
  assert.equal(detectDistress("I'm depressed all day"), true);
  assert.equal(detectDistress('my feed is boring'), false);
});

test('structured response validation', () => {
  const ok = validateStructured({ message: 'Hi', insight: 'x', suggestedAction: 'y', tone: 'supportive' });
  assert.ok(ok && ok.message === 'Hi');

  const missing = validateStructured({ insight: 'no message' });
  assert.equal(missing, null);

  const badTone = validateStructured({ message: 'Hello', insight: '', suggestedAction: '', tone: 'angry' });
  assert.equal(badTone.tone, 'supportive'); // coerced to a safe tone
});

test('parseStructured handles markdown-wrapped JSON', () => {
  const parsed = parseStructured('```json\n{"message":"ok"}\n```');
  assert.equal(parsed.message, 'ok');
  assert.equal(parseStructured('not json'), null);
});

test('offline coach always returns a valid structured reply', async () => {
  const ctx = { weeklyMinutes: 350, deltaMinutes: -40, sessions: 21, avgSessionMinutes: 16, longestSessionMinutes: 50, mostActiveHour: 22, topPlatform: 'instagram', topPlatformMinutes: 140, patternText: 'night' };
  for (const q of ['Why do I keep scrolling at night?', 'How did I do this week?', 'What should I do when I feel like scrolling?', 'I am spending too much time on apps', 'anything else']) {
    const reply = validateStructured(offlineCoach(ctx, q));
    assert.ok(reply, `should respond to: ${q}`);
    assert.ok(reply.message.length > 0);
  }
});