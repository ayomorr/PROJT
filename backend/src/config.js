// Central config loader. Every environment variable is read once here so the rest
// of the backend never touches process.env directly.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Resolve the SQLite path relative to the backend folder (so it works no matter
  // which directory the server is started from).
  databaseUrl: path.resolve(__dirname, '..', process.env.DATABASE_URL || './data/scrollguard.db'),
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    provider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  },
  admin: {
    bootstrap: bool(process.env.ADMIN_BOOTSTRAP, true),
    email: process.env.ADMIN_EMAIL || 'admin@scrollguard.app',
    password: process.env.ADMIN_PASSWORD || 'ChangeMeAdmin123!',
  },
  demoUser: {
    email: process.env.DEMO_USER_EMAIL || 'demo@scrollguard.app',
    password: process.env.DEMO_USER_PASSWORD || 'demo1234',
  },
};