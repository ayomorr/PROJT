// Thin typing-free friendly API client.
//
// Rules:
//   - Base path comes from VITE_API_URL (dev uses /api, proxied by Vite).
//   - Credentials are sent with every request (httpOnly cookie for browser sessions).
//   - The bearer token (for the built-in auth + extension-style clients) is pulled
//     from localStorage when present.
//   - Every error is thrown as an ApiError with a human-readable message.
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'sg_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // Network-level failure (offline, backend down, CORS).
    throw new ApiError('Could not reach the ScrollGuard server. Check your connection and try again.', 0);
  }

  if (res.status === 401) {
    // Clear a stale token — the account may have been deleted or logged out elsewhere.
    setToken('');
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = (json && json.error) || `Something went wrong (${res.status}).`;
    throw new ApiError(msg, res.status);
  }
  return json;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

/* ---------------------------------------------------------------- auth */
export const auth = {
  me: () => api.get('/auth/me'),
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

/* ---------------------------------------------------------------- user */
export const user = {
  profile: () => api.get('/user/profile'),
  update: (patch) => api.put('/user/profile', patch),
  deleteAccount: () => api.del('/user/account'),
};

/* ---------------------------------------------------------------- usage */
export const usage = {
  today: () => api.get('/usage/today'),
  weekly: () => api.get('/usage/weekly'),
  insights: () => api.get('/insights'),
  sessions: (limit = 20) => api.get(`/usage/sessions?limit=${limit}`),
  logSession: (payload) => api.post('/usage/session', payload),
  startLive: (platform, source = 'web') => api.post('/usage/session/start', { platform, source }),
  endLive: (sessionId) => api.post('/usage/session/end', { sessionId }),
  active: () => api.get('/usage/active'),
  reminder: (sessionId, level, decision) => api.post('/usage/session/reminder', { sessionId, level, decision }),
};

/* ---------------------------------------------------------------- platforms/limits */
export const platforms = {
  list: () => api.get('/platforms'),
};

export const limits = {
  list: () => api.get('/limits'),
  save: (payload) => api.post('/limits', payload),
  update: (id, patch) => api.put(`/limits/${id}`, patch),
  remove: (id) => api.del(`/limits/${id}`),
};

/* ---------------------------------------------------------------- ai / focus / challenges */
export const ai = {
  chat: (text, history) => api.post('/ai/chat', { text, history }),
  pattern: (text) => api.post('/ai/pattern', { text }),
};

export const focus = {
  start: (minutes, platforms = []) => api.post('/focus/start', { minutes, platforms }),
  end: (focusId) => api.post('/focus/end', { focusId }),
  active: () => api.get('/focus/active'),
};

export const challengesApi = {
  list: () => api.get('/challenges'),
  complete: (id) => api.post(`/challenges/${id}/complete`),
};

export const admin = {
  stats: () => api.get('/admin/stats'),
};