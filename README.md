# Morocco With You

React (Vite) travel marketplace for Morocco: **customer app** (`UserApp`) and **admin console** (`/admin/*`), backed by **Express** + **Supabase** (Postgres, Auth, Storage) and optional **Stripe** for bookings.

## Stack

- **Frontend:** React 18, Vite, Tailwind, React Router, Leaflet (itinerary maps), Stripe.js
- **Backend:** `server/` — Express, Supabase client, OpenAI / embeddings, hybrid search
- **Database:** Supabase Postgres; SQL schemas live in `server/schema*.sql` and `server/migrations/`

## Quick start

### 1. Install

```bash
npm install
```

### 2. Environment

Copy examples and fill in real values:

| File | Purpose |
|------|---------|
| `.env.example` → `.env` | Vite: `VITE_SUPABASE_*`, `VITE_API_URL`, optional `VITE_ADMIN_URL`, `VITE_ADMIN_OPEN_NEW_TAB` |
| `server/.env.example` → `server/.env` | API: Supabase service role, Stripe, OpenAI, etc. |

Never commit `.env` or `server/.env`.

### 3. Database (Supabase)

Run SQL in the Supabase SQL editor in a sensible order, for example:

1. `server/schema.sql` — core tables (profiles, experiences, bookings, …)
2. `server/schema_verticals.sql` — activities, accommodations, restaurants, packages, …
3. `server/schema_group_trips.sql`, `server/schema_providers_stripe.sql`, and any other `server/schema_*.sql` you use (vector search, AI monitoring, prompts, eval, …)
4. Optional data quality: `server/migrations/20260329120000_data_quality_catalogue.sql` (see `server/RUNBOOK_data_quality_catalogue.md`)

### 4. Seed catalogue (optional)

```bash
npm run seed:mvp:sql > server/seed/generated_mvp_inserts.sql
```

Paste the generated SQL into Supabase, or use `npm run seed:mvp:post` with a valid admin JWT (see script header in `server/scripts/seed-morocco-mvp.js`).

### 5. Run locally

Terminal 1 — API (default often `3001`; check `server/.env`):

```bash
npm run dev:server
```

Terminal 2 — Vite dev server:

```bash
npm run dev
```

- Customer shell: app root `/`
- Admin: `/admin/dashboard` (requires `profiles.role = 'admin'`). Admins also get an **Admin dashboard** link in the customer UI when logged in.

### 6. Embeddings (if RAG / hybrid search enabled)

```bash
npm run embed:catalogue
```

## NPM scripts (high level)

| Script | Description |
|--------|-------------|
| `dev` | Vite dev server |
| `dev:server` | Express API with `server/.env` |
| `build` / `preview` | Production build and static preview |
| `embed:*` / `embed:catalogue` | Regenerate catalogue embeddings |
| `eval`, `eval:hybrid`, … | Retrieval eval harness |
| `seed:mvp:sql` | Print MVP seed SQL from `server/seed/morocco_mvp_seed.jsonl` |
| `seed:mvp:post` | POST seed rows via admin API |
| `test:e2e` | Playwright (`e2e/`, needs `npx playwright install chromium` once) |

## Project layout

```
src/                 # React app (user + admin routes in App.jsx)
server/              # Express API, routes, services, SQL schemas
server/migrations/   # Versioned SQL (e.g. data quality views)
server/seed/         # JSONL MVP seed + optional generated SQL
e2e/                 # Playwright specs
```

## Docs in repo

- `server/RUNBOOK_data_quality_catalogue.md` — diagnostics views, normalization, optional constraints
- `server/schema_data_quality_normalize_apply.sql` — city normalization DML (run after review)
- `server/schema_data_quality_constraints_optional.sql` — commented CHECKs for post-backfill hardening

## E2E

```bash
npx playwright install chromium
npm run test:e2e
```

Optional admin scenario: set `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`. See `playwright.config.mjs` for `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_NO_SERVER`.

## Deploy (production)

Step-by-step **Render (free API) + Vercel (free frontend)** is in [`DEPLOY.md`](./DEPLOY.md). The repo includes `render.yaml` (optional Blueprint) and `vercel.json` (SPA routing for React Router).

## License

Private project unless noted otherwise.
