import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

/** Keep profiles.email aligned with auth so SQL like WHERE email = ... works. */
async function syncProfileEmail(userId, email) {
  if (!email || !userId) return;
  await supabase.from('profiles').update({ email }).eq('id', userId);
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, full_name' 
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // skip email confirmation in dev
      user_metadata: { full_name }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 2. Insert profile row (use upsert to avoid race conditions)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile insert error:', profileError);
      // Don't fail registration if profile insert fails — log and continue
    }

    // 3. Sign in to return a session token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) {
      return res.status(400).json({ error: sessionError.message });
    }

    return res.status(201).json({
      user: authData.user,
      session: sessionData.session,
      profile: { id: authData.user.id, full_name, email }
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) return res.status(401).json({ error: error.message });

    await syncProfileEmail(data.user.id, data.user.email);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return res.json({
      user: data.user,
      session: data.session,
      profile: profile || { id: data.user.id, email: data.user.email },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) await supabase.auth.admin.signOut(token);
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: true }); // Always succeed on logout
  }
});

// GET CURRENT USER
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    await syncProfileEmail(user.id, user.email);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return res.json({ user, profile: profile || { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: error.message });

    return res.json({ session: data.session });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
