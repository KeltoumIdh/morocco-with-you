# Deploy: Render (API) + Vercel (frontend)

**Why this combo:** **Vercel** has a strong **free hobby** tier for static/Vite sites. **Render** offers a **free Web Service** for Node (API sleeps after ~15 min idle; first request is slow—normal for demos). **Railway** is usage-based after trial credits; use it later if you outgrow Render’s free tier.

**Order:** Supabase ready → deploy API on Render → deploy site on Vercel → point env vars at each other → Supabase Auth URLs → (optional) Stripe webhook.

---

## 0. Prerequisites

1. Code on **GitHub** (Render and Vercel connect to Git).
2. **Supabase** project with schemas applied and **anon** + **service role** keys copied.
3. Know your future **Vercel URL** (e.g. `https://morocco-with-you.vercel.app`)—you’ll need it for CORS and Supabase redirects. You can deploy Vercel once to get the URL, then update Render + Supabase.

---

## 1. Deploy the API on Render (step by step)

1. Sign up at [render.com](https://render.com) (GitHub login is fine).
2. **Dashboard → New + → Web Service**.
3. **Connect** your GitHub repo `morocco_with_you_project` (install Render’s GitHub app if asked).
4. Configure:
   - **Name:** e.g. `morocco-with-you-api`
   - **Region:** choose closest to users (e.g. Frankfurt).
   - **Branch:** `main` or `master`
   - **Root directory:** leave **empty** (repo root).
   - **Runtime:** **Node**
   - **Build command:** `npm install`
   - **Start command:** `npm start`  
     (runs `node server/index.js` — see `package.json`.)
   - **Instance type:** **Free**

5. **Environment → Environment Variables** — add (minimum):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | from Supabase → Settings → API |
   | `SUPABASE_SERVICE_KEY` | service_role (secret) |
   | `SUPABASE_ANON_KEY` | anon public |
   | `CLIENT_URL` | your Vercel site URL, e.g. `https://xxx.vercel.app` (no trailing slash) |
   | `ADMIN_URL` | same as `CLIENT_URL` if admin lives on the same Vite app |

   Add when you use them:

   - **AI:** `GEMINI_API_KEY` or `OPENAI_API_KEY` (+ related vars from `server/.env.example`)
   - **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
   - **Email:** `RESEND_API_KEY`, etc.

6. **Create Web Service**. Wait for build + deploy.
7. Copy the service URL, e.g. `https://morocco-with-you-api.onrender.com`.
8. **Smoke test:** open `https://YOUR-SERVICE.onrender.com/health` — JSON `status: ok`.

**Stripe webhook (production):** in Stripe → Developers → Webhooks, add:

`https://YOUR-SERVICE.onrender.com/api/v1/payments/webhook`

Paste the signing secret into Render as `STRIPE_WEBHOOK_SECRET`.

**Cold starts:** free tier spins down; first request after idle can take ~30–60s. Upgrade or keep a uptime ping only if terms allow.

---

## 2. Deploy the frontend on Vercel (step by step)

1. Sign up at [vercel.com](https://vercel.com) with GitHub.
2. **Add New… → Project → Import** your repo.
3. **Framework Preset:** Vite (or “Other” if not detected).
4. **Build & Output:**
   - Build command: `npm run build`
   - Output directory: `dist`
5. **Environment Variables** (Production) — required for build:

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
   | `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` (no trailing slash before `/api`) |

   Optional:

   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_ADMIN_URL`, `VITE_ADMIN_OPEN_NEW_TAB` (see `.env.example`)

6. **Deploy**. Note the URL, e.g. `https://morocco-with-you.vercel.app`.

7. **SPA routing:** `vercel.json` in this repo rewrites all paths to `index.html` so `/admin/dashboard` and `/booking/success` work.

---

## 3. Connect everything (important)

1. **Render →** set `CLIENT_URL` and `ADMIN_URL` to your **exact** Vercel URL (`https://….vercel.app`). **Redeploy** the Render service if you change env.
2. **Supabase → Authentication → URL configuration:**
   - **Site URL:** your Vercel URL
   - **Redirect URLs:** add the same URL (and `http://localhost:5173` for local dev if you want)
3. **Vercel →** confirm `VITE_API_URL` matches Render **including** `/api` suffix (same as local `http://localhost:3001/api`).

---

## 4. Verify

- Open Vercel URL → Explore / login; in browser **Network**, API calls should hit Render, not CORS errors.
- `https://YOUR-RENDER/api/setup/check` — review table checks.
- Admin: `/admin/dashboard` with `profiles.role = 'admin'`.

---

## Optional: Railway instead of Render

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → same repo.
2. Add a **Node** service; set **Start command** to `npm start` and **Root** to repo root.
3. **Variables:** same as Render table above; Railway injects `PORT` automatically (Express already uses `process.env.PORT`).
4. Copy the generated **public URL** and use it as `VITE_API_URL` on Vercel (`https://xxx.up.railway.app/api` — confirm Railway’s URL shape in the dashboard).

---

## Files in this repo

| File | Role |
|------|------|
| `package.json` → `start` | Production entry for PaaS |
| `render.yaml` | Optional Render Blueprint |
| `vercel.json` | Vercel build output + SPA fallback |
| `DEPLOY.md` | This guide |
