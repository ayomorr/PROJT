// Shared test bootstrap.
//
// Each test file runs in its own process, so giving this helper a unique temp DB
// before importing the app keeps every test file fully isolated.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scrollguard-test-'));
process.env.DATABASE_URL = path.join(tmpDir, 'test.db');
process.env.NODE_ENV = 'test';
process.env.AI_API_KEY = ''; // keep tests deterministic (offline coach)

export const { createApp } = await import('../src/app.js');
export const dbModule = await import('../src/db.js');
export const { clearRateLimitBuckets } = await import('../src/middleware/rateLimit.js');

export const app = createApp();
export const resetDb = () => {
  dbModule.resetDatabase();
  clearRateLimitBuckets();
};

let server;
let baseUrl;
export async function startServer() {
  if (server) return baseUrl;
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
  return baseUrl;
}

export async function stopServer() {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = null;
}

// Tiny fetch wrapper that returns { status, json } and handles auth via cookie jar.
export function makeClient(baseUrl, { token } = {}) {
  const cookieJar = {};
  async function request(method, url, { body, raw, headers = {} } = {}) {
    const res = await fetch(`${baseUrl}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieJar.sg ? { Cookie: `sg_token=${cookieJar.sg}` } : {}),
        ...headers,
      },
      body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get('set-cookie') || '';
    const m = setCookie.match(/sg_token=([^;]+)/);
    if (m) cookieJar.sg = m[1];
    let json = null;
    try {
      json = raw !== undefined ? null : await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json, headers: res.headers };
  }
  return {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, { body }),
    put: (url, body) => request('PUT', url, { body }),
    delete: (url) => request('DELETE', url),
    raw: (url) => request('GET', url, { raw: true }),
    jar: cookieJar,
  };
}

// Registers + logs in a throwaway user and returns a full client.
export async function registerAndLogin(baseUrl, { email = 'test@scrollguard.dev', password = 'password123', ...rest } = {}) {
  const anon = makeClient(baseUrl);
  const res = await anon.post('/api/auth/register', {
    name: 'Test User',
    email,
    password,
    dailyGoalMin: 90,
    ...rest,
  });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.json)}`);
  const client = makeClient(baseUrl, { token: res.json.token });
  return { client, user: res.json.user, token: res.json.token };
}