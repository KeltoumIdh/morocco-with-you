import './env-bootstrap.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRouter         from './routes/auth.js';
import experiencesRouter  from './routes/experiences.js';
import bookingsRouter     from './routes/bookings.js';
import itinerariesRouter, { publicItinerariesRouter } from './routes/itineraries.js';
import chatRouter         from './routes/chat.js';
import profileRouter      from './routes/profile.js';
import activitiesRouter     from './routes/activities.js';
import accommodationsRouter from './routes/accommodations.js';
import restaurantsRouter    from './routes/restaurants.js';
import packagesRouter       from './routes/packages.js';
import eventsRouter       from './routes/events.js';
import adminRouter        from './routes/admin.js';
import reviewsRouter      from './routes/reviews.js';
import paymentsRouter, { handleStripeWebhook } from './routes/payments.js';
import providersRouter    from './routes/providers.js';
import groupTripsRouter   from './routes/grouptrips.js';
import searchRouter       from './routes/search.js';
import recommendationsRouter from './routes/recommendations.js';
import { supabase }       from './services/supabase.js';
import { requireAuth }    from './middleware/auth.js';
import { errorHandler }   from './middleware/errorHandler.js';

const app = express();

// ── Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ADMIN_URL  || 'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Handle preflight for ALL routes
app.options('*', cors());

// Stripe webhooks MUST use raw body (before express.json)
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`, req.body ? JSON.stringify(req.body).slice(0,120) : '');
    next();
  });
}

// ── Rate limiting (production; local dev easily exceeds 200/15min with auth + SPA) ──
const rateLimitDisabled =
  process.env.RATE_LIMIT_DISABLED === '1' || process.env.NODE_ENV !== 'production';
const parsedMax = Number(process.env.API_RATE_LIMIT_MAX);
const apiRateLimitMax =
  Number.isFinite(parsedMax) && parsedMax > 0 ? Math.floor(parsedMax) : 200;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => rateLimitDisabled,
});
app.use('/api/', limiter);

// ── Routes ──
app.use('/api/auth',        authRouter);
app.use('/api/experiences', experiencesRouter);          // public
app.use('/api/search',      searchRouter);               // public semantic / fallback search
app.use('/api/activities',     activitiesRouter);        // public GET, auth for book
app.use('/api/accommodations', accommodationsRouter);    // public
app.use('/api/restaurants',    restaurantsRouter);       // public
app.use('/api/packages',       packagesRouter);          // public GET, auth for book
app.use('/api/planning',       packagesRouter);          // planning request in same file
app.use('/api/bookings',    requireAuth, bookingsRouter);
app.use('/api/itineraries', requireAuth, itinerariesRouter);
app.use('/api/v1/itineraries', publicItinerariesRouter);
app.use('/api/chat',        requireAuth, chatRouter);
app.use('/api/v1/recommendations', requireAuth, recommendationsRouter);
app.use('/api/recommendations',    requireAuth, recommendationsRouter);
app.use('/api/profile',     requireAuth, profileRouter);
app.use('/api/events',      eventsRouter);               // public POST
app.use('/api/admin',       requireAuth, adminRouter);   // admin only
app.use('/api/reviews',     requireAuth, reviewsRouter); // protected
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/payments',    paymentsRouter);
app.use('/api/v1/providers', providersRouter);
app.use('/api/providers',   providersRouter);
app.use('/api/v1/group-trips', groupTripsRouter);
app.use('/api/group-trips',    groupTripsRouter);

// ── Health check ──
app.get('/health', (_req, res) => res.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString() 
}));

// ── Setup check (non-destructive) ──
app.get('/api/setup/check', async (_req, res) => {
  const checks = {};
  const tables = ['profiles', 'experiences', 'bookings', 'saved_experiences', 'itineraries', 'chat_messages', 'catalogue_embeddings', 'reviews', 'event_requests', 'posts', 'ai_logs'];
  for (const t of tables) {
    try {
      const { error } = await supabase.from(t).select('*', { head: true, count: 'exact' });
      checks[t] = error ? `missing_or_error: ${error.message}` : 'ok';
    } catch (e) {
      checks[t] = `error: ${e.message}`;
    }
  }
  try {
    const { data, error } = await supabase.storage.listBuckets();
    checks.avatars_bucket = error ? `missing_or_error: ${error.message}` : (data?.some((b) => b.name === 'avatars') ? 'ok' : 'missing');
  } catch (e) {
    checks.avatars_bucket = `error: ${e.message}`;
  }
  return res.json({ status: 'ok', checks });
});

// ── 404 ──
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ──
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;
