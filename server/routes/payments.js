import express from 'express';
import { supabase } from '../services/supabase.js';
import { createCheckoutSession, constructWebhookEvent } from '../services/stripe.js';
import { requireAuth } from '../middleware/auth.js';
import { sendBookingConfirmation, sendGroupTripConfirmation } from '../services/email.js';

const router = express.Router();

const clientBase = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// ── Create Checkout Session ──────────────────
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { booking_id } = req.body || {};
    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id required' });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, experiences(title)')
      .eq('id', booking_id)
      .eq('user_id', req.userId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Already paid' });
    }

    const title = booking.experiences?.title || 'Morocco With You Experience';

    const unitCents = Math.max(50, Math.round(Number(booking.total_amount || 0) * 100));
    if (!Number.isFinite(unitCents)) {
      return res.status(400).json({ error: 'Invalid booking amount' });
    }

    const session = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: title },
            unit_amount: unitCents,
          },
          quantity: 1,
        },
      ],
      bookingId: booking_id,
      userId: req.userId,
      successUrl: `${clientBase()}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${clientBase()}/booking/cancel`,
    });

    const { error: upErr } = await supabase
      .from('bookings')
      .update({
        stripe_session_id: session.id,
        payment_status: 'processing',
      })
      .eq('id', booking_id);

    if (upErr) {
      console.error('Failed to store Stripe session on booking:', upErr);
      return res.status(400).json({ error: upErr.message });
    }

    return res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    const msg =
      err?.message?.includes('STRIPE_SECRET_KEY') || err?.message?.includes('payment operations')
        ? 'Payment service not configured'
        : err.message;
    return res.status(500).json({ error: msg });
  }
});

// ── Stripe Webhook (raw body) — registered in index.js BEFORE express.json ──
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    await supabase.from('stripe_events').insert({
      stripe_event_id: event.id,
      type: event.type,
      payload: event.data?.object ? event.data : event,
    });
  } catch (e) {
    if (!String(e?.message || '').includes('duplicate') && !String(e?.code || '').includes('23505')) {
      console.error('stripe_events insert:', e);
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) break;

        const { data: booking } = await supabase
          .from('bookings')
          .select('id, user_id, booking_type, travel_date, guests, total_amount, commission_rate, stripe_session_id')
          .eq('id', bookingId)
          .single();

        const rate = Number(booking?.commission_rate ?? 10);
        const commissionTotal = booking
          ? Number(booking.total_amount || 0) * (rate / 100)
          : 0;

        const pi = session.payment_intent;
        const paymentIntentId = typeof pi === 'string' ? pi : pi?.id;

        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            stripe_payment_intent_id: paymentIntentId || null,
            commission_total: commissionTotal,
            commission_status: 'due',
            confirmed_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id);

        // If group trip booking, confirm enrollment + update trip status if full
        if (booking?.booking_type === 'group_trip') {
          await supabase
            .from('group_trip_enrollments')
            .update({ status: 'confirmed' })
            .eq('booking_id', bookingId);

          const { data: enr } = await supabase
            .from('group_trip_enrollments')
            .select('group_trip_id')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (enr?.group_trip_id) {
            const { data: gt } = await supabase
              .from('group_trips_with_availability')
              .select('id, spots_available')
              .eq('id', enr.group_trip_id)
              .single();
            if (gt && Number(gt.spots_available) <= 0) {
              await supabase.from('group_trips').update({ status: 'full' }).eq('id', gt.id);
            }
          }
        }

        // Email confirmation (never block webhook)
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', booking.user_id)
            .single();

          if (prof?.email) {
            const ref = String(booking.id).slice(0, 8).toUpperCase();
            if (booking.booking_type === 'group_trip') {
              const { data: enr } = await supabase
                .from('group_trip_enrollments')
                .select('group_trip_id')
                .eq('booking_id', bookingId)
                .maybeSingle();
              const { data: trip } = enr?.group_trip_id
                ? await supabase.from('group_trips').select('title, start_date').eq('id', enr.group_trip_id).single()
                : { data: null };
              await sendGroupTripConfirmation({
                toEmail: prof.email,
                toName: prof.full_name,
                tripTitle: trip?.title || 'Group Trip',
                startDate: trip?.start_date || booking.travel_date,
                guests: booking.guests,
                totalAmount: booking.total_amount,
                bookingRef: ref,
              }).catch(console.error);
            } else {
              const { data: exp } = await supabase
                .from('bookings')
                .select('experiences(title)')
                .eq('id', bookingId)
                .single();
              await sendBookingConfirmation({
                toEmail: prof.email,
                toName: prof.full_name,
                bookingRef: ref,
                experienceTitle: exp?.experiences?.title || 'Morocco Experience',
                travelDate: booking.travel_date,
                guests: booking.guests,
                totalAmount: booking.total_amount,
              }).catch(console.error);
            }
          }
        } catch (e) {
          console.error('Email send error:', e?.message || e);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await supabase
          .from('bookings')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('stripe_payment_intent_id', pi.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const pid = charge.payment_intent;
        if (pid) {
          await supabase
            .from('bookings')
            .update({
              payment_status: 'refunded',
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              commission_status: 'cancelled',
            })
            .eq('stripe_payment_intent_id', pid);
        }
        break;
      }

      default:
        break;
    }

    await supabase
      .from('stripe_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    try {
      await supabase
        .from('stripe_events')
        .update({ error: err.message })
        .eq('stripe_event_id', event.id);
    } catch (_) {
      /* ignore */
    }
    return res.status(500).json({ error: err.message });
  }
}

router.get('/status/:bookingId', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status, payment_status, total_amount, confirmed_at')
      .eq('id', req.params.bookingId)
      .eq('user_id', req.userId)
      .single();

    if (error) return res.status(404).json({ error: 'Not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/status-by-session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status, payment_status, total_amount, confirmed_at, stripe_session_id')
      .eq('stripe_session_id', req.params.sessionId)
      .eq('user_id', req.userId)
      .single();

    if (error) return res.status(404).json({ error: 'Not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
