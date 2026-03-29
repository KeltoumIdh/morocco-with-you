-- ═══════════════════════════════════════════════════════════════════════════
-- APPLY city normalization (DML) — run ONLY after:
--   1) migrations/20260329120000_data_quality_catalogue.sql (or schema_data_quality_catalogue.sql B–D)
--   2) SELECT * FROM v_city_spelling_candidates; — review and extend mw_canonical_city if needed
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE activities
SET city = mw_canonical_city(city), updated_at = NOW()
WHERE city IS NOT NULL AND mw_canonical_city(city) IS NOT NULL;

UPDATE accommodations
SET city = mw_canonical_city(city), updated_at = NOW()
WHERE city IS NOT NULL AND mw_canonical_city(city) IS NOT NULL;

UPDATE restaurants
SET city = mw_canonical_city(city), updated_at = NOW()
WHERE city IS NOT NULL AND mw_canonical_city(city) IS NOT NULL;

UPDATE providers
SET city = mw_canonical_city(city), updated_at = NOW()
WHERE city IS NOT NULL AND mw_canonical_city(city) IS NOT NULL;

-- Whole-field location / destination when value is a short known alias only
UPDATE activities
SET
  location = mw_canonical_city(location),
  city = COALESCE(city, mw_canonical_city(location)),
  updated_at = NOW()
WHERE mw_canonical_city(location) IS NOT NULL AND length(trim(location)) < 48;

UPDATE accommodations
SET
  location = mw_canonical_city(location),
  city = COALESCE(city, mw_canonical_city(location)),
  updated_at = NOW()
WHERE mw_canonical_city(location) IS NOT NULL AND length(trim(location)) < 48;

UPDATE experiences
SET location = mw_canonical_city(location), updated_at = NOW()
WHERE mw_canonical_city(location) IS NOT NULL AND length(trim(location)) < 48;

UPDATE group_trips
SET destination = mw_canonical_city(destination), updated_at = NOW()
WHERE mw_canonical_city(destination) IS NOT NULL AND length(trim(destination)) < 48;

UPDATE packages p
SET cities = (
    SELECT COALESCE(array_agg(COALESCE(mw_canonical_city(t.c), t.c) ORDER BY ord), '{}')
    FROM unnest(p.cities) WITH ORDINALITY AS t(c, ord)
  ),
  updated_at = NOW()
WHERE p.cities IS NOT NULL AND cardinality(p.cities) > 0;

COMMIT;
