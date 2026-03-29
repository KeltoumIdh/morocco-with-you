-- Group Trips + Enrollments — run in Supabase SQL editor

-- ══ GROUP TRIPS ══════════════════════════════
CREATE TABLE IF NOT EXISTS group_trips (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT NOT NULL,
  subtitle         TEXT,
  destination      TEXT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  max_capacity     INT NOT NULL DEFAULT 16,
  price_per_person NUMERIC(10,2) NOT NULL,
  program          JSONB DEFAULT '[]',
  description      TEXT,
  includes         TEXT[] DEFAULT '{}',
  excludes         TEXT[] DEFAULT '{}',
  difficulty       TEXT DEFAULT 'easy',
  gradient         TEXT,
  image_urls       TEXT[] DEFAULT '{}',
  tags             TEXT[] DEFAULT '{}',
  guide_name       TEXT,
  guide_bio        TEXT,
  status           TEXT DEFAULT 'open'
                   CHECK (status IN ('draft','open','full','cancelled','completed')),
  featured         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ GROUP TRIP ENROLLMENTS ═══════════════════
CREATE TABLE IF NOT EXISTS group_trip_enrollments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_trip_id UUID REFERENCES group_trips(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id),
  booking_id    UUID REFERENCES bookings(id),
  guests        INT DEFAULT 1,
  status        TEXT DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','cancelled','waitlist')),
  enrolled_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Computed view: availability
CREATE OR REPLACE VIEW group_trips_with_availability AS
SELECT
  gt.*,
  COALESCE(
    SUM(CASE WHEN gte.status IN ('pending','confirmed')
        THEN gte.guests ELSE 0 END), 0
  ) AS enrolled_count,
  gt.max_capacity - COALESCE(
    SUM(CASE WHEN gte.status IN ('pending','confirmed')
        THEN gte.guests ELSE 0 END), 0
  ) AS spots_available
FROM group_trips gt
LEFT JOIN group_trip_enrollments gte ON gt.id = gte.group_trip_id
GROUP BY gt.id;

-- RLS
ALTER TABLE group_trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_trip_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group trips public" ON group_trips;
CREATE POLICY "Group trips public"
  ON group_trips FOR SELECT
  USING (status IN ('open','full'));

DROP POLICY IF EXISTS "Enrollments own" ON group_trip_enrollments;
CREATE POLICY "Enrollments own"
  ON group_trip_enrollments FOR ALL
  USING (auth.uid() = user_id);

