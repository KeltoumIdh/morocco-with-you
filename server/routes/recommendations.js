import express from 'express';
import { generateRecommendations } from '../services/aiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const result = await generateRecommendations({
      userId: req.userId,
      limit: req.body?.limit ?? 6,
    });
    return res.json(result);
  } catch (err) {
    console.error('[RECS]', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
