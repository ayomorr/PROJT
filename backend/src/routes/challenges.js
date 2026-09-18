// Challenges — daily challenges with completion tracking.
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import * as db from '../db.js';

const router = Router();
router.use(authRequired);

// Returns all challenges plus today's completions, so the UI can disable its button.
router.get('/', (req, res) => {
  const challenges = db.getChallenges();
  const withStatus = challenges.map((c) => ({
    ...c,
    completedToday: db.hasCompletedChallengeToday(req.user.id, c.id),
  }));
  const today = new Date().toISOString().slice(0, 10);
  res.json({ challenges: withStatus, today });
});

// Available in two shapes: complete one challenge or mark the daily one.
router.post('/:id/complete', (req, res, next) => {
  try {
    const challenge = db.getChallengeById(req.params.id);
    if (!challenge) throw new HttpError(404, 'Challenge not found.');
    const result = db.addChallengeCompletion(req.user.id, challenge.id);
    res.json({ ok: true, already: result.already, challengeId: challenge.id });
  } catch (err) {
    next(err);
  }
});

export default router;