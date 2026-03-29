import express from 'express';
import { supabase } from '../services/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { normalizeExperienceTagsList } from '../utils/experienceTags.js';
import { validate, providerSchema, providerServiceSchema } from '../middleware/validate.js';
import { generateCommissionReport } from '../services/pdfService.js';
import { sendCommissionReport } from '../services/email.js';
import { scheduleEmbedCatalogue, scheduleEmbedProvider, embedAllOfType } from '../services/embeddings.js';
import {
  suggestItineraryForRequest,
  activeChatModelForLogging,
} from '../services/aiService.js';
import { invalidatePromptCache } from '../services/promptManager.js';

const router = express.Router();

const PROMPT_FEATURES = [
  'chat_system',
  'itinerary',
  'suggest_admin',
  'recommendations',
  'guardrail',
];
router.use(requireAdmin);

// ── DASHBOARD ──────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [
      { count: totalBookings },
      { count: totalUsers },
      { count: totalExperiences },
      { count: newPlanningRequests },
      { count: activityBookingsCount },
      { data: revenueData },
      { data: recentBookings },
      { data: aiLogs },
      { data: recentPlanningRequests },
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count:'exact', head:true }),
      supabase.from('profiles').select('*', { count:'exact', head:true }),
      supabase.from('experiences').select('*', { count:'exact', head:true }).eq('is_active', true),
      supabase.from('planning_requests').select('*', { count:'exact', head:true }).eq('status', 'new'),
      supabase.from('activity_bookings').select('*', { count:'exact', head:true }),
      supabase.from('bookings')
        .select('total_amount, created_at, status')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true }),
      supabase.from('bookings')
        .select('*, profiles(full_name, avatar_url), experiences(title)')
        .order('created_at', { ascending: false })
        .limit(7),
      supabase.from('ai_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('planning_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Group revenue by month
    const monthlyRevenue = {};
    (revenueData || []).forEach(b => {
      const month = new Date(b.created_at).toLocaleString('en',{month:'short'});
      if (!monthlyRevenue[month]) monthlyRevenue[month] = { month, revenue:0, commissions:0, bookings:0 };
      monthlyRevenue[month].revenue    += Number(b.total_amount);
      monthlyRevenue[month].commissions += Number(b.total_amount) * 0.1;
      monthlyRevenue[month].bookings   += 1;
    });

    const totalRevenue = (revenueData || []).reduce((s,b) => s + Number(b.total_amount), 0);

    return res.json({
      kpis: {
        totalRevenue,
        totalBookings,
        totalUsers,
        totalExperiences,
        commission: totalRevenue * 0.1,
        planningRequestsNew: newPlanningRequests || 0,
        activityBookingsCount: activityBookingsCount || 0,
      },
      revenueChart: Object.values(monthlyRevenue),
      recentBookings,
      recentPlanningRequests,
      aiLogs,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── ACTIVITY BOOKINGS (admin list) ───────────────
router.get('/activity-bookings', async (req, res) => {
  try {
    const { limit = 200, offset = 0, status } = req.query;
    let query = supabase
      .from('activity_bookings')
      .select('*, profiles(full_name, avatar_url, email), activities(title, location, price, price_type)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.json({ bookings: data || [], total: count ?? 0 });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── PACKAGE BOOKINGS (admin list) ────────────────
router.get('/package-bookings', async (req, res) => {
  try {
    const { limit = 200, offset = 0, status } = req.query;
    let query = supabase
      .from('package_bookings')
      .select('*, profiles(full_name, avatar_url, email), packages(title, cities, price_from)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.json({ bookings: data || [], total: count ?? 0 });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── ACTIVITIES (admin CRUD) ────────────────────
router.get('/activities', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/activities', async (req, res) => {
  try {
    const { title, location } = req.body || {};
    if (!title || !location) return res.status(400).json({ error: 'title, location required' });
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...req.body, is_active: req.body?.is_active !== false })
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'activity');
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/activities/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'activity');
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/activities/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('activities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── ACCOMMODATIONS (admin CRUD) ────────────────
router.get('/accommodations', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/accommodations', async (req, res) => {
  try {
    const { name, location } = req.body || {};
    if (!name || !location) return res.status(400).json({ error: 'name, location required' });
    const { data, error } = await supabase
      .from('accommodations')
      .insert({ ...req.body, is_active: req.body?.is_active !== false })
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'accommodation');
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/accommodations/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('accommodations')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'accommodation');
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/accommodations/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('accommodations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── RESTAURANTS (admin CRUD) ───────────────────
router.get('/restaurants', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/restaurants', async (req, res) => {
  try {
    const { name, location } = req.body || {};
    if (!name || !location) return res.status(400).json({ error: 'name, location required' });
    const { data, error } = await supabase
      .from('restaurants')
      .insert({ ...req.body, is_active: req.body?.is_active !== false })
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'restaurant');
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/restaurants/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'restaurant');
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/restaurants/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── PACKAGES (admin CRUD) ──────────────────────
router.get('/packages', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/packages', async (req, res) => {
  try {
    const { title, duration_days, price_from } = req.body || {};
    if (!title || duration_days == null || price_from == null) {
      return res.status(400).json({ error: 'title, duration_days, price_from required' });
    }
    const { data, error } = await supabase
      .from('packages')
      .insert({ ...req.body, is_active: req.body?.is_active !== false })
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'package');
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/packages/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'package');
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/packages/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('packages')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── PLANNING REQUESTS (admin) ──────────────────
router.get('/planning-requests', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('planning_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/planning-requests/:id', async (req, res) => {
  try {
    const allowed = [
      'status',
      'admin_notes',
      'quoted_price',
      'workflow_status',
      'itinerary_items',
      'margin_percent',
      'services_cost',
      'final_price',
      'sent_at',
      'validated_at',
      'booked_at',
      'expires_at',
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
    );
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('planning_requests')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── EXPERIENCES (admin CRUD) ────────────────
router.get('/experiences', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/experiences', async (req, res) => {
  try {
    const {
      title,
      location,
      description,
      price,
      duration,
      route,
      max_group,
      tags,
      gradient,
      is_active,
      image_url,
      featured,
    } = req.body;
    if (!title || !location || !price) {
      return res.status(400).json({ error: 'title, location, price required' });
    }
    const img = image_url != null && String(image_url).trim() !== '' ? String(image_url).trim() : null;
    const { data, error } = await supabase
      .from('experiences')
      .insert({
        title,
        location,
        description,
        price: Number(price),
        duration: duration || null,
        route: route != null && String(route).trim() !== '' ? String(route).trim() : null,
        max_group: Number(max_group) || 8,
        tags: normalizeExperienceTagsList(tags || []),
        gradient,
        is_active: is_active !== false,
        image_url: img,
        featured: !!featured,
      })
      .select()
      .single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'experience');
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/experiences/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.tags != null) updates.tags = normalizeExperienceTagsList(updates.tags);
    const { data, error } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    scheduleEmbedCatalogue(data, 'experience');
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/experiences/:id', async (req, res) => {
  try {
    // Soft delete
    const { error } = await supabase
      .from('experiences')
      .update({ is_active: false })
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── BOOKINGS (admin view all) ───────────────
router.get('/bookings', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = supabase
      .from('bookings')
      .select('*, profiles(full_name, avatar_url, email), experiences(title, location, gradient)')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.json({ bookings: data, total: count });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/bookings/:id', async (req, res) => {
  try {
    const allowed = ['status', 'special_requests'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (updates.status === 'cancelled') updates.commission_status = 'cancelled';
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── USERS (admin view) ──────────────────────
router.get('/users', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Enrich with booking stats
    const enriched = await Promise.all(profiles.map(async p => {
      const { count, data: bData } = await supabase
        .from('bookings')
        .select('total_amount', { count: 'exact' })
        .eq('user_id', p.id)
        .eq('status', 'confirmed');
      const spent = (bData || []).reduce((s, b) => s + Number(b.total_amount), 0);
      return { ...p, booking_count: count || 0, total_spent: spent };
    }));

    return res.json(enriched);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['role', 'full_name', 'location'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── POSTS (blog) ────────────────────────────
router.get('/posts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/posts', async (req, res) => {
  try {
    const { title, excerpt, content, category, status, image_url } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const { data, error } = await supabase
      .from('posts')
      .insert({ title, excerpt, content, category, 
                status: status || 'draft', image_url,
                author_id: req.userId, views: 0 })
      .select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/posts/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── COMMISSIONS ─────────────────────────────
router.get('/commissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, total_amount, status, created_at, commission_status, profiles(full_name), experiences(title)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map(b => ({
      id:           'CM-' + b.id.slice(0,6),
      booking_id:   b.id,
      user:         b.profiles?.full_name || 'Unknown',
      trip:         b.experiences?.title  || 'Unknown',
      date:         new Date(b.created_at).toLocaleDateString('en',{month:'short',day:'numeric'}),
      booking_amt:  Number(b.total_amount),
      commission:   Math.round(Number(b.total_amount) * 0.1),
      status:       b.commission_status || (b.status === 'confirmed' ? 'paid' : b.status === 'cancelled' ? 'cancelled' : 'pending'),
    }));
    return res.json(mapped);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/commissions/:bookingId', async (req, res) => {
  try {
    const { commission_status } = req.body;
    const { data, error } = await supabase
      .from('bookings')
      .update({ commission_status })
      .eq('id', req.params.bookingId)
      .select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// GET /admin/commissions/report?provider_id=...&month=YYYY-MM
router.get('/commissions/report', async (req, res) => {
  try {
    const { provider_id, month } = req.query;
    if (!provider_id || !month) {
      return res.status(400).json({ error: 'provider_id and month required' });
    }

    const [year, m] = String(month).split('-').map(Number);
    const start = new Date(year, m - 1, 1).toISOString().split('T')[0];
    const end = new Date(year, m, 0).toISOString().split('T')[0];

    const [{ data: provider }, { data: bookings }] = await Promise.all([
      supabase.from('providers').select('*').eq('id', provider_id).single(),
      supabase
        .from('bookings')
        .select('id, created_at, guests, total_amount, commission_total, provider_services(name)')
        .eq('provider_id', provider_id)
        .eq('payment_status', 'paid')
        .gte('created_at', start)
        .lte('created_at', `${end}T23:59:59`),
    ]);

    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const enriched = (bookings || []).map((b) => ({
      ...b,
      service: b.provider_services?.name || '—',
    }));
    const totalRevenue = enriched.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const totalCommission = enriched.reduce((s, b) => s + Number(b.commission_total || 0), 0);

    const pdfBuffer = await generateCommissionReport({
      provider,
      bookings: enriched,
      period: month,
      totalRevenue,
      totalCommission,
    });

    const fileName = `reports/${provider_id}/${month}.pdf`;
    const upload = await supabase.storage.from('reports').upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (upload.error) return res.status(400).json({ error: upload.error.message });
    const { data: pub } = supabase.storage.from('reports').getPublicUrl(fileName);

    await supabase.from('commission_reports').upsert(
      {
        provider_id,
        period_start: start,
        period_end: end,
        total_bookings: enriched.length,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        pdf_url: pub.publicUrl,
      },
      { onConflict: 'provider_id,period_start' }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="commission-${String(provider.name || 'provider').replace(/\s+/g, '-')}-${month}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF report error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/commissions/send-report', async (req, res) => {
  try {
    const { provider_id, month } = req.body || {};
    if (!provider_id || !month) {
      return res.status(400).json({ error: 'provider_id and month required' });
    }
    const [year, m] = String(month).split('-').map(Number);
    const start = new Date(year, m - 1, 1).toISOString().split('T')[0];

    const { data: report } = await supabase
      .from('commission_reports')
      .select('*')
      .eq('provider_id', provider_id)
      .eq('period_start', start)
      .single();
    if (!report) return res.status(404).json({ error: 'Generate the report first' });

    const { data: provider } = await supabase
      .from('providers')
      .select('name, email')
      .eq('id', provider_id)
      .single();
    if (!provider?.email) return res.status(400).json({ error: 'Provider email missing' });

    await sendCommissionReport({
      toEmail: provider.email,
      providerName: provider.name,
      month,
      totalRevenue: report.total_revenue,
      totalCommission: report.total_commission,
      pdfUrl: report.pdf_url,
    });

    await supabase
      .from('commission_reports')
      .update({ sent_at: new Date().toISOString(), status: 'sent' })
      .eq('id', report.id);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── AI OBSERVABILITY ─────────────────────────
router.get('/ai/metrics', async (_req, res) => {
  try {
    const { data: rpcSummary, error: rpcErr } = await supabase.rpc(
      'get_ai_metrics_summary'
    );
    if (rpcErr) console.warn('[admin/ai/metrics] rpc:', rpcErr.message);

    const { data: recentLogs, error: e1 } = await supabase
      .from('ai_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (e1) throw e1;

    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: weekLogs, error: e2 } = await supabase
      .from('ai_logs')
      .select('feature, status, latency_ms')
      .gte('created_at', weekAgo);
    if (e2) throw e2;

    const { count: totalCalls, error: e3 } = await supabase
      .from('ai_logs')
      .select('*', { count: 'exact', head: true });
    if (e3) throw e3;

    const dayAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: dayLogs, error: e4 } = await supabase
      .from('ai_logs')
      .select('status')
      .gte('created_at', dayAgo);
    if (e4) throw e4;

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { data: todayLogs } = await supabase
      .from('ai_logs')
      .select('tokens_used, cost_usd')
      .gte('created_at', start.toISOString());

    const featureStats = {};
    (weekLogs || []).forEach((log) => {
      const f = log.feature || 'chat';
      if (!featureStats[f]) featureStats[f] = { calls: 0, errors: 0 };
      featureStats[f].calls++;
      if (log.status === 'error') featureStats[f].errors++;
    });

    const todayCost = (todayLogs || []).reduce(
      (sum, l) =>
        sum +
        Number(
          l.cost_usd != null
            ? l.cost_usd
            : (l.tokens_used || 0) * 0.00000015 || 0
        ),
      0
    );

    const errors24h = (dayLogs || []).filter((l) => l.status === 'error').length;
    const total24h = (dayLogs || []).length;

    const avgLatency = recentLogs?.length
      ? Math.round(
          recentLogs.reduce(
            (s, l) => s + (Number(l.latency_ms) || 0),
            0
          ) / recentLogs.length
        )
      : 0;

    return res.json({
      kpis: {
        totalCalls: totalCalls ?? 0,
        todayCost: todayCost.toFixed(4),
        errorRate24h: total24h
          ? ((errors24h / total24h) * 100).toFixed(1)
          : '0.0',
        avgLatency,
      },
      rpcSummary: rpcSummary || null,
      featureStats,
      recentLogs: recentLogs || [],
    });
  } catch (err) {
    console.error('AI metrics error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ai/suggest-itinerary', async (req, res) => {
  try {
    const { request_id } = req.body || {};
    if (!request_id) {
      return res.status(400).json({ error: 'request_id required' });
    }

    const { data: request, error } = await supabase
      .from('planning_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const startTime = Date.now();
    const suggestion = await suggestItineraryForRequest({
      request,
      adminId: req.userId,
    });
    const latencyMs = Date.now() - startTime;

    if (suggestion.error) {
      const { error: logErr } = await supabase.from('ai_logs').insert({
        user_id: req.userId,
        feature: 'suggest_itinerary',
        prompt: `Planning request ${request_id}`,
        tokens_used: suggestion.tokens_used || 0,
        status: 'error',
        model: activeChatModelForLogging() || 'gpt-4o-mini',
        latency_ms: latencyMs,
        items_retrieved: 0,
        error_msg: suggestion.error,
      });
      if (logErr) console.error('[LOG] ai_logs suggest:', logErr.message);
      return res.status(400).json({ error: suggestion.error });
    }

    const { error: logErr } = await supabase.from('ai_logs').insert({
      user_id: req.userId,
      feature: 'suggest_itinerary',
      prompt: `Planning request ${request_id}`,
      tokens_used: suggestion.tokens_used || 0,
      status: 'success',
      model: activeChatModelForLogging() || 'gpt-4o-mini',
      latency_ms: latencyMs,
      items_retrieved: (suggestion.catalogue_items || []).length,
      cost_usd:
        Math.round(
          (suggestion.tokens_used || 0) * 0.00000015 * 1e6
        ) / 1e6,
    });
    if (logErr) console.error('[LOG] ai_logs suggest:', logErr.message);

    return res.json({ suggestion, latencyMs });
  } catch (err) {
    console.error('Suggest itinerary error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ai/embed-all', async (req, res) => {
  try {
    const { type } = req.body || {};
    const types = type
      ? [String(type)]
      : [
          'experience',
          'activity',
          'accommodation',
          'restaurant',
          'package',
          'provider',
          'group_trip',
        ];

    Promise.all(types.map((t) => embedAllOfType(t)))
      .then((results) => console.log('[EMBED] Batch complete:', results))
      .catch((err) => console.error('[EMBED] Batch error:', err));

    return res.json({
      message: `Embedding started for: ${types.join(', ')}`,
      types,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── RAG retrieval evaluation (eval_queries / eval_runs) ──
router.get('/ai/eval/runs', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('eval_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('[admin/ai/eval/runs]', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ai/eval/run', async (req, res) => {
  try {
    const mode = String(req.body?.mode || 'hybrid').toLowerCase();
    const k = Math.min(20, Math.max(1, Number(req.body?.k) || 5));
    if (!['hybrid', 'vector', 'keyword'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be hybrid, vector, or keyword' });
    }

    const { runEvaluation } = await import('../services/evaluator.js');
    runEvaluation({
      runName: `admin-${mode}-${Date.now()}`,
      searchMode: mode,
      k,
      threshold: mode === 'vector' ? 0.65 : 0.6,
      vectorWeight: 0.65,
      keywordWeight: 0.35,
    })
      .then((r) => console.log('[EVAL] complete:', r.aggregates))
      .catch((e) => console.error('[EVAL] failed:', e.message));

    return res.json({ message: 'Evaluation started', mode, k });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/ai/eval/compare', async (req, res) => {
  try {
    const run1 = String(req.query.run1 || '').trim();
    const run2 = String(req.query.run2 || '').trim();
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(run1) || !uuidRe.test(run2)) {
      return res.status(400).json({ error: 'run1 and run2 must be UUIDs' });
    }
    const { compareRuns } = await import('../services/evaluator.js');
    const comparison = await compareRuns(run1, run2);
    return res.json(comparison);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Prompt templates (versioned) + cache bust ────────────────
router.get('/ai/prompts', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('feature', { ascending: true })
      .order('version', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('[admin/ai/prompts]', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ai/prompts', async (req, res) => {
  try {
    const body = req.body || {};
    const dupId = body.duplicate_from_id;

    if (dupId) {
      const { data: src, error: e1 } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('id', dupId)
        .single();
      if (e1 || !src) {
        return res.status(404).json({ error: 'Source prompt not found' });
      }
      const { data: maxRows } = await supabase
        .from('prompt_templates')
        .select('version')
        .eq('feature', src.feature)
        .order('version', { ascending: false })
        .limit(1);
      const nextV = (maxRows?.[0]?.version ?? 0) + 1;
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          name: body.name || src.name,
          version: nextV,
          feature: src.feature,
          content: body.content != null ? body.content : src.content,
          variables: body.variables ?? src.variables ?? [],
          language: body.language || src.language || 'en',
          is_active: false,
          notes: body.notes ?? `Duplicated from v${src.version}`,
          created_by: req.userId || null,
        })
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data);
    }

    const { feature, content, name, notes, variables, language } = body;
    if (!feature || !PROMPT_FEATURES.includes(feature) || !content) {
      return res
        .status(400)
        .json({ error: 'feature and content required; feature must be allowed' });
    }
    const { data: maxRows } = await supabase
      .from('prompt_templates')
      .select('version')
      .eq('feature', feature)
      .order('version', { ascending: false })
      .limit(1);
    const nextV = (maxRows?.[0]?.version ?? 0) + 1;
    const nm = name || `${feature}_${nextV}`;
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        name: nm,
        version: nextV,
        feature,
        content,
        variables: Array.isArray(variables) ? variables : [],
        language: language || 'en',
        is_active: false,
        notes: notes || null,
        created_by: req.userId || null,
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/ai/prompts/:id', async (req, res) => {
  try {
    const allowed = ['content', 'notes', 'variables', 'language', 'name'];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const { data, error } = await supabase
      .from('prompt_templates')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (data?.feature) invalidatePromptCache(data.feature);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ai/prompts/:id/activate', async (req, res) => {
  try {
    const { data: target, error: e1 } = await supabase
      .from('prompt_templates')
      .select('id, feature')
      .eq('id', req.params.id)
      .single();
    if (e1 || !target) return res.status(404).json({ error: 'Prompt not found' });

    const { error: e2 } = await supabase
      .from('prompt_templates')
      .update({ is_active: false })
      .eq('feature', target.feature);
    if (e2) throw e2;

    const { data, error: e3 } = await supabase
      .from('prompt_templates')
      .update({ is_active: true })
      .eq('id', target.id)
      .select()
      .single();
    if (e3) throw e3;

    invalidatePromptCache(target.feature);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ai/prompts/invalidate-cache', async (_req, res) => {
  try {
    invalidatePromptCache();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── AI LOGS ─────────────────────────────────
router.get('/ai-logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── EVENT REQUESTS (custom / group trip inquiries) ───────────
router.get('/event-requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/event-requests/:id', async (req, res) => {
  try {
    const allowed = ['status'];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Only status can be updated' });
    }
    const { data, error } = await supabase
      .from('event_requests')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── PROVIDERS (Prestataires) ───────────────────────────────────
router.get('/providers', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/providers', validate(providerSchema), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('providers').insert(payload).select().single();
    if (error) return res.status(400).json({ error: error.message });
    scheduleEmbedCatalogue(data, 'provider');
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/providers/:id', async (req, res) => {
  try {
    const allowed = [
      'name', 'type', 'city', 'description', 'address', 'phone', 'email', 'website',
      'logo_url', 'cover_url', 'images', 'languages', 'commission_rate', 'bank_iban', 'bank_name',
      'status', 'verified', 'tags', 'rating', 'review_count',
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
    );
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    scheduleEmbedCatalogue(data, 'provider');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/providers/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/providers/:id/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('provider_services')
      .select('*')
      .eq('provider_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/providers/:id/services', validate(providerServiceSchema), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('provider_services')
      .insert({ ...req.body, provider_id: req.params.id })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    scheduleEmbedProvider(req.params.id);
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/provider-services/:id', async (req, res) => {
  try {
    const allowed = [
      'title', 'description', 'category', 'price', 'price_type', 'duration',
      'max_capacity', 'min_age', 'images', 'is_available',
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
      .from('provider_services')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    if (data?.provider_id) scheduleEmbedProvider(data.provider_id);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/provider-services/:id', async (req, res) => {
  try {
    const { data: svc } = await supabase
      .from('provider_services')
      .select('provider_id')
      .eq('id', req.params.id)
      .maybeSingle();
    const { error } = await supabase.from('provider_services').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    if (svc?.provider_id) scheduleEmbedProvider(svc.provider_id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GROUP TRIPS (admin CRUD) ──────────────────────────────────
router.get('/group-trips', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_trips_with_availability')
      .select('*')
      .order('start_date', { ascending: true });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/group-trips', async (req, res) => {
  try {
    const {
      title,
      destination,
      start_date,
      end_date,
      max_capacity,
      price_per_person,
      status,
    } = req.body || {};
    if (!title || !destination || !start_date || !end_date || price_per_person == null) {
      return res.status(400).json({ error: 'title, destination, start_date, end_date, price_per_person required' });
    }
    const payload = {
      ...req.body,
      max_capacity: Number(max_capacity) || 16,
      price_per_person: Number(price_per_person),
      status: status || 'open',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('group_trips')
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    scheduleEmbedCatalogue(data, 'group_trip');
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/group-trips/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.max_capacity != null) updates.max_capacity = Number(updates.max_capacity) || 16;
    if (updates.price_per_person != null) updates.price_per_person = Number(updates.price_per_person);
    const { data, error } = await supabase
      .from('group_trips')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    scheduleEmbedCatalogue(data, 'group_trip');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/group-trips/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_trips')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/group-trips/:id/enrollments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_trip_enrollments')
      .select('*, profiles(full_name, email), bookings(total_amount, status, payment_status)')
      .eq('group_trip_id', req.params.id)
      .order('enrolled_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

