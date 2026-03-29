import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function tagCaseVariants(tag) {
  const t = String(tag ?? '').trim();
  if (!t) return [];
  const title = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return [...new Set([t, t.toLowerCase(), title, t.toUpperCase()])];
}

function parseLimitOffset(req) {
  const lim = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const off = Math.max(0, Number(req.query.offset) || 0);
  return { lim, off };
}

// GET /api/activities
router.get('/', async (req, res) => {
  try {
    const { city, category, tags, sort = 'rating', search } = req.query;
    const { lim, off } = parseLimitOffset(req);

    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(off, off + lim - 1);

    if (city) query = query.eq('city', String(city));
    if (category) query = query.eq('category', String(category));

    if (tags) {
      const tagList = String(tags).split(',').map((t) => t.trim()).filter(Boolean);
      for (const t of tagList) {
        const variants = tagCaseVariants(t);
        if (variants.length) query = query.overlaps('tags', variants);
      }
    }

    if (search) {
      const s = String(search).trim();
      if (s) {
        query = query.or(
          `title.ilike.%${s}%,location.ilike.%${s}%,description.ilike.%${s}%`
        );
      }
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order('rating', { ascending: false });
        break;
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.json({ activities: data || [], total: count ?? 0, limit: lim, offset: off });
  } catch (err) {
    console.error('Activities list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/activities/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: activity, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !activity) return res.status(404).json({ error: 'Activity not found' });

    const { data: reviewAgg } = await supabase
      .from('reviews')
      .select('rating')
      .eq('item_type', 'activity')
      .eq('activity_id', req.params.id);

    const ratings = (reviewAgg || []).map((r) => Number(r.rating)).filter((n) => !Number.isNaN(n));
    const avg_rating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return res.json({ ...activity, avg_rating, review_count: ratings.length });
  } catch (err) {
    console.error('Activity get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/activities/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles(full_name, avatar_url)')
      .eq('item_type', 'activity')
      .eq('activity_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ reviews: data || [] });
  } catch (err) {
    console.error('Activity reviews error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/activities/:id/book  [requireAuth]
router.post('/:id/book', requireAuth, async (req, res) => {
  try {
    const { travel_date, guests = 1, special_requests } = req.body || {};
    if (!travel_date) return res.status(400).json({ error: 'travel_date is required' });

    const g = Math.max(1, Number(guests) || 1);
    const date = new Date(String(travel_date));
    if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'Invalid travel_date' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d0 = new Date(date);
    d0.setHours(0, 0, 0, 0);
    if (d0 <= today) return res.status(400).json({ error: 'travel_date must be in the future' });

    const { data: activity, error: aErr } = await supabase
      .from('activities')
      .select('id, price, price_type, is_active')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();
    if (aErr || !activity) return res.status(404).json({ error: 'Activity not found' });

    const unit = Number(activity.price);
    const total =
      activity.price_type === 'free' ? 0 : (Number.isFinite(unit) ? unit : 0) * g;

    const { data, error } = await supabase
      .from('activity_bookings')
      .insert({
        user_id: req.userId,
        activity_id: req.params.id,
        travel_date: String(travel_date),
        guests: g,
        total_amount: total,
        status: 'pending',
        special_requests: special_requests ? String(special_requests) : null,
      })
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ booking: data });
  } catch (err) {
    console.error('Activity book error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

