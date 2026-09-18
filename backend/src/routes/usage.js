// Usage routes — session tracking, today/weekly stats, live sessions and reminders.
//
// Live-session flow (used by the browser extension and the web app's timer):
//   POST /usage/session/start { platform }  → { sessionId }
//   GET  /usage/active                      → live session + interventionLevel
//   POST /usage/session/end { sessionId }   → commits the session
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { validate, required, isIntRange } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import * as db from '../db.js';
import { computeAttentionScore } from '../services/attentionScore.js';
import { interventionLevel, reminderForLevel, inQuietHours, thresholdSeconds } from '../services/intervention.js';
import { computeWeekly } from '../services/insights.js';

const router = Router();
router.use(authRequired);

// ---------------------------------------------------------------- helpers

function parseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// Builds the "today" payload: totals, per-platform breakdown, sessions, attention score.
function buildToday(user) {
  const day = db.dateKey(Date.now());
  const sessions = db.getSessionsForDate(user.id, day);
  const totalSeconds = sessions.reduce((a, s) => a + Math.max(s.duration || 0, 0), 0);
  const perPlatform = new Map();
  for (const s of sessions) {
    const key = s.platformId || 'other';
    const e = perPlatform.get(key) || { platformId: key, totalSeconds: 0, sessions: 0, longestSession: 0 };
    e.totalSeconds += Math.max(s.duration || 0, 0);
    e.sessions += 1;
    e.longestSession = Math.max(e.longestSession, s.duration || 0);
    perPlatform.set(key, e);
  }

  const goalMinutes = user.dailyGoal || 90;
  const quiet = quietWindow(user);
  const nightSeconds = sessions
    .filter((s) => inQuietHours(new Date(s.startTime), quiet.start, quiet.end))
    .reduce((a, s) => a + Math.max(s.duration || 0, 0), 0);

  const stat = db.computeDailyStat(user.id, day);
  const attentionScore = computeAttentionScore(
    {
      totalSeconds: stat.totalSeconds,
      sessions: stat.sessions,
      longestSession: stat.longestSession,
      reopens: Math.max(0, stat.sessions - 1),
      nightSeconds,
      withinGoal: stat.totalSeconds <= goalMinutes * 60,
      breaksTaken: 0,
    },
    { dailyGoalMin: goalMinutes },
  );

  return {
    date: day,
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    goalMinutes,
    sessions,
    sessionCount: sessions.length,
    longestSession: sessions.reduce((a, s) => Math.max(a, s.duration || 0), 0),
    reopens: Math.max(0, sessions.length - 1),
    attentionScore,
    perPlatform: [...perPlatform.values()].sort((a, b) => b.totalSeconds - a.totalSeconds),
    withinGoal: stat.totalSeconds <= goalMinutes * 60,
  };
}

// Reads the user's quiet hours from their limits.
function quietWindow(user) {
  const global = db.getGlobalLimit(user.id);
  return { start: global?.quietStart || '', end: global?.quietEnd || '' };
}

function platformLimit(user, platformId) {
  return db.getLimitForPlatform(user.id, platformId);
}

// ---------------------------------------------------------------- live sessions

router.post(
  '/session/start',
  validate({ platform: required }),
  (req, res, next) => {
    try {
      const { platform } = req.body;
      const plat = db.getPlatforms().find((p) => p.id === platform);
      if (!plat) throw new HttpError(400, 'Unsupported platform. Add it manually from the dashboard instead.');
      // Close any stale open session first (idle tabs can leave one behind).
      const stale = db.getOpenSession(req.user.id);
      if (stale) db.closeSession(stale.id, new Date(Date.now() - 30 * 1000).toISOString());

      const session = db.insertSession({
        userId: req.user.id,
        platformId: platform,
        startTime: db.nowISO(),
        source: req.body.source || 'extension',
        tag: req.body.tag || 'web',
      });
      res.status(201).json({ sessionId: session.id });
    } catch (err) {
      next(err);
    }
  },
);

// Returns the live session (if any) plus the computed intervention message.
router.get('/active', (req, res) => {
  const session = db.getOpenSession(req.user.id);
  if (!session) return res.json({ active: false });

  const elapsedSec = Math.max(0, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
  const limit = platformLimit(req.user, session.platformId);
  const today = buildToday(req.user);
  const daySecondsOnPlatform =
    today.perPlatform.find((p) => p.platformId === session.platformId)?.totalSeconds || 0;
  const level = interventionLevel({
    user: req.user,
    platformLimit: limit,
    elapsedSec,
    todayPlatformSec: daySecondsOnPlatform,
    todayDailyLimitMin: limit?.dailyLimitMin || null,
  });

  const quiet = quietWindow(req.user);
  const quietHoursActive = inQuietHours(new Date(), quiet.start, quiet.end);
  let reminder = null;
  if (level > 0) {
    reminder = reminderForLevel(level, {
      elapsedMin: Math.floor(elapsedSec / 60),
      plannedMin: Math.round(thresholdSeconds(req.user, limit) / 60),
      platformName: session.platformId,
      quietHours: quietHoursActive,
    });
  }

  res.json({
    active: true,
    session: {
      ...session,
      elapsedSec,
      elapsedMin: Math.floor(elapsedSec / 60),
      platformId: session.platformId,
    },
    interventionLevel: level,
    reminder,
    quietHoursActive,
  });
});

router.post(
  '/session/end',
  validate({ sessionId: required }),
  (req, res, next) => {
    try {
      const { sessionId } = req.validBody;
      const session = db.getSessionById(sessionId);
      if (!session || session.userId !== req.user.id) throw new HttpError(404, 'Session not found.');
      const closed = db.closeSession(sessionId);
      res.json({ session: closed });
    } catch (err) {
      next(err);
    }
  },
);

// Records how the user reacted to a reminder (used for the break-frequency bonus).
router.post(
  '/session/reminder',
  validate({ sessionId: required, level: required, decision: required }),
  (req, res) => {
    const { sessionId, level, decision } = req.validBody;
    const session = db.getSessionById(sessionId);
    if (!session || session.userId !== req.user.id) return res.status(404).json({ error: 'Session not found.' });
    db.recordReminder({ userId: req.user.id, sessionId, level, decision });
    res.json({ ok: true });
  },
);

// ---------------------------------------------------------------- committed sessions

// Manual / app / extension log of a completed session.
router.post(
  '/session',
  validate({
    platform: required,
    startTime: required,
    endTime: required,
    duration: ['optional', isIntRange(0, 86400 * 6)],
  }),
  (req, res, next) => {
    try {
      const { platform, startTime, endTime, source, tag } = req.body;
      const plat = db.getPlatforms().find((p) => p.id === platform);
      if (!plat) throw new HttpError(400, 'Unsupported platform.');
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
        throw new HttpError(400, 'Please provide a valid start and end time.');
      const session = db.insertSession({
        userId: req.user.id,
        platformId: platform,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: Math.round((end - start) / 1000),
        source: source || 'manual',
        tag: tag || 'manual',
      });
      db.refreshStreak(req.user.id);
      res.status(201).json({ session });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/sessions', (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const sessions = db.getRecentSessions(req.user.id, limit);
  res.json({ sessions });
});

// ---------------------------------------------------------------- today & weekly

router.get('/today', (req, res) => {
  db.refreshStreak(req.user.id);
  const today = buildToday(req.user);
  const user = db.findUserById(req.user.id);
  res.json({ ...today, streak: user.streak });
});

router.get('/weekly', (req, res) => {
  const weekly = computeWeekly(req.user.id);
  res.json({ weekly });
});

export default router;