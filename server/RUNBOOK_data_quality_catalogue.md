# Catalogue data quality — runbook

## Files

| File | Purpose |
|------|---------|
| `migrations/20260329120000_data_quality_catalogue.sql` | Versioned deploy: function + all diagnostic views (Supabase CLI or paste) |
| `schema_data_quality_catalogue.sql` | Same logic + mapping notes (single paste into SQL Editor) |
| `schema_data_quality_normalize_apply.sql` | Transactional `UPDATE`s for city / location / destination / `packages.cities` |
| `schema_data_quality_constraints_optional.sql` | Commented `ALTER TABLE` CHECKs for post-backfill hardening |

## Preconditions

- Core tables exist: `experiences`, `activities`, `accommodations`, `restaurants`, `packages`, `providers`, `group_trips` (from `schema.sql`, `schema_verticals.sql`, `schema_group_trips.sql`, `schema_providers_stripe.sql`).

## Order of operations

1. **Deploy diagnostics** — Run `migrations/20260329120000_data_quality_catalogue.sql` (or paste `schema_data_quality_catalogue.sql` sections B–D).
2. **Review bad rows** — `SELECT * FROM v_catalogue_data_quality ORDER BY entity, title NULLS LAST, name NULLS LAST;`
3. **Summarize issues** — `SELECT * FROM v_catalogue_data_quality_summary;` (or ad-hoc `GROUP BY` on `unnest(issues)` if you prefer).
4. **Review spelling outliers** — `SELECT * FROM v_city_spelling_candidates;` Extend `mw_canonical_city()` with new `WHEN` branches, then `CREATE OR REPLACE FUNCTION` again (same body as in the migration file).
5. **Normalize** — Run `schema_data_quality_normalize_apply.sql` inside a maintenance window (it uses `BEGIN`/`COMMIT`; remove the wrapper if your editor dislikes transactions).
6. **Re-check** — Repeat steps 2–4.
7. **Constraints (optional)** — Uncomment and run one `ALTER` at a time from `schema_data_quality_constraints_optional.sql` after data is clean.

## RLS note

Diagnostic views use the **caller’s** privileges. Use the **service role** or a privileged DB user in SQL Editor so `SELECT` is not empty due to row-level security on catalogue tables.

## Rollback (objects only)

```sql
DROP VIEW IF EXISTS v_catalogue_data_quality_summary;
DROP VIEW IF EXISTS v_city_spelling_candidates;
DROP VIEW IF EXISTS v_catalogue_data_quality;
DROP FUNCTION IF EXISTS mw_canonical_city(TEXT);
```

Normalization DML is not reversible without a backup.

## MVP field mapping (schema reality)

| Entity         | Title-like   | Description | Price-like              | Image-like        | Active / listed      |
| -------------- | ------------ | ----------- | ----------------------- | ----------------- | -------------------- |
| experiences    | `title`      | `description` | `price`               | `image_url`       | `is_active`          |
| activities     | `title`      | `description` | `price` (+ `price_type`) | `image_urls[]` | `is_active`          |
| accommodations | `name`       | `description` | `price_from`          | `image_urls[]`    | `is_active`          |
| restaurants    | `name`       | `description` | `price_range`         | `image_urls[]`    | `is_active`          |
| packages       | `title`      | `description` | `price_from`          | `image_urls[]`    | `is_active`          |
| providers      | `name`       | `description` | (N/A for listing card) | `logo_url` / `cover_url` / `images[]` | `status = 'active'` |
| group_trips    | `title`      | `description` | `price_per_person`  | `image_urls[]`    | `status IN ('open','full')` for public RLS |

City-like fields: `activities` / `accommodations` / `restaurants` → `city` (+ `location`); `experiences` → `location`; `packages` → `cities[]`; `providers` → `city`; `group_trips` → `destination`.
