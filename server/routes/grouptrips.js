import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { createCheckoutSession } from '../services/stripe.js';

const router = express.Router();

const clientBase = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// GET /api/v1/group-trips
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_trips_with_availability')
      .select('*')
      .in('status', ['open', 'full'])
      .order('start_date', { ascending: true });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/group-trips/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_trips_with_availability')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/group-trips/:id/join
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const { guests = 1, special_requests } = req.body || {};
    const g = Math.max(1, Math.min(16, Number(guests) || 1));
    const groupTripId = req.params.id;

    const { data: trip, error: tripErr } = await supabase
      .from('group_trips_with_availability')
      .select('*')
      .eq('id', groupTripId)
      .single();

    if (tripErr || !trip) return res.status(404).json({ error: 'Group trip not found' });
    if (trip.status !== 'open') {
      return res.status(400).json({ error: 'This trip is not open for registration' });
    }
    if (Number(trip.spots_available) < g) {
      return res.status(400).json({ error: `Only ${trip.spots_available} spot(s) available` });
    }

    const unit = Number(trip.price_per_person || 0);
    const totalAmount = Math.round(unit * g * 100) / 100;

    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .insert({
        user_id: req.userId,
        booking_type: 'group_trip',
        travel_date: trip.start_date,
        guests: g,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        special_requests: special_requests ? String(special_requests) : null,
        commission_rate: 10,
        commission_total: totalAmount * 0.1,
      })
      .select('*')
      .single();

    if (bookErr) return res.status(400).json({ error: bookErr.message });

    const { error: enrErr } = await supabase.from('group_trip_enrollments').insert({
      group_trip_id: groupTripId,
      user_id: req.userId,
      booking_id: booking.id,
      guests: g,
      status: 'pending',
    });
    if (enrErr) return res.status(400).json({ error: enrErr.message });

    const session = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: trip.title },
            unit_amount: Math.max(50, Math.round(totalAmount * 100)),
          },
          quantity: 1,
        },
      ],
      bookingId: booking.id,
      userId: req.userId,
      successUrl: `${clientBase()}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${clientBase()}/booking/cancel`,
      metadata: { group_trip_id: groupTripId },
    });

    await supabase
      .from('bookings')
      .update({
        stripe_session_id: session.id,
        payment_status: 'processing',
      })
      .eq('id', booking.id);

    return res.status(201).json({
      booking,
      url: session.url,
      session_id: session.id,
      spots_remaining: Number(trip.spots_available) - g,
      message: 'Enrollment created — complete payment to confirm',
    });
  } catch (err) {
    console.error('Group trip join error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

