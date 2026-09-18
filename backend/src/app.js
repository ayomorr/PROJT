// Express application wiring.
//
// Builds the app WITHOUT listening on a port, so the test runner can import it and
// boot an ephemeral server per test file.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import { cookieReader } from './middleware/auth.js';
import { rateLimit } from './middleware/rateLimit.js';
import { errorHandler, serveFrontend } from './middleware/errors.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import usageRoutes from './routes/usage.js';
import platformRoutes from './routes/platforms.js';
import limitRoutes from './routes/limits.js';
import insightRoutes from './routes/insights.js';
import aiRoutes from './routes/ai.js';
import focusRoutes from './routes/focus.js';
import challengeRoutes from './routes/challenges.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieReader);
  if (!config.isProd) app.use(morgan('dev'));

  app.get('/api/health', (req, res) =>
    res.json({ ok: true, name: 'ScrollGuard API', time: new Date().toISOString() }),
  );

  app.use('/api', rateLimit({ windowMs: 60_000, max: 240 }));

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/platforms', platformRoutes);
  app.use('/api/limits', limitRoutes);
  app.use('/api/insights', insightRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/focus', focusRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
  serveFrontend(app); // serves the built SPA in production (no-op in dev)
  app.use(errorHandler);

  return app;
}