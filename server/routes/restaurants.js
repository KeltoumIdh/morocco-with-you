import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

function parseLimitOffset(req) {
  const lim = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const off = Math.max(0, Number(req.query.offset) || 0);
  return { lim, off };
}

// GET /api/restaurants
router.get('/', async (req, res) => {
  try {
    const { city, cuisine, price_range, search } = req.query;
    const { lim, off } = parseLimitOffset(req);

    let query = supabase
      .from('restaurants')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(off, off + lim - 1)
      .order('featured', { ascending: false })
      .order('rating', { ascending: false });

    if (city) query = query.eq('city', String(city));
    if (cuisine) query = query.ilike('cuisine', `%${String(cuisine).trim()}%`);
    if (price_range) query = query.eq('price_range', String(price_range));

    if (search) {
      const s = String(search).trim();
      if (s) {
        query = query.or(
          `name.ilike.%${s}%,location.ilike.%${s}%,description.ilike.%${s}%,cuisine.ilike.%${s}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ restaurants: data || [], total: count ?? 0, limit: lim, offset: off });
  } catch (err) {
    console.error('Restaurants list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles(full_name, avatar_url)')
      .eq('item_type', 'restaurant')
      .eq('restaurant_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    return res.json({ ...restaurant, reviews: reviews || [] });
  } catch (err) {
    console.error('Restaurant get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

