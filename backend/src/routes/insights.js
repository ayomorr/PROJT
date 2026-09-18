// Insights — weekly summary + pattern detection for the dashboard's "wow moment".
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { computeWeekly, detectPattern } from '../services/insights.js';
import * as db from '../db.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const weekly = computeWeekly(req.user.id);
  const pattern = detectPattern(req.user.id);
  res.json({ weekly, pattern });
});

export default router;