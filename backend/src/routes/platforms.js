// Platforms — supported platforms + which ones support live (extension) tracking.
import { Router } from 'express';
import * as db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ platforms: db.getPlatforms() });
});

export default router;