import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

// GET /api/v1/providers
router.get('/', async (req, res) => {
  try {
    const {
      city,
      category,
      q,
      price_min,
      price_max,
      rating_min,
      page = 1,
      limit = 12,
    } = req.query;

    const lim = Math.min(100, Math.max(1, Number(limit) || 12));
    const pg = Math.max(1, Number(page) || 1);
    const offset = (pg - 1) * lim;

    let query = supabase
      .from('providers')
      .select('*, provider_services(id, title, price, price_type)', {
        count: 'exact',
      })
      .eq('status', 'active')
      .range(offset, offset + lim - 1);

    if (city) query = query.ilike('city', `%${city}%`);
    if (category) query = query.eq('type', category);
    if (rating_min) query = query.gte('rating', Number(rating_min));

    if (q) {
      const t = String(q).trim();
      if (t) {
        query = query.textSearch('search_vector', t, {
          type: 'websearch',
          config: 'english',
        });
      }
    }

    let { data, error, count } = await query.order('rating', { ascending: false });

    if (error && q) {
      const t = String(q).trim();
      let fallback = supabase
        .from('providers')
        .select('*, provider_services(id, title, price, price_type)', {
          count: 'exact',
        })
        .eq('status', 'active')
        .or(`name.ilike.%${t}%,description.ilike.%${t}%,city.ilike.%${t}%`)
        .range(offset, offset + lim - 1);
      if (city) fallback = fallback.ilike('city', `%${city}%`);
      if (category) fallback = fallback.eq('type', category);
      if (rating_min) fallback = fallback.gte('rating', Number(rating_min));
      const fb = await fallback.order('rating', { ascending: false });
      data = fb.data;
      error = fb.error;
      count = fb.count;
    } else if (error) {
      throw error;
    }

    if (price_min || price_max) {
      // Filter in JS if needed (nested service prices); optional enhancement: RPC
      const pmin = price_min ? Number(price_min) : null;
      const pmax = price_max ? Number(price_max) : null;
      data = (data || []).filter((p) => {
        const services = p.provider_services || [];
        if (!services.length) return true;
        return services.some((s) => {
          const pr = Number(s.price);
          if (pmin != null && pr < pmin) return false;
          if (pmax != null && pr > pmax) return false;
          return true;
        });
      });
    }

    return res.json({
      providers: data || [],
      total: count ?? (data || []).length,
      page: pg,
      pages: Math.ceil((count || 0) / lim) || 1,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/providers/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*, provider_services(*)')
      .eq('id', req.params.id)
      .eq('status', 'active')
      .single();

    if (error) return res.status(404).json({ error: 'Provider not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
