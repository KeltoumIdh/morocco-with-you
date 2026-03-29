import express from "express";
import cors from "cors";
import { z } from "zod";
import { db, initDb, nextId, nowIso } from "./db.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "mwy-api", time: new Date().toISOString() });
});

function badRequest(res, message, details) {
  res.status(400).json({ ok: false, error: message, details });
}

function notFound(res, message = "Not found") {
  res.status(404).json({ ok: false, error: message });
}

function ok(res, data) {
  res.json({ ok: true, data });
}

function dateLabel(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "GU";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

// ─────────────────────────────────────────────────────────────
// Schemas (minimal; keep MVP fast)
// ─────────────────────────────────────────────────────────────
const tripSchema = z.object({
  title: z.string().min(1),
  destination: z.string().min(1),
  route: z.string().min(1),
  price: z.number().nonnegative(),
  status: z.enum(["draft", "published"]).default("draft"),
  image: z.string().optional().default(""),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

const postSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
  category: z.string().min(1).default("Guide"),
  author: z.string().min(1).default("Admin"),
  image: z.string().optional().default(""),
});

const bookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

const userUpdateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  status: z.enum(["active", "inactive"]),
});

const publicBookingSchema = z.object({
  providerId: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  date: z.string().min(1),
  guests: z.number().int().min(1).max(20),
  specialRequests: z.string().optional().default(""),
});

const itineraryIntakeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  dates: z.string().min(1),
  durationDays: z.number().int().min(1).max(30),
  budget: z.number().nonnegative(),
  style: z.string().min(1),
  destinations: z.array(z.string()).default([]),
});

// ─────────────────────────────────────────────────────────────
// Public API (user-facing MVP)
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/providers", async (req, res) => {
  await db.read();
  const city = String(req.query.city || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toLowerCase();
  const q = String(req.query.q || "").trim().toLowerCase();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = 12;

  let providers = db.data.trips.filter((t) => t.status === "published");
  if (city) {
    providers = providers.filter((t) => t.destination.toLowerCase().includes(city));
  }
  if (category) {
    providers = providers.filter((t) =>
      Array.isArray(t.tags) ? t.tags.some((tag) => String(tag).toLowerCase().includes(category)) : false
    );
  }
  if (q) {
    providers = providers.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  const total = providers.length;
  const items = providers.slice((page - 1) * pageSize, page * pageSize).map((t) => ({
    id: t.id,
    title: t.title,
    city: t.destination,
    category: t.tags?.[0] || "Experience",
    description: t.description,
    image: t.image,
    price: t.price,
    rating: 4.8,
    reviews: 100 + (Number(String(t.id).replace(/\D/g, "")) % 400),
    tags: t.tags || [],
    featured: Boolean(t.featured),
  }));

  ok(res, {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

app.get("/api/v1/providers/:id", async (req, res) => {
  await db.read();
  const provider = db.data.trips.find((t) => t.id === req.params.id && t.status === "published");
  if (!provider) return notFound(res, "Provider not found");
  ok(res, {
    id: provider.id,
    title: provider.title,
    city: provider.destination,
    category: provider.tags?.[0] || "Experience",
    description: provider.description,
    image: provider.image,
    price: provider.price,
    rating: 4.8,
    reviews: 120,
    tags: provider.tags || [],
  });
});

app.post("/api/v1/bookings", async (req, res) => {
  const parsed = publicBookingSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid booking payload", parsed.error.flatten());

  await db.read();
  const provider = db.data.trips.find((t) => t.id === parsed.data.providerId);
  if (!provider) return notFound(res, "Selected provider not found");

  const id = nextId("BK", db.data.bookings.map((b) => b.id));
  const amount = Number(provider.price) * Number(parsed.data.guests);
  const commission = Math.round(amount * 0.1);
  const now = nowIso();
  const booking = {
    id,
    user: parsed.data.fullName,
    avatar: initials(parsed.data.fullName),
    destination: provider.route || provider.destination,
    date: dateLabel(parsed.data.date),
    amount,
    commission,
    status: "pending",
    trip: provider.title,
    providerId: provider.id,
    email: parsed.data.email,
    guests: parsed.data.guests,
    specialRequests: parsed.data.specialRequests,
    createdAt: now,
    updatedAt: now,
  };
  db.data.bookings.unshift(booking);

  const commissionId = nextId("CM", db.data.commissions.map((c) => c.id));
  db.data.commissions.unshift({
    id: commissionId,
    booking: booking.id,
    user: booking.user,
    trip: booking.destination,
    date: booking.date,
    bookingAmt: amount,
    commission,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await db.write();
  ok(res, booking);
});

app.get("/api/v1/bookings/:id", async (req, res) => {
  await db.read();
  const booking = db.data.bookings.find((b) => b.id === req.params.id);
  if (!booking) return notFound(res, "Booking not found");
  ok(res, booking);
});

app.post("/api/v1/itineraries", async (req, res) => {
  const parsed = itineraryIntakeSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid itinerary intake", parsed.error.flatten());
  await db.read();

  const id = nextId("IT", db.data.itineraries.map((i) => i.id));
  const now = nowIso();
  const itinerary = {
    id,
    ...parsed.data,
    status: "DRAFT",
    shareToken: `tok_${Math.random().toString(36).slice(2, 12)}`,
    plan: [
      { day: 1, title: "Arrival & Medina Discovery", items: ["Airport pickup", "Riad check-in", "Jemaa el-Fna walk"] },
      { day: 2, title: "Culture & Cuisine", items: ["Guided medina tour", "Cooking class", "Rooftop dinner"] },
    ],
    createdAt: now,
    updatedAt: now,
  };
  db.data.itineraries.unshift(itinerary);

  const aiId = nextId("AI", db.data.aiLogs.map((l) => l.id));
  db.data.aiLogs.unshift({
    id: aiId,
    user: parsed.data.name,
    prompt: `Auto itinerary: ${parsed.data.durationDays} days, ${parsed.data.style}, budget ${parsed.data.budget}`,
    tokens: 980,
    output: itinerary.id,
    date: `${dateLabel(new Date())} · ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
    status: "success",
    model: "gpt-4o-mini",
    createdAt: now,
  });

  await db.write();
  ok(res, itinerary);
});

app.get("/api/v1/itineraries/:id", async (req, res) => {
  await db.read();
  const itinerary = db.data.itineraries.find((i) => i.id === req.params.id);
  if (!itinerary) return notFound(res, "Itinerary not found");
  ok(res, itinerary);
});

app.post("/api/v1/itineraries/:id/validate", async (req, res) => {
  await db.read();
  const idx = db.data.itineraries.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return notFound(res, "Itinerary not found");
  const itinerary = db.data.itineraries[idx];
  itinerary.status = "VALIDATED";
  itinerary.updatedAt = nowIso();
  db.data.itineraries[idx] = itinerary;
  await db.write();
  ok(res, itinerary);
});

app.get("/api/v1/group-trips", async (_req, res) => {
  await db.read();
  if (!db.data.groupTrips.length) {
    db.data.groupTrips = [
      { id: "GT-001", title: "Sahara Group Escape", destination: "Merzouga", maxCapacity: 16, enrolled: 9, startDate: "2026-05-14", endDate: "2026-05-18", pricePerPerson: 590 },
      { id: "GT-002", title: "Imperial Cities Circle", destination: "Fes / Meknes / Rabat", maxCapacity: 20, enrolled: 12, startDate: "2026-06-03", endDate: "2026-06-08", pricePerPerson: 740 },
    ];
    await db.write();
  }
  ok(res, db.data.groupTrips);
});

app.post("/api/v1/group-trips/:id/join", async (req, res) => {
  await db.read();
  const idx = db.data.groupTrips.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return notFound(res, "Group trip not found");
  const trip = db.data.groupTrips[idx];
  if (trip.enrolled >= trip.maxCapacity) return badRequest(res, "Group trip is full");
  trip.enrolled += 1;
  db.data.groupTrips[idx] = trip;
  await db.write();
  ok(res, trip);
});

// ─────────────────────────────────────────────────────────────
// Trips
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/trips", async (req, res) => {
  await db.read();
  const status = req.query.status && String(req.query.status);
  const search = (req.query.search && String(req.query.search)) || "";
  const q = search.trim().toLowerCase();

  const data = db.data.trips
    .filter((t) => !status || status === "all" || t.status === status)
    .filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
    );

  ok(res, data);
});

app.post("/api/v1/admin/trips", async (req, res) => {
  const parsed = tripSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid trip", parsed.error.flatten());

  await db.read();
  const id = nextId("TR", db.data.trips.map((t) => t.id));
  const now = nowIso();
  const trip = { id, ...parsed.data, createdAt: now, updatedAt: now };
  db.data.trips.unshift(trip);
  await db.write();
  ok(res, trip);
});

app.put("/api/v1/admin/trips/:id", async (req, res) => {
  const parsed = tripSchema.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid trip update", parsed.error.flatten());

  await db.read();
  const idx = db.data.trips.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return notFound(res, "Trip not found");

  const updated = { ...db.data.trips[idx], ...parsed.data, updatedAt: nowIso() };
  db.data.trips[idx] = updated;
  await db.write();
  ok(res, updated);
});

app.delete("/api/v1/admin/trips/:id", async (req, res) => {
  await db.read();
  const before = db.data.trips.length;
  db.data.trips = db.data.trips.filter((t) => t.id !== req.params.id);
  if (db.data.trips.length === before) return notFound(res, "Trip not found");
  await db.write();
  ok(res, { id: req.params.id });
});

// ─────────────────────────────────────────────────────────────
// Posts
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/posts", async (req, res) => {
  await db.read();
  ok(res, db.data.posts);
});

app.post("/api/v1/admin/posts", async (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid post", parsed.error.flatten());

  await db.read();
  const id = nextId("PO", db.data.posts.map((p) => p.id));
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const iso = now.toISOString();
  const post = { id, ...parsed.data, date, views: 0, createdAt: iso, updatedAt: iso };
  db.data.posts.unshift(post);
  await db.write();
  ok(res, post);
});

app.put("/api/v1/admin/posts/:id", async (req, res) => {
  const parsed = postSchema.partial().safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid post update", parsed.error.flatten());

  await db.read();
  const idx = db.data.posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return notFound(res, "Post not found");

  const updated = { ...db.data.posts[idx], ...parsed.data, updatedAt: nowIso() };
  db.data.posts[idx] = updated;
  await db.write();
  ok(res, updated);
});

app.delete("/api/v1/admin/posts/:id", async (req, res) => {
  await db.read();
  const before = db.data.posts.length;
  db.data.posts = db.data.posts.filter((p) => p.id !== req.params.id);
  if (db.data.posts.length === before) return notFound(res, "Post not found");
  await db.write();
  ok(res, { id: req.params.id });
});

// ─────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/bookings", async (_req, res) => {
  await db.read();
  ok(res, db.data.bookings);
});

app.patch("/api/v1/admin/bookings/:id/status", async (req, res) => {
  const parsed = bookingStatusSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid status", parsed.error.flatten());

  await db.read();
  const idx = db.data.bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return notFound(res, "Booking not found");

  const updated = { ...db.data.bookings[idx], status: parsed.data.status, updatedAt: nowIso() };
  db.data.bookings[idx] = updated;
  await db.write();
  ok(res, updated);
});

app.delete("/api/v1/admin/bookings/:id", async (req, res) => {
  await db.read();
  const before = db.data.bookings.length;
  db.data.bookings = db.data.bookings.filter((b) => b.id !== req.params.id);
  if (db.data.bookings.length === before) return notFound(res, "Booking not found");
  await db.write();
  ok(res, { id: req.params.id });
});

// ─────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/users", async (_req, res) => {
  await db.read();
  ok(res, db.data.users);
});

app.put("/api/v1/admin/users/:id", async (req, res) => {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid user update", parsed.error.flatten());

  await db.read();
  const idx = db.data.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return notFound(res, "User not found");

  const updated = { ...db.data.users[idx], ...parsed.data, updatedAt: nowIso() };
  db.data.users[idx] = updated;
  await db.write();
  ok(res, updated);
});

app.delete("/api/v1/admin/users/:id", async (req, res) => {
  await db.read();
  const before = db.data.users.length;
  db.data.users = db.data.users.filter((u) => u.id !== req.params.id);
  if (db.data.users.length === before) return notFound(res, "User not found");
  await db.write();
  ok(res, { id: req.params.id });
});

// ─────────────────────────────────────────────────────────────
// Commissions
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/commissions", async (_req, res) => {
  await db.read();
  ok(res, db.data.commissions);
});

app.patch("/api/v1/admin/commissions/:id/mark-paid", async (req, res) => {
  await db.read();
  const idx = db.data.commissions.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return notFound(res, "Commission not found");

  const updated = { ...db.data.commissions[idx], status: "paid", updatedAt: nowIso() };
  db.data.commissions[idx] = updated;
  await db.write();
  ok(res, updated);
});

// ─────────────────────────────────────────────────────────────
// AI Logs
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/ai-logs", async (_req, res) => {
  await db.read();
  ok(res, db.data.aiLogs);
});

app.post("/api/v1/admin/ai-logs", async (req, res) => {
  const body = req.body || {};
  const schema = z.object({
    user: z.string().min(1),
    prompt: z.string().min(1),
    tokens: z.number().int().nonnegative().default(0),
    output: z.string().min(1),
    status: z.enum(["success", "error"]),
    model: z.string().min(1).default("gpt-4o-mini"),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(res, "Invalid ai log", parsed.error.flatten());

  await db.read();
  const id = nextId("AI", db.data.aiLogs.map((l) => l.id));
  const now = new Date();
  const date = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  const row = { id, ...parsed.data, date, createdAt: now.toISOString() };
  db.data.aiLogs.unshift(row);
  await db.write();
  ok(res, row);
});

// ─────────────────────────────────────────────────────────────
// Dashboard summary (so UI can be "real" easily)
// ─────────────────────────────────────────────────────────────
app.get("/api/v1/admin/summary", async (_req, res) => {
  await db.read();

  const bookings = db.data.bookings;
  const commissions = db.data.commissions;
  const users = db.data.users;

  const revenue = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const commissionTotal = commissions.reduce((s, c) => s + (Number(c.commission) || 0), 0);
  const pendingCommission = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + (Number(c.commission) || 0), 0);

  ok(res, {
    totals: {
      bookings: bookings.length,
      users: users.length,
      revenue,
      commissions: commissionTotal,
      commissionsPending: pendingCommission,
    },
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

await initDb();
app.listen(PORT, () => {
  // Keep logs minimal (interview-friendly)
  console.log(`[mwy-api] listening on http://localhost:${PORT}`);
});

