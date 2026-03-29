-- Providers (Prestataires) + Stripe columns — run in Supabase SQL Editor
-- Idempotent helpers

-- ══ PROVIDERS (Prestataires) ══════════════════
CREATE TABLE IF NOT EXISTS providers (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name              TEXT NOT NULL,
  type              TEXT CHECK (type IN (
                      'ACTIVITY','ACCOMMODATION','RESTAURANT',
                      'EXPERIENCE','TRANSPORT','GUIDE')),
  city              TEXT NOT NULL,
  description       TEXT,
  address           TEXT,
  phone             TEXT,
  email             TEXT,
  website           TEXT,
  logo_url          TEXT,
  cover_url         TEXT,
  images            TEXT[] DEFAULT '{}',
  languages         TEXT[] DEFAULT '{English,French,Arabic}',
  commission_rate   NUMERIC(5,2) DEFAULT 10.00,
  bank_iban         TEXT,
  bank_name         TEXT,
  status            TEXT DEFAULT 'active'
                    CHECK (status IN ('active','inactive','suspended')),
  verified          BOOLEAN DEFAULT FALSE,
  rating            NUMERIC(3,2) DEFAULT 0,
  review_count      INT DEFAULT 0,
  tags              TEXT[] DEFAULT '{}',
  search_vector     TSVECTOR,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ PROVIDER SERVICES ═══════════════════════
CREATE TABLE IF NOT EXISTS provider_services (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id     UUID REFERENCES providers(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  price           NUMERIC(10,2) NOT NULL,
  price_type      TEXT DEFAULT 'per_person'
                  CHECK (price_type IN (
                    'per_person','per_group','per_night',
                    'per_day','free','on_request')),
  duration        TEXT,
  max_capacity    INT DEFAULT 20,
  min_age         INT DEFAULT 0,
  images          TEXT[] DEFAULT '{}',
  is_available    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ ENHANCE BOOKINGS FOR STRIPE ═════════════
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS provider_id         UUID REFERENCES providers(id),
  ADD COLUMN IF NOT EXISTS service_id          UUID REFERENCES provider_services(id),
  ADD COLUMN IF NOT EXISTS activity_id         UUID,
  ADD COLUMN IF NOT EXISTS package_id          UUID,
  ADD COLUMN IF NOT EXISTS booking_type        TEXT DEFAULT 'experience'
    CHECK (booking_type IN (
      'experience','activity','accommodation',
      'restaurant','package','group_trip')),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id         TEXT,
  ADD COLUMN IF NOT EXISTS payment_status            TEXT DEFAULT 'pending'
    CHECK (payment_status IN (
      'pending','processing','paid','failed','refunded')),
  ADD COLUMN IF NOT EXISTS commission_rate           NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS commission_total          NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_status         TEXT DEFAULT 'pending'
    CHECK (commission_status IN (
      'pending','due','paid','cancelled')),
  ADD COLUMN IF NOT EXISTS subtotal                  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee              NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS confirmed_at              TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at              TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancellation_reason       TEXT;

-- Optional: add FKs to activities(id) / packages(id) after those tables exist.

-- ══ STRIPE EVENTS LOG ═══════════════════════
CREATE TABLE IF NOT EXISTS stripe_events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  type          TEXT NOT NULL,
  payload       JSONB,
  processed     BOOLEAN DEFAULT FALSE,
  error         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ FULL TEXT SEARCH on providers ═══════════
CREATE INDEX IF NOT EXISTS providers_search_idx
  ON providers USING gin(search_vector);

CREATE OR REPLACE FUNCTION update_provider_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.city,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags,', '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS providers_search_trigger ON providers;
CREATE TRIGGER providers_search_trigger
  BEFORE INSERT OR UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_provider_search();

-- ══ RLS ═════════════════════════════════════
ALTER TABLE providers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers public read" ON providers;
CREATE POLICY "Providers public read"
  ON providers FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Services public read" ON provider_services;
CREATE POLICY "Services public read"
  ON provider_services FOR SELECT USING (is_available = TRUE);

DROP POLICY IF EXISTS "Stripe events admin only" ON stripe_events;
CREATE POLICY "Stripe events admin only"
  ON stripe_events FOR ALL USING (FALSE);
