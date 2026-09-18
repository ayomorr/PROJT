import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, startServer, stopServer, makeClient } from './helpers.js';

let base;
beforeEach(() => resetDb());
after(() => stopServer());

test('registration creates a user and logs them in', async () => {
  base = base || (await startServer());
  const c = makeClient(base);
  const res = await c.post('/api/auth/register', {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'supersecret1',
    dailyGoalMin: 60,
    goals: ['Improve productivity'],
    platforms: ['instagram', 'youtube'],
    scrollTimes: ['Evening'],
  });
  assert.equal(res.status, 201);
  assert.ok(res.json.token);
  assert.equal(res.json.user.email, 'ada@example.com');
  assert.deepEqual(res.json.user.goals, ['Improve productivity']);
  assert.equal(res.json.user.role, 'user');
});

test('duplicate email is rejected', async () => {
  base = base || (await startServer());
  const c = makeClient(base);
  await c.post('/api/auth/register', { name: 'Al', email: 'dup@example.com', password: 'password123' });
  const second = await c.post('/api/auth/register', { name: 'Bo', email: 'dup@example.com', password: 'password123' });
  assert.equal(second.status, 409);
});

test('login validates credentials', async () => {
  base = base || (await startServer());
  const c = makeClient(base);
  await c.post('/api/auth/register', { name: 'Al', email: 'login@example.com', password: 'password123' });

  const bad = await c.post('/api/auth/login', { email: 'login@example.com', password: 'wrongpass' });
  assert.equal(bad.status, 401);

  const good = await c.post('/api/auth/login', { email: 'login@example.com', password: 'password123' });
  assert.equal(good.status, 200);
  assert.ok(good.json.token);
});

test('protected routes need auth', async () => {
  base = base || (await startServer());
  const anon = makeClient(base);
  const res = await anon.get('/api/user/profile');
  assert.equal(res.status, 401);
});

test('rate limit triggers after many attempts', async () => {
  base = base || (await startServer());
  const c = makeClient(base);
  const results = [];
  for (let i = 0; i < 22; i++) {
    results.push((await c.post('/api/auth/login', { email: 'x@example.com', password: 'password123' })).status);
  }
  assert.ok(results.slice(-3).some((s) => s === 429), 'expected a 429 after the limit');
});

test('forgot + reset password flow works', async () => {
  base = base || (await startServer());
  const c = makeClient(base);
  await c.post('/api/auth/register', { name: 'Amy', email: 'reset@example.com', password: 'password123' });

  const forgot = await c.post('/api/auth/forgot-password', { email: 'reset@example.com' });
  assert.equal(forgot.status, 200);
  assert.ok(forgot.json.resetToken, 'dev mode returns the token');

  const badReset = await c.post('/api/auth/reset-password', { token: 'bogus', password: 'newpass123' });
  assert.equal(badReset.status, 400);

  const goodReset = await c.post('/api/auth/reset-password', { token: forgot.json.resetToken, password: 'newpass123' });
  assert.equal(goodReset.status, 200);

  const old = await c.post('/api/auth/login', { email: 'reset@example.com', password: 'password123' });
  assert.equal(old.status, 401);
  const fresh = await c.post('/api/auth/login', { email: 'reset@example.com', password: 'newpass123' });
  assert.equal(fresh.status, 200);
});

test('account deletion removes the user entirely', async () => {
  base = base || (await startServer());
  const c = makeClient(base);
  await c.post('/api/auth/register', { name: 'Amy', email: 'delete-me@example.com', password: 'password123' });
  const del = await c.post('/api/auth/login', { email: 'delete-me@example.com', password: 'password123' });
  const authed = makeClient(base, { token: del.json.token });
  const res = await authed.delete('/api/user/account');
  assert.equal(res.status, 200);
  const gone = await c.post('/api/auth/login', { email: 'delete-me@example.com', password: 'password123' });
  assert.equal(gone.status, 401);
});
