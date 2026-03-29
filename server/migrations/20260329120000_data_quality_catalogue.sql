-- Data quality: canonical city helper + diagnostic views
-- Idempotent. Requires: experiences, activities, accommodations, restaurants,
-- packages, providers, group_trips (see schema.sql, schema_verticals.sql, etc.)

CREATE OR REPLACE FUNCTION mw_canonical_city(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(coalesce(p, '')))
    WHEN '' THEN NULL
    WHEN 'fez' THEN 'Fès'
    WHEN 'fes' THEN 'Fès'
    WHEN 'fès' THEN 'Fès'
    WHEN 'fès el-bali' THEN 'Fès'
    WHEN 'fes el-bali' THEN 'Fès'
    WHEN 'fez el-bali' THEN 'Fès'
    WHEN 'marrakech' THEN 'Marrakech'
    WHEN 'marrakesh' THEN 'Marrakech'
    WHEN 'marraquech' THEN 'Marrakech'
    WHEN 'casablanca' THEN 'Casablanca'
    WHEN 'casa' THEN 'Casablanca'
    WHEN 'rabat' THEN 'Rabat'
    WHEN 'tangier' THEN 'Tangier'
    WHEN 'tanger' THEN 'Tangier'
    WHEN 'chefchaouen' THEN 'Chefchaouen'
    WHEN 'chaouen' THEN 'Chefchaouen'
    WHEN 'essaouira' THEN 'Essaouira'
    WHEN 'essouira' THEN 'Essaouira'
    WHEN 'mogador' THEN 'Essaouira'
    WHEN 'merzouga' THEN 'Merzouga'
    WHEN 'agadir' THEN 'Agadir'
    WHEN 'ouarzazate' THEN 'Ouarzazate'
    WHEN 'ouarzazat' THEN 'Ouarzazate'
    WHEN 'imlil' THEN 'Imlil'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE VIEW v_catalogue_data_quality AS
SELECT *
FROM (
  SELECT
    'experiences'::TEXT AS entity,
    e.id,
    e.title,
    NULL::TEXT AS name,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN e.description IS NULL OR btrim(e.description) = '' THEN 'missing_description' END,
      CASE WHEN e.image_url IS NULL OR btrim(e.image_url) = '' THEN 'missing_image' END,
      CASE WHEN e.is_active IS NULL THEN 'null_is_active' END,
      CASE WHEN e.is_active = FALSE THEN 'inactive' END
    ], NULL) AS issues
  FROM experiences e

  UNION ALL
  SELECT
    'activities',
    a.id,
    a.title,
    NULL,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN a.description IS NULL OR btrim(a.description) = '' THEN 'missing_description' END,
      CASE WHEN a.image_urls IS NULL OR cardinality(a.image_urls) = 0 THEN 'missing_image' END,
      CASE WHEN a.price IS NULL AND COALESCE(a.price_type, 'per_person') NOT IN ('free', 'on_request')
        THEN 'missing_price' END,
      CASE WHEN a.is_active IS NULL THEN 'null_is_active' END,
      CASE WHEN a.is_active = FALSE THEN 'inactive' END,
      CASE WHEN a.city IS NULL OR btrim(a.city) = '' THEN 'missing_city' END
    ], NULL)
  FROM activities a

  UNION ALL
  SELECT
    'accommodations',
    x.id,
    x.name,
    x.name,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN x.description IS NULL OR btrim(x.description) = '' THEN 'missing_description' END,
      CASE WHEN x.image_urls IS NULL OR cardinality(x.image_urls) = 0 THEN 'missing_image' END,
      CASE WHEN x.price_from IS NULL THEN 'missing_price_from' END,
      CASE WHEN x.is_active IS NULL THEN 'null_is_active' END,
      CASE WHEN x.is_active = FALSE THEN 'inactive' END,
      CASE WHEN x.city IS NULL OR btrim(x.city) = '' THEN 'missing_city' END
    ], NULL)
  FROM accommodations x

  UNION ALL
  SELECT
    'restaurants',
    r.id,
    r.name,
    r.name,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN r.description IS NULL OR btrim(r.description) = '' THEN 'missing_description' END,
      CASE WHEN r.image_urls IS NULL OR cardinality(r.image_urls) = 0 THEN 'missing_image' END,
      CASE WHEN r.is_active IS NULL THEN 'null_is_active' END,
      CASE WHEN r.is_active = FALSE THEN 'inactive' END,
      CASE WHEN r.city IS NULL OR btrim(r.city) = '' THEN 'missing_city' END,
      CASE WHEN r.price_range IS NULL THEN 'missing_price_range' END
    ], NULL)
  FROM restaurants r

  UNION ALL
  SELECT
    'packages',
    p.id,
    p.title,
    NULL,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN p.description IS NULL OR btrim(p.description) = '' THEN 'missing_description' END,
      CASE WHEN p.image_urls IS NULL OR cardinality(p.image_urls) = 0 THEN 'missing_image' END,
      CASE WHEN p.cities IS NULL OR cardinality(p.cities) = 0 THEN 'missing_cities' END,
      CASE WHEN p.is_active IS NULL THEN 'null_is_active' END,
      CASE WHEN p.is_active = FALSE THEN 'inactive' END
    ], NULL)
  FROM packages p

  UNION ALL
  SELECT
    'providers',
    pr.id,
    pr.name,
    pr.name,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN pr.description IS NULL OR btrim(pr.description) = '' THEN 'missing_description' END,
      CASE WHEN (pr.logo_url IS NULL OR btrim(pr.logo_url) = '')
            AND (pr.cover_url IS NULL OR btrim(pr.cover_url) = '')
            AND (pr.images IS NULL OR cardinality(pr.images) = 0)
        THEN 'missing_image' END,
      CASE WHEN pr.status IS DISTINCT FROM 'active' THEN 'not_active_status' END
    ], NULL)
  FROM providers pr

  UNION ALL
  SELECT
    'group_trips',
    g.id,
    g.title,
    NULL,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN g.description IS NULL OR btrim(g.description) = '' THEN 'missing_description' END,
      CASE WHEN g.image_urls IS NULL OR cardinality(g.image_urls) = 0 THEN 'missing_image' END,
      CASE WHEN g.status NOT IN ('open', 'full') THEN 'not_listed_status' END
    ], NULL)
  FROM group_trips g
) s
WHERE cardinality(s.issues) > 0;

CREATE OR REPLACE VIEW v_catalogue_data_quality_summary AS
SELECT
  v.entity,
  iss.issue,
  COUNT(*)::BIGINT AS affected_rows
FROM v_catalogue_data_quality v
CROSS JOIN LATERAL unnest(v.issues) AS iss(issue)
GROUP BY v.entity, iss.issue
ORDER BY v.entity, affected_rows DESC;

CREATE OR REPLACE VIEW v_city_spelling_candidates AS
SELECT 'experiences.location'::TEXT AS field, e.id::TEXT AS row_id, e.title AS label, e.location AS raw_value
FROM experiences e
WHERE e.location IS NOT NULL AND btrim(e.location) <> ''
  AND mw_canonical_city(e.location) IS NULL
  AND lower(e.location) ~ '(fez|fes|marrak|tanger|essaou|chaouen|merzoug|casa)'

UNION ALL
SELECT 'activities.city'::TEXT, a.id::TEXT, a.title, a.city
FROM activities a
WHERE a.city IS NOT NULL AND btrim(a.city) <> ''
  AND mw_canonical_city(a.city) IS NULL
  AND lower(a.city) ~ '(fez|fes|marrak|tanger|essaou|chaouen|merzoug|casa)'

UNION ALL
SELECT 'accommodations.city', x.id::TEXT, x.name, x.city
FROM accommodations x
WHERE x.city IS NOT NULL AND btrim(x.city) <> ''
  AND mw_canonical_city(x.city) IS NULL
  AND lower(x.city) ~ '(fez|fes|marrak|tanger|essaou|chaouen|merzoug|casa)'

UNION ALL
SELECT 'restaurants.city', r.id::TEXT, r.name, r.city
FROM restaurants r
WHERE r.city IS NOT NULL AND btrim(r.city) <> ''
  AND mw_canonical_city(r.city) IS NULL
  AND lower(r.city) ~ '(fez|fes|marrak|tanger|essaou|chaouen|merzoug|casa)'

UNION ALL
SELECT 'providers.city', p.id::TEXT, p.name, p.city
FROM providers p
WHERE p.city IS NOT NULL AND btrim(p.city) <> ''
  AND mw_canonical_city(p.city) IS NULL
  AND lower(p.city) ~ '(fez|fes|marrak|tanger|essaou|chaouen|merzoug|casa)'

UNION ALL
SELECT 'group_trips.destination', g.id::TEXT, g.title, g.destination
FROM group_trips g
WHERE g.destination IS NOT NULL AND btrim(g.destination) <> ''
  AND mw_canonical_city(g.destination) IS NULL
  AND lower(g.destination) ~ '(fez|fes|marrak|tanger|essaou|chaouen|merzoug|casa)';
