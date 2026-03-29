import express from 'express';
import { supabase } from '../services/supabase.js';
import { sendEventRequestNotification } from '../services/email.js';

const router = express.Router();

// POST /api/events/request
router.post('/request', async (req, res) => {
  try {
    const {
      event_type,
      group_size,
      preferred_dates,
      budget_range,
      requirements,
      contact_name,
      contact_email,
      contact_phone,
    } = req.body || {};

    if (!contact_name || !contact_email || !event_type) {
      return res.status(400).json({ error: 'contact_name, contact_email, event_type required' });
    }

    const { data, error } = await supabase
      .from('event_requests')
      .insert({
        user_id: null,
        event_type,
        group_size: group_size ? Number(group_size) : null,
        preferred_dates: preferred_dates || null,
        budget_range: budget_range || null,
        requirements: requirements || null,
        contact_name,
        contact_email,
        contact_phone: contact_phone || null,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await sendEventRequestNotification({
      fullName: contact_name,
      email: contact_email,
      eventType: event_type,
      eventDate: preferred_dates,
      groupSize: group_size ? Number(group_size) : null,
      budget: budget_range,
      message: requirements,
    }).catch(console.error);

    return res.status(201).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Event request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
