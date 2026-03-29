-- ═══════════════════════════════════════════════════════════════
-- Morocco With You — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Profiles (extends auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  location    TEXT,
  language    TEXT DEFAULT 'en',
  currency    TEXT DEFAULT 'EUR',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. Experiences ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiences (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  location     TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  route        TEXT,
  price        NUMERIC(10,2) NOT NULL,
  duration     TEXT,
  max_group    INT DEFAULT 8,
  tags         TEXT[],
  gradient     TEXT,
  rating       NUMERIC(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  featured     BOOLEAN DEFAULT FALSE,
  updated_at   TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. Bookings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id    UUID REFERENCES experiences(id) ON DELETE SET NULL,
  travel_date      DATE NOT NULL,
  guests           INT NOT NULL DEFAULT 1,
  total_amount     NUMERIC(10,2) NOT NULL,
  status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled','completed')),
  special_requests TEXT,
  commission_status TEXT DEFAULT 'pending',
  updated_at       TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 4. Saved / Wishlist ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_experiences (
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  saved_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, experience_id)
);

-- ── 5. AI Itineraries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT,
  duration    TEXT,
  group_type  TEXT,
  budget      TEXT,
  interests   TEXT[],
  content     JSONB,          -- full day-by-day plan
  total_price NUMERIC(10,2),
  is_saved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 6. Chat Messages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role       TEXT CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS retrieved_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tokens_used     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model_used      TEXT,
  ADD COLUMN IF NOT EXISTS latency_ms      INT;

-- ── 7. Reviews ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating        INT CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent re-runs)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
  DROP POLICY IF EXISTS "Users can view own bookings"  ON bookings;
  DROP POLICY IF EXISTS "Users can manage saved"       ON saved_experiences;
  DROP POLICY IF EXISTS "Users can manage itineraries" ON itineraries;
  DROP POLICY IF EXISTS "Users can view own chat"      ON chat_messages;
  DROP POLICY IF EXISTS "Experiences are public"       ON experiences;
  DROP POLICY IF EXISTS "Reviews are public"           ON reviews;
  DROP POLICY IF EXISTS "Users can write own reviews"  ON reviews;
END $$;

CREATE POLICY "Users can view own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own bookings"
  ON bookings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage saved"
  ON saved_experiences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage itineraries"
  ON itineraries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat"
  ON chat_messages FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Experiences are public"
  ON experiences FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Reviews are public"
  ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "Users can write own reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: auto-create profile on new auth.users signup
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: update rating + review_count on reviews insert
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_experience_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE experiences
  SET
    rating       = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE experience_id = NEW.experience_id),
    review_count = (SELECT COUNT(*)                        FROM reviews WHERE experience_id = NEW.experience_id)
  WHERE id = NEW.experience_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_experience_rating();

-- ═══════════════════════════════════════════════════════════════
-- SEED: initial experiences data
-- ═══════════════════════════════════════════════════════════════

INSERT INTO experiences (title, location, description, price, duration, max_group, tags, gradient, rating, review_count)
VALUES
  ('Sahara Desert Overnight',
   'Merzouga, Errachidia',
   'Ride camels into the golden dunes at sunset, sleep under a blanket of stars in a luxury Berber camp, and wake to a breathtaking Sahara sunrise.',
   149.00, '2 days', 8,
   ARRAY['Adventure','Desert'],
   'linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)',
   4.9, 218),

  ('Fès Medina Food Trail',
   'Fès el-Bali',
   'Navigate the world''s largest car-free urban area with a local guide, tasting pastilla, harira, and msemen fresh from century-old stalls.',
   65.00, '4 hours', 6,
   ARRAY['Food','Culture'],
   'linear-gradient(145deg,#C0654A 0%,#8B3A2A 55%,#1A1410 100%)',
   4.8, 312),

  ('Atlas Mountain Trek',
   'Imlil, Marrakech',
   'Hike through Berber villages and cedar forests with views of Jebel Toubkal, North Africa''s highest peak.',
   89.00, 'Full day', 10,
   ARRAY['Hiking','Nature'],
   'linear-gradient(145deg,#7A8C6E 0%,#4A5C3E 50%,#2C3828 100%)',
   4.7, 156),

  ('Riad Cooking Class',
   'Marrakech Medina',
   'Learn to make tagine, couscous, and bastilla in a 16th-century riad kitchen with a Moroccan chef.',
   75.00, '3 hours', 4,
   ARRAY['Food','Luxury'],
   'linear-gradient(145deg,#D4A853 0%,#C0654A 55%,#1A1410 100%)',
   5.0, 89),

  ('Blue Chefchaouen Walk',
   'Chefchaouen',
   'Wander the iconic blue-washed alleys of the Rif Mountains'' most photogenic city with a local storyteller.',
   55.00, 'Half day', 8,
   ARRAY['Culture','Photo'],
   'linear-gradient(145deg,#6B8CAE 0%,#3D5A73 50%,#1A2C38 100%)',
   4.8, 201),

  ('Essaouira Surf & Wind',
   'Essaouira',
   'Hit the Atlantic waves with a certified instructor on Morocco''s windiest coast, then explore the UNESCO-listed medina.',
   110.00, 'Full day', 6,
   ARRAY['Surf','Adventure'],
   'linear-gradient(145deg,#8B9E8A 0%,#5C7A6E 50%,#2A3C35 100%)',
   4.6, 134)

ON CONFLICT DO NOTHING;

-- ── Group booking columns ──────────────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_group   BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_name TEXT;

-- ── Event requests table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id),
  event_type      TEXT,
  group_size      INT,
  preferred_dates TEXT,
  budget_range    TEXT,
  requirements    TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  status          TEXT DEFAULT 'new',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Admin / profile extensions ─────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ═══════════════════════════════════════════════════════════════
-- Admin / Backoffice tables (Posts, AI logs) + missing columns
-- ═══════════════════════════════════════════════════════════════

-- Posts / Blog
CREATE TABLE IF NOT EXISTS posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id   UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  excerpt     TEXT,
  content     TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  image_url   TEXT,
  views       INT DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Logs
CREATE TABLE IF NOT EXISTS ai_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id),
  prompt      TEXT,
  tokens_used INT,
  output_ref  TEXT,
  status      TEXT DEFAULT 'success',
  model       TEXT DEFAULT 'claude-sonnet',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist if tables were created earlier
ALTER TABLE bookings     ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending';
ALTER TABLE bookings     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE experiences  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE experiences  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE experiences  ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE experiences  ADD COLUMN IF NOT EXISTS route TEXT;

-- AI observability (admin metrics / AI Monitoring)
ALTER TABLE ai_logs
  ADD COLUMN IF NOT EXISTS feature TEXT DEFAULT 'chat',
  ADD COLUMN IF NOT EXISTS latency_ms INT,
  ADD COLUMN IF NOT EXISTS error_msg TEXT,
  ADD COLUMN IF NOT EXISTS retrieval_mode TEXT,
  ADD COLUMN IF NOT EXISTS items_retrieved INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(12, 8);

-- RLS
ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Posts public read" ON posts;
  DROP POLICY IF EXISTS "AI logs own"       ON ai_logs;
END $$;

CREATE POLICY "Posts public read"  ON posts    FOR SELECT USING (status = 'published');
CREATE POLICY "AI logs own"        ON ai_logs  FOR SELECT USING (auth.uid() = user_id);

-- ── Storage bucket + policies for avatars (run in Supabase) ───
-- NOTE: requires storage extension / permissions in your Supabase project.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- AI metrics view + RPC (optional dashboards; safe to re-run)
CREATE OR REPLACE VIEW ai_metrics AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  feature,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  ROUND(AVG(latency_ms))::INT AS avg_latency_ms,
  SUM(COALESCE(tokens_used, 0)) AS total_tokens,
  ROUND(
    SUM(COALESCE(cost_usd, COALESCE(tokens_used, 0) * 0.00000015))::numeric,
    6
  ) AS estimated_cost_usd
FROM ai_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

CREATE OR REPLACE FUNCTION get_ai_metrics_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'total_calls', COUNT(*)::bigint,
      'successes', COUNT(*) FILTER (WHERE status = 'success')::bigint,
      'errors', COUNT(*) FILTER (WHERE status = 'error')::bigint,
      'avg_latency_ms', ROUND(AVG(latency_ms))::numeric,
      'total_tokens', COALESCE(SUM(tokens_used), 0)::bigint,
      'estimated_cost_usd', ROUND(
        SUM(COALESCE(cost_usd, COALESCE(tokens_used, 0) * 0.00000015))::numeric,
        6
      )
    ),
    '{}'::jsonb
  )
  FROM ai_logs
  WHERE created_at > NOW() - INTERVAL '30 days';
$$;
