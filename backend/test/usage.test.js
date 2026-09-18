import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, startServer, stopServer, registerAndLogin } from './helpers.js';

let base;
let t;
function auth() {
  return t;
}

beforeEach(async () => {
  resetDb();
  base = base || (await startServer());
  t = await registerAndLogin(base);
});
after(() => stopServer());

function iso(deltaMin) {
  return new Date(Date.now() + deltaMin * 60000).toISOString();
}

test('manual committed session shows up in today stats', async () => {
  const { client } = auth();
  const res = await client.post('/api/usage/session', {
    platform: 'instagram',
    startTime: iso(-90),
    endTime: iso(-60),
    source: 'manual',
  });
  assert.equal(res.status, 201);

  const today = await client.get('/api/usage/today');
  assert.equal(today.status, 200);
  assert.equal(today.json.sessionCount, 1);
  assert.equal(today.json.totalSeconds, 1800);
  assert.equal(today.json.perPlatform[0].platformId, 'instagram');
  assert.equal(today.json.perPlatform[0].totalSeconds, 1800);
});

test('live session start → active → end flow', async () => {
  const { client } = auth();
  const start = await client.post('/api/usage/session/start', { platform: 'tiktok', source: 'extension' });
  assert.equal(start.status, 201);
  assert.ok(start.json.sessionId);

  const active = await client.get('/api/usage/active');
  assert.equal(active.json.active, true);
  assert.equal(active.json.session.platformId, 'tiktok');
  assert.ok(active.json.session.elapsedSec >= 0);
  assert.ok('interventionLevel' in active.json);

  const end = await client.post('/api/usage/session/end', { sessionId: start.json.sessionId });
  assert.equal(end.status, 200);
  assert.ok(end.json.session.duration >= 0);
  assert.ok(end.json.session.endTime);

  const gone = await client.get('/api/usage/active');
  assert.equal(gone.json.active, false);
});

test('unsupported platform is rejected clearly', async () => {
  const { client } = auth();
  const res = await client.post('/api/usage/session', {
    platform: 'mystery-site',
    startTime: iso(-10),
    endTime: iso(-5),
  });
  assert.equal(res.status, 400);
});

test('attention score is returned with today stats', async () => {
  const { client } = auth();
  const res = await client.get('/api/usage/today');
  assert.equal(res.status, 200);
  assert.ok(res.json.attentionScore >= 12 && res.json.attentionScore <= 100);
  assert.ok(res.json.streak >= 0);
});

test('weekly endpoint aggregates multiple days', async () => {
  const { client } = auth();
  await client.post('/api/usage/session', { platform: 'youtube', startTime: iso(-60 * 26), endTime: iso(-60 * 25) });
  await client.post('/api/usage/session', { platform: 'youtube', startTime: iso(-30), endTime: iso(-20) });

  const weekly = await client.get('/api/usage/weekly');
  assert.equal(weekly.status, 200);
  assert.ok(weekly.json.weekly.totalMinutes >= 10 + 10);
  assert.equal(weekly.json.weekly.sessions, 2);
  assert.ok(weekly.json.weekly.platformRank.length === 1);
  assert.equal(weekly.json.weekly.platformRank[0].platformId, 'youtube');
  assert.ok(Array.isArray(weekly.json.weekly.daily));
  assert.equal(weekly.json.weekly.daily.length, 7);
});

test('reminder response is recorded', async () => {
  const { client } = auth();
  const start = await client.post('/api/usage/session/start', { platform: 'reddit' });
  const res = await client.post('/api/usage/session/reminder', {
    sessionId: start.json.sessionId,
    level: 2,
    decision: 'break',
  });
  assert.equal(res.status, 200);
});