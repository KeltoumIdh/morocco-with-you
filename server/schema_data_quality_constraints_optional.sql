-- ═══════════════════════════════════════════════════════════════════════════
-- Optional CHECK constraints — run ONE statement at a time AFTER backfill.
-- If ALTER fails, fix rows (see v_catalogue_data_quality) and retry.
-- ═══════════════════════════════════════════════════════════════════════════

-- ALTER TABLE experiences
--   ADD CONSTRAINT experiences_listed_has_description
--   CHECK (is_active = FALSE OR (description IS NOT NULL AND length(trim(description)) >= 20));

-- ALTER TABLE experiences
--   ADD CONSTRAINT experiences_listed_has_image
--   CHECK (is_active = FALSE OR (image_url IS NOT NULL AND length(trim(image_url)) > 0));

-- ALTER TABLE activities
--   ADD CONSTRAINT activities_price_when_applicable
--   CHECK (
--     price_type IN ('free', 'on_request')
--     OR price IS NOT NULL
--   );

-- ALTER TABLE activities
--   ADD CONSTRAINT activities_active_has_city
--   CHECK (is_active = FALSE OR (city IS NOT NULL AND length(trim(city)) > 0));

-- ALTER TABLE accommodations
--   ADD CONSTRAINT accommodations_active_has_city
--   CHECK (is_active = FALSE OR (city IS NOT NULL AND length(trim(city)) > 0));

-- ALTER TABLE restaurants
--   ADD CONSTRAINT restaurants_active_has_city
--   CHECK (is_active = FALSE OR (city IS NOT NULL AND length(trim(city)) > 0));

-- ALTER TABLE restaurants
--   ADD CONSTRAINT restaurants_active_has_price_range
--   CHECK (is_active = FALSE OR price_range IS NOT NULL);

-- ALTER TABLE packages
--   ADD CONSTRAINT packages_active_has_cities
--   CHECK (is_active = FALSE OR (cities IS NOT NULL AND cardinality(cities) > 0));

-- ALTER TABLE group_trips
--   ADD CONSTRAINT group_trips_open_has_image
--   CHECK (status <> 'open' OR (image_urls IS NOT NULL AND cardinality(image_urls) > 0));

-- NOT NULL (only when zero violating rows):
-- ALTER TABLE activities ALTER COLUMN description SET NOT NULL;
