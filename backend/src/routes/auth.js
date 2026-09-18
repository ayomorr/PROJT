// Authentication routes: register, login, logout, forgot/reset password, me.
import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import { validate, required, isEmail, minLen, oneOf, isIntRange, isArrayOfStrings, normalizeEmail } from '../middleware/validate.js';
import { strictRateLimit } from '../middleware/rateLimit.js';
import { signToken, cookieReader, authRequired } from '../middleware/auth.js';
import * as db from '../db.js';
import { config } from '../config.js';

const router = Router();
router.use(cookieReader);

// ---------------------------------------------------------------- helpers

const GOALS = [
  'Reduce social-media time', 'Stop endless scrolling', 'Improve productivity',
  'Sleep better', 'Focus while studying', 'Spend more time offline',
  'Build healthier digital habits',
];
const SCROLL_TIMES = ['Morning', 'During work', 'During school', 'After work', 'Evening', 'Before sleeping', 'When bored', 'When stressed'];

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  // JSON columns are stored as strings — parse them back for the client.
  return {
    ...safe,
    goals: safe.goals ? JSON.parse(safe.goals) : [],
    platforms: safe.platforms ? JSON.parse(safe.platforms) : [],
    scrollTimes: safe.scrollTimes ? JSON.parse(safe.scrollTimes) : [],
  };
}

function setAuthCookie(res, token) {
  res.cookie('sg_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd, // HTTPS-only in production
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/',
  });
}

function validateOnboarding(validBody) {
  const goals = validBody.goals || [];
  const platforms = validBody.platforms || [];
  if (goals.length && !goals.every((g) => GOALS.includes(g))) throw new HttpError(400, 'Unknown goal selected.');
  if (platforms.length && !platforms.every((p) => db.getPlatforms().some((x) => x.id === p)))
    throw new HttpError(400, 'Unknown platform selected.');
}

// ---------------------------------------------------------------- register

router.post(
  '/register',
  strictRateLimit,
  validate({
    name: [required, minLen(2)],
    email: [required, isEmail],
    password: [required, minLen(8)],
    dailyGoalMin: ['optional', isIntRange(15, 600)],
    goals: ['optional', isArrayOfStrings],
    platforms: ['optional', isArrayOfStrings],
    scrollTimes: ['optional', isArrayOfStrings],
  }),
  (req, res, next) => {
    try {
      const b = req.validBody;
      if (db.findUserByEmail(normalizeEmail(b.email))) {
        throw new HttpError(409, 'An account with this email already exists. Please log in.');
      }
      validateOnboarding(b);
      const goals = b.goals && b.goals.length ? b.goals : ['Build healthier digital habits'];
      const platforms = b.platforms || [];
      const scrollTimes = b.scrollTimes || [];
      const user = db.createUser({
        name: b.name.trim(),
        email: normalizeEmail(b.email),
        password: b.password,
        dailyGoal: Number(b.dailyGoalMin) || 90,
        goals,
        platforms,
        scrollTimes,
      });
      const token = signToken(user);
      setAuthCookie(res, token);
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------- login

router.post(
  '/login',
  strictRateLimit,
  validate({ email: [required, isEmail], password: [required] }),
  (req, res, next) => {
    try {
      const user = db.findUserByEmail(normalizeEmail(req.validBody.email));
      if (!user || !db.verifyPassword(req.validBody.password, user.passwordHash)) {
        throw new HttpError(401, 'Email or password is incorrect.');
      }
      const token = signToken(user);
      setAuthCookie(res, token);
      res.json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------- logout

router.post('/logout', (req, res) => {
  res.clearCookie('sg_token', { path: '/' });
  res.json({ ok: true });
});

// ---------------------------------------------------------------- me

router.get('/me', authRequired, (req, res) => res.json({ user: publicUser(req.user) }));

// ---------------------------------------------------------------- forgot password

router.post(
  '/forgot-password',
  strictRateLimit,
  validate({ email: [required, isEmail] }),
  (req, res, next) => {
    try {
      const user = db.findUserByEmail(normalizeEmail(req.validBody.email));
      if (!user) {
        // Same response whether or not the account exists (don't leak email existence).
        return res.json({ ok: true, message: "If that account exists, we've emailed you a reset link." });
      }
      const token = db.createResetToken(user.id);
      // In this MVP there is no SMTP server, so the reset token is returned in dev and
      // printed to the console. In production you would send it via email.
      if (!config.isProd) console.log(`[scrollguard] password reset token for ${user.email}: ${token}`);
      res.json({
        ok: true,
        message: "If that account exists, we've emailed you a reset link.",
        resetToken: config.isProd ? undefined : token, // dev convenience only
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------- reset password

router.post(
  '/reset-password',
  strictRateLimit,
  validate({ token: [required], password: [required, minLen(8)] }),
  (req, res, next) => {
    try {
      const row = db.findResetToken(req.validBody.token);
      if (!row) throw new HttpError(400, 'This reset link is invalid or has expired. Please try again.');
      const user = db.findUserById(row.userId);
      if (!user) throw new HttpError(400, 'Account not found.');
      db.prepareUpdatePassword(user.id, req.validBody.password);
      db.deleteResetToken(req.validBody.token);
      res.json({ ok: true, message: 'Password updated. You can log in now.' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;