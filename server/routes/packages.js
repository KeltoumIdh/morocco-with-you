import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPlanningRequestNotification } from '../services/email.js';

const router = express.Router();

function parseLimitOffset(req) {
  const lim = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const off = Math.max(0, Number(req.query.offset) || 0);
  return { lim, off };
}

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

// GET /api/packages
router.get('/', async (req, res) => {
  try {
    const {
      duration_min,
      duration_max,
      cities,
      difficulty,
      price_max,
      search,
    } = req.query;
    const { lim, off } = parseLimitOffset(req);

    let query = supabase
      .from('packages')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(off, off + lim - 1)
      .order('featured', { ascending: false })
      .order('rating', { ascending: false });

    if (duration_min) query = query.gte('duration_days', Number(duration_min));
    if (duration_max) query = query.lte('duration_days', Number(duration_max));
    if (difficulty) query = query.eq('difficulty', String(difficulty));
    if (price_max) query = query.lte('price_from', Number(price_max));

    if (cities) {
      const list = Array.isArray(cities) ? cities.flatMap(parseCsv) : parseCsv(cities);
      if (list.length) query = query.overlaps('cities', list);
    }

    if (search) {
      const s = String(search).trim();
      if (s) {
        query = query.or(`title.ilike.%${s}%,subtitle.ilike.%${s}%,description.ilike.%${s}%`);
      }
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ packages: data || [], total: count ?? 0, limit: lim, offset: off });
  } catch (err) {
    console.error('Packages list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/packages/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: pkg, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !pkg) return res.status(404).json({ error: 'Package not found' });
    return res.json(pkg);
  } catch (err) {
    console.error('Package get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/packages/:id/book [requireAuth]
router.post('/:id/book', requireAuth, async (req, res) => {
  try {
    const { start_date, guests = 1, special_requests } = req.body || {};
    if (!start_date) return res.status(400).json({ error: 'start_date is required' });
    const g = Math.max(1, Number(guests) || 1);

    const date = new Date(String(start_date));
    if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'Invalid start_date' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d0 = new Date(date);
    d0.setHours(0, 0, 0, 0);
    if (d0 <= today) return res.status(400).json({ error: 'start_date must be in the future' });

    const { data: pkg, error: pErr } = await supabase
      .from('packages')
      .select('id, price_from, is_active')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();
    if (pErr || !pkg) return res.status(404).json({ error: 'Package not found' });

    const unit = Number(pkg.price_from);
    const total = (Number.isFinite(unit) ? unit : 0) * g;

    const { data, error } = await supabase
      .from('package_bookings')
      .insert({
        user_id: req.userId,
        package_id: req.params.id,
        start_date: String(start_date),
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
    console.error('Package booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/planning/request [public]
// This router is mounted at /api/planning as well.
router.post('/request', async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      start_date,
      end_date,
      group_size,
      group_type,
      cities,
      budget_range,
      interests,
      accommodation_type,
      special_requests,
      package_id,
    } = req.body || {};

    if (!full_name || !email || !start_date) {
      return res.status(400).json({ error: 'full_name, email, start_date required' });
    }

    const sd = new Date(String(start_date));
    if (Number.isNaN(sd.getTime())) return res.status(400).json({ error: 'Invalid start_date' });
    let ed = null;
    if (end_date) {
      const tmp = new Date(String(end_date));
      if (Number.isNaN(tmp.getTime())) return res.status(400).json({ error: 'Invalid end_date' });
      ed = String(end_date);
    }

    const citiesList = Array.isArray(cities) ? cities.map(String) : parseCsv(cities);
    const interestsList = Array.isArray(interests) ? interests.map(String) : parseCsv(interests);

    const duration_days =
      ed && String(ed)
        ? Math.max(
            1,
            Math.round(
              (new Date(ed).getTime() - new Date(String(start_date)).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null;

    const payload = {
      user_id: null, // public endpoint; attach user later if needed
      package_id: package_id || null,
      full_name: String(full_name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      start_date: String(start_date),
      end_date: ed,
      duration_days,
      group_size: group_size != null ? Number(group_size) : 1,
      group_type: group_type || null,
      cities: citiesList,
      budget_range: budget_range || null,
      interests: interestsList,
      accommodation_type: accommodation_type || null,
      special_requests: special_requests || null,
      status: 'new',
      source: 'website',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('planning_requests')
      .insert(payload)
      .select('id')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    await sendPlanningRequestNotification({
      fullName: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      startDate: payload.start_date,
      endDate: payload.end_date,
      groupSize: payload.group_size,
      groupType: payload.group_type,
      cities: payload.cities,
      budget: payload.budget_range,
    }).catch(console.error);

    return res.json({
      success: true,
      id: data.id,
      message: "We'll contact you within 24 hours",
    });
  } catch (err) {
    console.error('Planning request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

