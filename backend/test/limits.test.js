import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, startServer, stopServer, registerAndLogin } from './helpers.js';
import * as dbModule from '../src/db.js';

let base;
let t;
beforeEach(async () => {
  resetDb();
  base = base || (await startServer());
  t = await registerAndLogin(base);
});
after(() => stopServer());

test('limits CRUD round-trip', async () => {
  const { client } = t;
  const create = await client.post('/api/limits', {
    platformId: 'instagram',
    dailyLimitMin: 45,
    sessionLimitMin: 20,
  });
  assert.equal(create.status, 200);
  assert.equal(create.json.limit.dailyLimitMin, 45);

  const list = await client.get('/api/limits');
  assert.equal(list.json.limits.length, 1);

  const update = await client.put(`/api/limits/${create.json.limit.id}`, { dailyLimitMin: 30 });
  assert.equal(update.status, 200);
  assert.equal(update.json.limit.dailyLimitMin, 30);

  const del = await client.delete(`/api/limits/${create.json.limit.id}`);
  assert.equal(del.status, 200);
  const after = await client.get('/api/limits');
  assert.equal(after.json.limits.length, 0);
});

test('global limits record quiet hours', async () => {
  const { client } = t;
  const res = await client.post('/api/limits', {
    platformId: 'global',
    quietStart: '22:00',
    quietEnd: '07:00',
  });
  assert.equal(res.status, 200);
  const list = await client.get('/api/limits');
  const global = list.json.limits.find((l) => l.platformId === null);
  assert.ok(global);
  assert.equal(global.quietStart, '22:00');
});

test('invalid platform is rejected', async () => {
  const { client } = t;
  const res = await client.post('/api/limits', { platformId: 'nope', dailyLimitMin: 10 });
  assert.equal(res.status, 400);
});

test('limit lifecycle works at the database layer too', async () => {
  const user = dbModule.findUserByEmail('test@scrollguard.dev');
  const limit = dbModule.upsertLimit({ userId: user.id, platformId: 'youtube', dailyLimitMin: 60 });
  assert.equal(dbModule.getLimitForPlatform(user.id, 'youtube').dailyLimitMin, 60);
  dbModule.deleteLimit(limit.id, user.id);
  assert.equal(dbModule.getLimitForPlatform(user.id, 'youtube'), null);
});