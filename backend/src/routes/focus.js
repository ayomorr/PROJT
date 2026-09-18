// Focus Mode — a lightweight countdown session marker.
//
// The web app's Focus Mode is an intentional timer. Blocking the selected platforms is
// provided by the browser extension where permissions allow; the API just records the
// session so the dashboard/Focus page can show streaks and completion.
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { validate, required, isIntRange, isArrayOfStrings } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import * as db from '../db.js';

const router = Router();
router.use(authRequired);

router.post(
  '/start',
  validate({ minutes: [required, isIntRange(1, 180)], platforms: ['optional', isArrayOfStrings] }),
  (req, res, next) => {
    try {
      const existing = db.getActiveFocus(req.user.id);
      if (existing) {
        return res.status(409).json({ error: 'A focus session is already running.', focus: existing });
      }
      const focus = db.createFocus({ userId: req.user.id, plannedMin: Number(req.validBody.minutes), platforms: req.validBody.platforms || [] });
      res.status(201).json({ focus });
    } catch (err) {
      next(err);
    }
  },
);

router.post('/end', validate({ focusId: required }), (req, res, next) => {
  try {
    const focus = db.getFocusById(req.validBody.focusId);
    if (!focus || focus.userId !== req.user.id) throw new HttpError(404, 'Focus session not found.');
    const ended = db.endFocus(focus.id, true);
    res.json({ focus: ended });
  } catch (err) {
    next(err);
  }
});

router.get('/active', (req, res) => {
  const focus = db.getActiveFocus(req.user.id);
  if (!focus) return res.json({ active: false });
  const elapsedSec = Math.floor((Date.now() - new Date(focus.startTime).getTime()) / 1000);
  res.json({
    active: true,
    focus: { ...focus, platformsText: JSON.parse(focus.platformsText || '[]'), elapsedSec, remainingSec: Math.max(0, focus.plannedMin * 60 - elapsedSec) },
  });
});

export default router;