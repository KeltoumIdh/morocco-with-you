import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!process.env.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY is required');
if (process.env.SUPABASE_URL.includes('your-project-ref.supabase.co')) {
  throw new Error('SUPABASE_URL is still placeholder. Set real project URL in server/.env');
}
if (process.env.SUPABASE_SERVICE_KEY.includes('your_service_role_key_here')) {
  throw new Error('SUPABASE_SERVICE_KEY is still placeholder. Set service_role key in server/.env');
}

// Admin client — full access, server-side only
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

// Anon client — respects RLS, for token verification
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
