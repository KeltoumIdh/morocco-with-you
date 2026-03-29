import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. " +
    "Auth features will not work. Copy .env.example to .env and fill in your values."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder", {
  auth: { persistSession: true, autoRefreshToken: true },
});
