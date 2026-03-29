import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

/** Values to pass to .overlaps so "Desert" matches DB tags like "desert" or "DESERT". */
function tagCaseVariants(tag) {
  const t = String(tag ?? '').trim();
  if (!t) return [];
  const title = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return [...new Set([t, t.toLowerCase(), title, t.toUpperCase()])];
}

const FALLBACK_EXPERIENCES = [
  {
    id: 'fallback-1',
    title: 'Sahara Desert Overnight',
    location: 'Merzouga, Errachidia',
    description: 'Ride camels into the dunes and sleep in a Berber camp.',
    price: 149,
    duration: '2 days',
    max_group: 8,
    tags: ['Adventure', 'Desert'],
    gradient: 'linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)',
    rating: 4.9,
    review_count: 218,
    is_active: true,
  },
  {
    id: 'fallback-2',
    title: 'Fes Medina Food Trail',
    location: 'Fes el-Bali',
    description: 'Taste iconic Moroccan dishes in hidden medina spots.',
    price: 65,
    duration: '4 hours',
    max_group: 6,
    tags: ['Food', 'Culture'],
    gradient: 'linear-gradient(145deg,#C0654A 0%,#8B3A2A 55%,#1A1410 100%)',
    rating: 4.8,
    review_count: 312,
    is_active: true,
  },
];

// GET /api/experiences
// Query params: tags (comma-separated), sort (rating|price_asc|price_desc), search (text), limit, offset
router.get('/', async (req, res) => {
  try {
    const {
      tags,
      sort = 'rating',
      search,
      limit = '12',
      offset = '0',
    } = req.query;

    const lim = Math.min(100, Math.max(1, Number(limit) || 12));
    const off = Math.max(0, Number(offset) || 0);

    let query = supabase
      .from('experiences')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(off, off + lim - 1);

    if (tags) {
      const tagList = String(tags).split(',').map((t) => t.trim()).filter(Boolean);
      // AND across tags: each requested tag must match some element in row.tags (any casing).
      for (const t of tagList) {
        const variants = tagCaseVariants(t);
        if (variants.length) query = query.overlaps('tags', variants);
      }
    }

    if (search) {
      const s = String(search).trim();
      if (s) query = query.or(`title.ilike.%${s}%,location.ilike.%${s}%`);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('rating', { ascending: false });
        break;
    }

    const { data, error, count } = await query;
    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.experiences'")) {
        return res.json({
          experiences: FALLBACK_EXPERIENCES,
          total: FALLBACK_EXPERIENCES.length,
          limit: lim,
          offset: off,
          fallback: true,
          fallback_reason: error.message,
        });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.json({ experiences: data || [], total: count ?? 0, limit: lim, offset: off });
  } catch (err) {
    console.error('Experiences list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/experiences/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: experience, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !experience) {
      const fb = FALLBACK_EXPERIENCES.find((e) => e.id === req.params.id);
      if (fb) return res.json({ ...fb, avg_rating: fb.rating, review_count: fb.review_count, fallback: true });
      return res.status(404).json({ error: 'Experience not found' });
    }

    const { data: reviewAgg } = await supabase
      .from('reviews')
      .select('rating', { count: 'exact' })
      .eq('experience_id', req.params.id);

    const ratings = (reviewAgg || []).map((r) => Number(r.rating)).filter((n) => !Number.isNaN(n));
    const avg_rating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const review_count = ratings.length;

    return res.json({ ...experience, avg_rating, review_count });
  } catch (err) {
    console.error('Experience get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/experiences/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles(full_name, avatar_url)')
      .eq('experience_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ reviews: data || [] });
  } catch (err) {
    console.error('Reviews list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
