import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { experience_id, booking_id, rating, comment } = req.body || {};

    if (!experience_id) return res.status(400).json({ error: 'experience_id required' });
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ error: 'rating must be between 1 and 5' });

    if (booking_id) {
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .select('id, user_id, status, experience_id')
        .eq('id', booking_id)
        .single();
      if (bErr || !booking) return res.status(400).json({ error: 'Invalid booking_id' });
      if (booking.user_id !== req.userId) return res.status(403).json({ error: 'Booking does not belong to user' });
      if (booking.status !== 'completed') return res.status(400).json({ error: 'Booking must be completed to review' });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        user_id: req.userId,
        experience_id,
        booking_id: booking_id || null,
        rating: r,
        comment: comment || null,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    // Update experience aggregate fields
    const { data: agg } = await supabase
      .from('reviews')
      .select('rating')
      .eq('experience_id', experience_id);

    const ratings = (agg || []).map((x) => Number(x.rating)).filter((n) => !Number.isNaN(n));
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    await supabase
      .from('experiences')
      .update({ rating: avg, review_count: ratings.length })
      .eq('id', experience_id);

    return res.status(201).json({ review });
  } catch (err) {
    console.error('Review create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
