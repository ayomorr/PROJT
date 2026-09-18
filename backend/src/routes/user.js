// User profile routes.
import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import { validate, minLen, isIntRange, isArrayOfStrings, oneOf } from '../middleware/validate.js';
import { authRequired } from '../middleware/auth.js';
import * as db from '../db.js';

const router = Router();
router.use(authRequired);

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return {
    ...safe,
    goals: safe.goals ? JSON.parse(safe.goals) : [],
    platforms: safe.platforms ? JSON.parse(safe.platforms) : [],
    scrollTimes: safe.scrollTimes ? JSON.parse(safe.scrollTimes) : [],
  };
}

router.get('/profile', (req, res) => {
  const fresh = db.findUserById(req.user.id);
  res.json({ user: publicUser(fresh) });
});

const SCROLL_TIMES = ['Morning', 'During work', 'During school', 'After work', 'Evening', 'Before sleeping', 'When bored', 'When stressed'];

router.put(
  '/profile',
  validate({
    optional: true,
    name: minLen(2),
    dailyGoalMin: isIntRange(15, 600),
    goals: isArrayOfStrings,
    platforms: isArrayOfStrings,
    scrollTimes: isArrayOfStrings,
    troubleLimitMin: isIntRange(5, 120),
  }),
  (req, res, next) => {
    try {
      const b = req.validBody;
      if (b.scrollTimes) {
        for (const t of b.scrollTimes) if (!SCROLL_TIMES.includes(t)) throw new HttpError(400, 'Unknown scroll time.');
      }
      const patch = {};
      if (b.name !== undefined) patch.name = b.name.trim();
      if (b.dailyGoalMin !== undefined) patch.dailyGoal = Number(b.dailyGoalMin);
      if (b.goals !== undefined) patch.goals = b.goals;
      if (b.platforms !== undefined) patch.platforms = b.platforms;
      if (b.scrollTimes !== undefined) patch.scrollTimes = b.scrollTimes;
      if (b.troubleLimitMin !== undefined) patch.troubleLimitMin = Number(b.troubleLimitMin);
      const user = db.updateUser(req.user.id, patch);
      res.json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/account', (req, res, next) => {
  try {
    db.deleteUserAndData(req.user.id);
    res.clearCookie('sg_token', { path: '/' });
    res.json({ ok: true, message: 'Your account and all your data have been deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;