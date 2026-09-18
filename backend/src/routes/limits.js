// Personal limits — daily, session, and quiet-hours limits per platform.
import { Router } from 'express';
import { validate, isIntRange, isTimeHHMM, required } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { authRequired } from '../middleware/auth.js';
import * as db from '../db.js';

const router = Router();
router.use(authRequired);

const platformExists = (id) => Boolean(id && db.getPlatforms().some((p) => p.id === id));

router.get('/', (req, res) => {
  res.json({ limits: db.getLimits(req.user.id) });
});

// Upsert a limit for a platform (or the global/quiet-hours config when platform is null).
router.post(
  '/',
  validate({
    platformId: required,
    dailyLimitMin: ['optional', isIntRange(5, 720)],
    sessionLimitMin: ['optional', isIntRange(5, 180)],
    quietStart: isTimeHHMM,
    quietEnd: isTimeHHMM,
  }),
  (req, res, next) => {
    try {
      const b = req.validBody;
      const platformIdRaw = b.platformId === 'global' ? null : b.platformId;
      if (platformIdRaw && !platformExists(platformIdRaw)) throw new HttpError(400, 'Unknown platform.');
      const limit = db.upsertLimit({
        userId: req.user.id,
        platformId: platformIdRaw,
        dailyLimitMin: b.dailyLimitMin !== undefined ? Number(b.dailyLimitMin) : null,
        sessionLimitMin: b.sessionLimitMin !== undefined ? Number(b.sessionLimitMin) : null,
        quietStart: b.quietStart ?? '',
        quietEnd: b.quietEnd ?? '',
      });
      res.json({ limit });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  validate({
    optional: true,
    dailyLimitMin: ['optional', isIntRange(5, 720)],
    sessionLimitMin: ['optional', isIntRange(5, 180)],
    quietStart: isTimeHHMM,
    quietEnd: isTimeHHMM,
  }),
  (req, res, next) => {
    try {
      const patches = {};
      if (req.validBody.dailyLimitMin !== undefined) patches.dailyLimitMin = Number(req.validBody.dailyLimitMin);
      if (req.validBody.sessionLimitMin !== undefined) patches.sessionLimitMin = Number(req.validBody.sessionLimitMin);
      const limit = db.updateLimit(req.params.id, req.user.id, { ...req.validBody, ...patches });
      if (!limit) throw new HttpError(404, 'Limit not found.');
      res.json({ limit });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', (req, res, next) => {
  try {
    const ok = db.deleteLimit(req.params.id, req.user.id);
    if (!ok) throw new HttpError(404, 'Limit not found.');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;