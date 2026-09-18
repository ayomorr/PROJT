// Admin dashboard — aggregated analytics only. No private individual usage details.
import { Router } from 'express';
import { authRequired, adminRequired } from '../middleware/auth.js';
import * as db from '../db.js';

const router = Router();
router.use(authRequired, adminRequired);

router.get('/stats', (req, res) => {
  const day = db.dateKey(Date.now());
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString();

  const totalUsers = db.countUsers();
  const sessionsToday = db
    .prepare('SELECT COUNT(*) AS n FROM usage_sessions WHERE substr(startTime,1,10) = ?')
    .get(day).n;
  const sessionsWeek = db
    .prepare('SELECT COUNT(*) AS n FROM usage_sessions WHERE startTime >= ?')
    .get(weekAgo).n;
  const timeToday = db
    .prepare('SELECT COALESCE(SUM(duration),0) AS n FROM usage_sessions WHERE substr(startTime,1,10) = ?')
    .get(day).n;
  const completionsToday = db.countCompletionsToday();

  const activeUsers7d = db
    .prepare('SELECT COUNT(DISTINCT userId) AS n FROM usage_sessions WHERE startTime >= ?')
    .get(weekAgo).n;

  // Platform distribution across the last 7 days (aggregate).
  const platformRows = db
    .prepare(
      `SELECT COALESCE(platformId,'other') AS platformId, COUNT(*) AS sessions,
              COALESCE(SUM(duration),0) AS totalSeconds
       FROM usage_sessions
       WHERE startTime >= ?
       GROUP BY platformId
       ORDER BY totalSeconds DESC`,
    )
    .all(weekAgo)
    .map((r) => ({ ...r, totalMinutes: Math.round(r.totalSeconds / 60) }));

  // Feature usage: counts that hint at how people use each area (aggregated).
  const featureUsage = {
    focusSessionsWeek: db.prepare('SELECT COUNT(*) AS n FROM focus_sessions WHERE startTime >= ?').get(weekAgo).n,
    remindersWeek: db.prepare('SELECT COUNT(*) AS n FROM reminder_events WHERE createdAt >= ?').get(weekAgo).n,
    limitsSet: db.prepare('SELECT COUNT(*) AS n FROM user_limits').get().n,
  };

  res.json({
    totalUsers,
    activeUsers7d,
    sessionsToday,
    sessionsWeek,
    timeTodaySeconds: timeToday,
    completionsToday,
    platformDistribution: platformRows,
    featureUsage,
    generatedAt: new Date().toISOString(),
  });
});

export default router;