import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const uid = req.userId;
    const authEmail = req.user?.email || null;

    let profileRes = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();

    if (profileRes.data && authEmail && !profileRes.data.email) {
      await supabase.from('profiles').update({ email: authEmail }).eq('id', uid);
      profileRes = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    }

    if (profileRes.error) {
      const msg = String(profileRes.error.message || '');
      if (msg.includes("Could not find the table 'public.profiles'")) {
        return res.json({
          profile: { id: uid, full_name: null, location: null, language: 'en', currency: 'EUR' },
          stats: { booking_count: 0, saved_count: 0, total_spent: 0 },
          fallback: true,
        });
      }
      return res.status(400).json({ error: profileRes.error.message });
    }

    // No row yet: .single() used to 400 — create row (service role) or return safe payload
    if (!profileRes.data) {
      const ins = await supabase
        .from('profiles')
        .upsert({ id: uid, email: authEmail }, { onConflict: 'id' })
        .select('*')
        .maybeSingle();
      if (!ins.error && ins.data) {
        profileRes = { data: ins.data, error: null };
      } else {
        return res.json({
          profile: { id: uid, full_name: null, location: null, language: 'en', currency: 'EUR' },
          stats: { booking_count: 0, saved_count: 0, total_spent: 0 },
          fallback: true,
          note: ins.error?.message || 'profile row missing; could not auto-create',
        });
      }
    }

    const [bookingCountRes, savedCountRes, spentRes] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('saved_experiences').select('experience_id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('bookings').select('total_amount').eq('user_id', uid).eq('status', 'confirmed'),
    ]);

    const booking_count = bookingCountRes.error ? 0 : (bookingCountRes.count ?? 0);
    const saved_count = savedCountRes.error ? 0 : (savedCountRes.count ?? 0);
    const total_spent = spentRes.error
      ? 0
      : (spentRes.data || []).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    return res.json({
      profile: profileRes.data,
      stats: { booking_count, saved_count, total_spent },
    });
  } catch (err) {
    console.error('Profile get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/profile
router.patch('/', async (req, res) => {
  try {
    const allowed = ['full_name', 'location', 'language', 'currency'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.userId)
      .select('*')
      .single();
    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.saved_experiences'")) {
        return res.json({ saved: [], fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ profile: data });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/saved
router.get('/saved', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saved_experiences')
      .select('saved_at, experiences(*)')
      .eq('user_id', req.userId)
      .order('saved_at', { ascending: false });
    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.saved_experiences'")) {
        return res.json({ saved: [], fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.json({ saved: (data || []).map((row) => ({ ...row.experiences, saved_at: row.saved_at })) });
  } catch (err) {
    console.error('Saved list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/saved
router.post('/saved', async (req, res) => {
  try {
    const { experience_id } = req.body || {};
    if (!experience_id) return res.status(400).json({ error: 'experience_id required' });

    const { data, error } = await supabase
      .from('saved_experiences')
      .upsert({ user_id: req.userId, experience_id }, { onConflict: 'user_id,experience_id' })
      .select('*')
      .single();
    if (error) {
      if (String(error.message || '').includes("Could not find the table 'public.saved_experiences'")) {
        return res.json({ success: true, fallback: true });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json({ saved: data });
  } catch (err) {
    console.error('Saved upsert error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profile/saved/:experience_id
router.delete('/saved/:experience_id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('saved_experiences')
      .delete()
      .eq('user_id', req.userId)
      .eq('experience_id', req.params.experience_id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('Saved delete error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/avatar
router.post('/avatar', async (req, res) => {
  try {
    const { base64, filename } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ error: 'base64 and filename required' });

    const bucket = 'avatars';
    const path = `${req.userId}/${filename}`;

    const base64Data = String(base64).includes(',') ? String(base64).split(',')[1] : String(base64);
    const bytes = Buffer.from(base64Data, 'base64');

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { upsert: true, contentType: 'image/png' });
    if (upErr) {
      if (String(upErr.message || '').toLowerCase().includes('bucket not found')) {
        return res.status(400).json({ error: "Bucket 'avatars' not found. Create it in Supabase Storage first." });
      }
      return res.status(400).json({ error: upErr.message });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const avatar_url = pub?.publicUrl || null;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', req.userId)
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    return res.json({ avatar_url: updated.avatar_url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
