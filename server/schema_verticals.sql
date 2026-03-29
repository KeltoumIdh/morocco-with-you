-- NOTE:
-- Paste/run this in Supabase SQL Editor exactly as requested.
-- (This file exists so the SQL is preserved in-repo.)

-- ══ ACTIVITIES ══════════════════════════════════
CREATE TABLE IF NOT EXISTS activities (
id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
title         TEXT NOT NULL,
location      TEXT NOT NULL,
city          TEXT,
description   TEXT,
price         NUMERIC(10,2),
price_type    TEXT DEFAULT 'per_person'
CHECK (price_type IN ('per_person','per_group','free','on_request')),
duration      TEXT,
max_group     INT DEFAULT 20,
min_age       INT DEFAULT 0,
tags          TEXT[] DEFAULT '{}',
category      TEXT CHECK (category IN (
'Adventure','Cultural','Sport','Relaxation',
'Food','Nature','Family','Photography')),
gradient      TEXT,
image_urls    TEXT[] DEFAULT '{}',
rating        NUMERIC(3,2) DEFAULT 0,
review_count  INT DEFAULT 0,
included      TEXT[] DEFAULT '{}',
not_included  TEXT[] DEFAULT '{}',
meeting_point TEXT,
languages     TEXT[] DEFAULT '{English,French,Arabic}',
is_active     BOOLEAN DEFAULT TRUE,
featured      BOOLEAN DEFAULT FALSE,
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ ACCOMMODATIONS (HÉBERGEMENT) ════════════════
CREATE TABLE IF NOT EXISTS accommodations (
id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name           TEXT NOT NULL,
type           TEXT CHECK (type IN (
'Riad','Hotel','Guesthouse','Villa',
'Auberge','Camping','Apartment','Dar')),
location       TEXT NOT NULL,
city           TEXT,
description    TEXT,
price_from     NUMERIC(10,2),
price_to       NUMERIC(10,2),
stars          INT CHECK (stars BETWEEN 1 AND 5),
tags           TEXT[] DEFAULT '{}',
amenities      TEXT[] DEFAULT '{}',
gradient       TEXT,
image_urls     TEXT[] DEFAULT '{}',
rating         NUMERIC(3,2) DEFAULT 0,
review_count   INT DEFAULT 0,
address        TEXT,
phone          TEXT,
website        TEXT,
booking_url    TEXT,
total_rooms    INT,
languages      TEXT[] DEFAULT '{English,French,Arabic}',
is_active      BOOLEAN DEFAULT TRUE,
featured       BOOLEAN DEFAULT FALSE,
created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ RESTAURANTS ══════════════════════════════════
CREATE TABLE IF NOT EXISTS restaurants (
id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name          TEXT NOT NULL,
cuisine       TEXT,
location      TEXT NOT NULL,
city          TEXT,
description   TEXT,
price_range   TEXT CHECK (price_range IN ('€','€€','€€€','€€€€')),
tags          TEXT[] DEFAULT '{}',
gradient      TEXT,
image_urls    TEXT[] DEFAULT '{}',
rating        NUMERIC(3,2) DEFAULT 0,
review_count  INT DEFAULT 0,
address       TEXT,
phone         TEXT,
website       TEXT,
opening_hours JSONB DEFAULT '{}',
has_terrace   BOOLEAN DEFAULT FALSE,
has_wifi      BOOLEAN DEFAULT FALSE,
reservations  BOOLEAN DEFAULT FALSE,
is_active     BOOLEAN DEFAULT TRUE,
featured      BOOLEAN DEFAULT FALSE,
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ TRAVEL PLANNING PACKAGES ════════════════════
CREATE TABLE IF NOT EXISTS packages (
id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
title           TEXT NOT NULL,
subtitle        TEXT,
description     TEXT,
duration_days   INT NOT NULL,
cities          TEXT[] DEFAULT '{}',
price_from      NUMERIC(10,2) NOT NULL,
price_per       TEXT DEFAULT 'per_person',
max_group       INT DEFAULT 16,
difficulty      TEXT DEFAULT 'easy'
CHECK (difficulty IN ('easy','moderate','challenging')),
tags            TEXT[] DEFAULT '{}',
highlights      TEXT[] DEFAULT '{}',
included        TEXT[] DEFAULT '{}',
not_included    TEXT[] DEFAULT '{}',
itinerary       JSONB DEFAULT '[]',
gradient        TEXT,
image_urls      TEXT[] DEFAULT '{}',
rating          NUMERIC(3,2) DEFAULT 0,
review_count    INT DEFAULT 0,
is_active       BOOLEAN DEFAULT TRUE,
featured        BOOLEAN DEFAULT FALSE,
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ PLANNING REQUESTS ═══════════════════════════
CREATE TABLE IF NOT EXISTS planning_requests (
id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id         UUID REFERENCES profiles(id),
package_id      UUID REFERENCES packages(id),
full_name       TEXT NOT NULL,
email           TEXT NOT NULL,
phone           TEXT,
travel_dates    DATERANGE,
start_date      DATE,
end_date        DATE,
duration_days   INT,
group_size      INT DEFAULT 1,
group_type      TEXT CHECK (group_type IN (
'Solo','Couple','Family','Friends',
'Group','Corporate')),
cities          TEXT[] DEFAULT '{}',
budget_range    TEXT,
budget_per      TEXT DEFAULT 'per_person',
interests       TEXT[] DEFAULT '{}',
accommodation_type TEXT,
special_requests TEXT,
status          TEXT DEFAULT 'new'
CHECK (status IN (
'new','contacted','in_progress',
'quoted','confirmed','cancelled')),
admin_notes     TEXT,
quoted_price    NUMERIC(10,2),
source          TEXT DEFAULT 'website',
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ ACTIVITY BOOKINGS ═══════════════════════════
CREATE TABLE IF NOT EXISTS activity_bookings (
id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id       UUID REFERENCES profiles(id),
activity_id   UUID REFERENCES activities(id),
travel_date   DATE NOT NULL,
guests        INT NOT NULL DEFAULT 1,
total_amount  NUMERIC(10,2) NOT NULL,
status        TEXT DEFAULT 'pending'
CHECK (status IN ('pending','confirmed','cancelled','completed')),
special_requests TEXT,
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ PACKAGE BOOKINGS ════════════════════════════
CREATE TABLE IF NOT EXISTS package_bookings (
id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id       UUID REFERENCES profiles(id),
package_id    UUID REFERENCES packages(id),
start_date    DATE NOT NULL,
guests        INT NOT NULL DEFAULT 1,
total_amount  NUMERIC(10,2) NOT NULL,
status        TEXT DEFAULT 'pending'
CHECK (status IN ('pending','confirmed','cancelled','completed')),
special_requests TEXT,
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══ SAVED (WISHLIST) FOR ALL TYPES ══════════════
ALTER TABLE saved_experiences
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'experience'
CHECK (item_type IN ('experience','activity','accommodation','restaurant','package'));

ALTER TABLE saved_experiences
ADD COLUMN IF NOT EXISTS activity_id      UUID REFERENCES activities(id),
ADD COLUMN IF NOT EXISTS accommodation_id UUID REFERENCES accommodations(id),
ADD COLUMN IF NOT EXISTS restaurant_id    UUID REFERENCES restaurants(id),
ADD COLUMN IF NOT EXISTS package_id       UUID REFERENCES packages(id);

-- ══ REVIEWS FOR ALL TYPES ═══════════════════════
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'experience'
CHECK (item_type IN ('experience','activity','accommodation','restaurant','package'));

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS activity_id      UUID REFERENCES activities(id),
ADD COLUMN IF NOT EXISTS accommodation_id UUID REFERENCES accommodations(id),
ADD COLUMN IF NOT EXISTS restaurant_id    UUID REFERENCES restaurants(id),
ADD COLUMN IF NOT EXISTS package_id       UUID REFERENCES packages(id);

-- ══ RLS POLICIES ════════════════════════════════
ALTER TABLE activities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_bookings   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activities public"      ON activities     FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Accommodations public"  ON accommodations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Restaurants public"     ON restaurants    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Packages public"        ON packages       FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Planning own"     ON planning_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Act bookings own" ON activity_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Pkg bookings own" ON package_bookings  FOR ALL USING (auth.uid() = user_id);

-- ══ REALTIME ════════════════════════════════════
-- Enable in Supabase Dashboard → Database → Replication:
-- Tables: activities, accommodations, restaurants, packages,
--         planning_requests, activity_bookings, package_bookings

