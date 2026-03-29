import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

function parseLimitOffset(req) {
  const lim = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const off = Math.max(0, Number(req.query.offset) || 0);
  return { lim, off };
}

// GET /api/accommodations
router.get('/', async (req, res) => {
  try {
    const { city, type, stars, price_max, search } = req.query;
    const { lim, off } = parseLimitOffset(req);

    let query = supabase
      .from('accommodations')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(off, off + lim - 1)
      .order('featured', { ascending: false })
      .order('rating', { ascending: false });

    if (city) query = query.eq('city', String(city));
    if (type) query = query.eq('type', String(type));
    if (stars) query = query.eq('stars', Number(stars));
    if (price_max) query = query.lte('price_from', Number(price_max));

    if (search) {
      const s = String(search).trim();
      if (s) {
        query = query.or(
          `name.ilike.%${s}%,location.ilike.%${s}%,description.ilike.%${s}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ accommodations: data || [], total: count ?? 0, limit: lim, offset: off });
  } catch (err) {
    console.error('Accommodations list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/accommodations/cities
router.get('/cities', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('accommodations')
      .select('city')
      .eq('is_active', true);
    if (error) return res.status(400).json({ error: error.message });
    const cities = [...new Set((data || []).map((r) => r.city).filter(Boolean))].sort();
    return res.json({ cities });
  } catch (err) {
    console.error('Accommodations cities error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/accommodations/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: accommodation, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !accommodation) return res.status(404).json({ error: 'Accommodation not found' });

    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles(full_name, avatar_url)')
      .eq('item_type', 'accommodation')
      .eq('accommodation_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    return res.json({ ...accommodation, reviews: reviews || [] });
  } catch (err) {
    console.error('Accommodation get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

