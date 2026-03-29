import express from 'express';
import { supabase } from '../services/supabase.js';
import { generateItinerary, ensureStorableItinerary } from '../services/aiService.js';
import { validate, planningRequestSchema } from '../middleware/validate.js';
import {
  sendPlanningRequestNotification,
  sendPlanningItineraryValidatedToTeam,
} from '../services/email.js';

const router = express.Router();

/** Public planning workflow (token-based). Mounted at /api/v1/itineraries — no auth. */
const publicItinerariesRouter = express.Router();

const VIEWABLE_WORKFLOW = ['SENT', 'VALIDATED', 'BOOKED'];

function jsonSafeForResponse(value) {
  try {
    return JSON.parse(
      JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
    );
  } catch (e) {
    console.error('itinerary response jsonSafe:', e);
    return value;
  }
}

async function ensureProfileRow(user) {
  if (!user?.id) return;
  const full_name =
    user.user_metadata?.full_name ||
    (user.email ? user.email.split('@')[0] : null) ||
    'Traveler';
  const { error } = await supabase.from('profiles').upsert(
    { id: user.id, email: user.email ?? null, full_name },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error && !String(error.message || '').toLowerCase().includes('duplicate'))
    console.error('ensureProfileRow:', error.message);
}

// GET /api/itineraries — newest first; use ?saved=1 for heart-saved only
router.get('/', async (req, res) => {
  try {
    const savedOnly =
      req.query.saved === '1' ||
      req.query.saved === 'true' ||
      req.query.saved_only === '1';
    let q = supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (savedOnly) q = q.eq('is_saved', true);
    const { data, error } = await q;

    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.itineraries'")) {
        return res.json({ itineraries: [], fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ itineraries: data || [] });
  } catch (err) {
    console.error('Itineraries list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/itineraries/generate
router.post('/generate', async (req, res) => {
  try {
    const { duration, group, budget, interests } = req.body || {};

    if (!duration || !group || !budget || !interests) {
      return res.status(400).json({ error: 'duration, group, budget, interests are required' });
    }
    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: 'interests must be a non-empty array' });
    }

    const interestsList = interests.map((x) => String(x));

    await ensureProfileRow(req.user);

    const prompt = `${duration} trip, ${group}, ${budget}, interests: ${interestsList.join(', ')}`;
    let content;
    try {
      content = await generateItinerary({
        duration,
        group,
        budget,
        interests: interestsList,
        userId: req.userId,
      });
    } catch (e) {
      // best-effort AI log
      try {
        await supabase.from('ai_logs').insert({
          user_id: req.userId,
          prompt,
          status: 'error',
          model: 'claude-sonnet',
        });
      } catch {
        // ignore logging failures
      }
      throw e;
    }

    content = ensureStorableItinerary(content, { duration, group, budget, interests: interestsList });

    const totalPrice =
      typeof content.estimatedTotal === 'number' && Number.isFinite(content.estimatedTotal)
        ? content.estimatedTotal
        : null;

    const title =
      typeof content.title === 'string'
        ? content.title
        : String(content.title ?? 'Morocco itinerary').slice(0, 500);

    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        user_id: req.userId,
        title,
        duration,
        group_type: group,
        budget,
        interests: interestsList,
        content,
        total_price: totalPrice,
        is_saved: false,
      })
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // best-effort AI log insert (admin AI Logs page)
    let estimatedTokens = 1;
    try {
      estimatedTokens = Math.max(
        1,
        Math.round(JSON.stringify(content || {}).length / 4)
      );
    } catch {
      estimatedTokens = 1;
    }
    try {
      await supabase.from('ai_logs').insert({
        user_id: req.userId,
        prompt,
        tokens_used: estimatedTokens,
        output_ref: data?.id,
        status: 'success',
        model: 'claude-sonnet',
      });
    } catch {
      // ignore logging failures
    }

    return res.status(201).json({ itinerary: jsonSafeForResponse(data) });
  } catch (err) {
    console.error('Itinerary generate error:', err);
    const expose = process.env.NODE_ENV !== 'production' && err?.message;
    return res.status(500).json({ error: expose || 'Internal server error' });
  }
});

// POST /api/itineraries/:id/save
router.post('/:id/save', async (req, res) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('itineraries')
      .select('id, is_saved')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Itinerary not found' });

    const { data, error } = await supabase
      .from('itineraries')
      .update({ is_saved: !existing.is_saved })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ itinerary: data });
  } catch (err) {
    console.error('Itinerary save error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/itineraries/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('Itinerary delete error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── /api/v1/itineraries — travel planning workflow (public) ─────────────

publicItinerariesRouter.post('/', validate(planningRequestSchema), async (req, res) => {
  try {
    const body = req.body;
    const start = new Date(body.start_date);
    const end = body.end_date ? new Date(body.end_date) : null;
    const durationDays =
      end && !Number.isNaN(end.getTime())
        ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

    const payload = {
      user_id: null,
      package_id: body.package_id || null,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      duration_days: durationDays,
      group_size: Number(body.group_size) || 1,
      group_type: body.group_type || null,
      cities: body.cities || [],
      budget_range: body.budget_range || null,
      interests: body.interests || [],
      accommodation_type: body.accommodation_type || null,
      special_requests: body.special_requests || null,
      status: 'new',
      source: 'website',
      workflow_status: 'DRAFT',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('planning_requests')
      .insert(payload)
      .select('id, public_token')
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

    return res.status(201).json({
      id: data.id,
      public_token: data.public_token,
      message: 'Request saved as draft and sent to our team',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

publicItinerariesRouter.get('/:id', async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).json({ error: 'token is required' });

    const { data, error } = await supabase
      .from('planning_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('public_token', token)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });

    if (!VIEWABLE_WORKFLOW.includes(data.workflow_status)) {
      return res.status(403).json({
        error:
          data.workflow_status === 'DRAFT'
            ? 'Itinerary draft not yet sent to client'
            : 'This itinerary is not available for viewing',
      });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

publicItinerariesRouter.post('/:id/validate', async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).json({ error: 'token is required' });

    const { data: row, error: fetchErr } = await supabase
      .from('planning_requests')
      .select('id, public_token, workflow_status, full_name, email')
      .eq('id', req.params.id)
      .single();
    if (fetchErr || !row) return res.status(404).json({ error: 'Not found' });
    if (row.public_token !== token) return res.status(403).json({ error: 'Invalid token' });

    if (row.workflow_status === 'VALIDATED') {
      return res.json({ success: true, alreadyValidated: true });
    }
    if (row.workflow_status !== 'SENT') {
      return res.status(400).json({
        error: 'Itinerary must be sent to the client before it can be validated',
      });
    }

    const { error } = await supabase
      .from('planning_requests')
      .update({
        workflow_status: 'VALIDATED',
        validated_at: new Date().toISOString(),
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (error) return res.status(400).json({ error: error.message });

    await sendPlanningItineraryValidatedToTeam({
      requestId: row.id,
      fullName: row.full_name,
      email: row.email,
    }).catch(console.error);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export { publicItinerariesRouter };
export default router;
