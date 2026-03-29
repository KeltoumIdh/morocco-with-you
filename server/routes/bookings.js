import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

const GUIDE_FEE = 40;

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, experiences(title, location, gradient, price)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.bookings'")) {
        return res.json({ bookings: [], fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ bookings: data || [] });
  } catch (err) {
    console.error('Bookings list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, experiences(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Booking not found' });
    return res.json({ booking: data });
  } catch (err) {
    console.error('Booking get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { experience_id, travel_date, guests, special_requests } = req.body || {};

    if (!experience_id) return res.status(400).json({ error: 'experience_id required' });
    if (!travel_date) return res.status(400).json({ error: 'travel_date required' });

    const g = Number(guests);
    if (!Number.isFinite(g) || g < 1 || g > 30) {
      return res.status(400).json({ error: 'guests must be between 1 and 30' });
    }

    const travel = new Date(travel_date);
    if (Number.isNaN(travel.getTime()) || travel.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'travel_date must be a future date' });
    }

    const { data: exp, error: expError } = await supabase
      .from('experiences')
      .select('price, max_group')
      .eq('id', experience_id)
      .eq('is_active', true)
      .single();

    if (expError || !exp) return res.status(404).json({ error: 'Experience not found' });

    if (exp.max_group && g > exp.max_group) {
      return res.status(400).json({ error: `Maximum group size for this experience is ${exp.max_group}` });
    }

    const subtotal = Number(exp.price) * g;
    const platform_fee = Math.round((subtotal + GUIDE_FEE) * 0.05 * 100) / 100;
    const total_amount = Math.round((subtotal + GUIDE_FEE + platform_fee) * 100) / 100;
    const commission_rate = 10;

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: req.userId,
        experience_id,
        travel_date,
        guests: g,
        total_amount,
        booking_type: 'experience',
        subtotal,
        platform_fee,
        commission_rate,
        status: 'pending',
        payment_status: 'pending',
        commission_status: 'pending',
        updated_at: new Date().toISOString(),
        special_requests: special_requests || null,
      })
      .select('*, experiences(title, location, gradient, price)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ booking });
  } catch (err) {
    console.error('Booking create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/bookings/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (status !== 'cancelled') return res.status(400).json({ error: 'Only status=cancelled is allowed' });

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, travel_date, status')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !booking) return res.status(404).json({ error: 'Booking not found' });

    const travel = new Date(booking.travel_date);
    const hoursUntil = (travel.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 48) return res.status(400).json({ error: 'Cancellation window has passed' });

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', commission_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select('*, experiences(title, location, gradient, price)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ booking: data });
  } catch (err) {
    console.error('Booking cancel error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
