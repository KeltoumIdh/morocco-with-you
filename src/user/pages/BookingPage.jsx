import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BookingCard from "../components/ui/BookingCard";
import { Ico } from "../icons";
import { useBookings } from "../../hooks/useBookings";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useExperiences } from "../../hooks/useExperiences";
import { useRealtimeBookings } from "../../hooks/useRealtime";
import { paymentsApi } from "../../lib/api";

const STEPS = ["Details", "Guests", "Review", "Payment"];

function experienceThumbUrl(exp) {
  const u = exp?.image_url;
  if (u == null || String(u).trim() === "") return null;
  const s = String(u).trim();
  return /^https?:\/\//i.test(s) ? s : null;
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < step ? "var(--sage)" : i === step ? "linear-gradient(135deg,var(--terracotta),var(--deep))" : "var(--light-clay)",
                color: i <= step ? "#fff" : "var(--smoke)",
              }}>
              {i < step ? <Ico.Check /> : i + 1}
            </div>
            <span className="text-xs mt-1 whitespace-nowrap" style={{ color: i === step ? "var(--terracotta)" : "var(--smoke)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-2 mb-4" style={{ background: i < step ? "var(--sage)" : "var(--clay)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function SuccessScreen({ bookingRef, onViewBookings, setPage }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-5">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-6 success-pop"
        style={{ background: "linear-gradient(135deg,var(--sage),#4a7c59)", fontSize: 32 }}>
        <Ico.Check />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--sage)", letterSpacing: ".12em" }}>Request Received</p>
      <h2 className="font-display mb-3" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 400, color: "var(--ink)" }}>
        Your adventure <em>awaits!</em>
      </h2>
      <p className="text-sm mb-2" style={{ color: "var(--smoke)" }}>
        Your booking request is pending. You’ll see an instant update here when it’s confirmed by the team.
      </p>
      <div className="my-5 px-6 py-3 rounded-2xl" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
        <p className="text-xs" style={{ color: "var(--smoke)" }}>Booking Reference</p>
        <p className="font-mono font-bold mt-0.5" style={{ color: "var(--terracotta)", fontSize: 18, letterSpacing: ".08em" }}>
          {String(bookingRef).slice(0, 8).toUpperCase()}
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={() => onViewBookings?.()}
          className="px-6 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer" }}
        >
          View Bookings
        </button>
        <button
          type="button"
          onClick={() => setPage("explore")}
          className="px-6 py-3 rounded-2xl text-sm font-medium"
          style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}
        >
          Explore More
        </button>
      </div>
    </div>
  );
}

export default function BookingPage({
  setPage,
  selectedExperience,
  bookingDraft,
  onConsumeBookingDraft,
}) {
  const toast = useToast();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { bookings, setBookings, loading, createBooking } = useBookings();
  const { experiences: expOptions, loading: expLoading } = useExperiences({ sort: "rating" });

  const [tab, setTab]     = useState("upcoming");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep]   = useState(0);
  const didInit = useRef(false);
  const [selectedExp, setSelectedExp] = useState(selectedExperience || null);
  const [form, setForm]   = useState({ date: "", guests: "1", notes: "" });
  const [payLoading, setPayLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (didInit.current) return;
    if (selectedExp) { didInit.current = true; return; }
    if (!expLoading && expOptions?.length) {
      setSelectedExp(expOptions[0]);
      didInit.current = true;
    }
  }, [expLoading, expOptions, selectedExp]);

  useEffect(() => {
    if (!bookingDraft?.date) return;
    setForm((f) => ({
      ...f,
      date: bookingDraft.date,
      guests: String(bookingDraft.guests ?? f.guests ?? "1"),
    }));
    setShowForm(true);
    setSuccess(null);
    const exp = bookingDraft.experience || selectedExperience;
    if (exp?.id) {
      setSelectedExp(exp);
      setStep(1);
    } else {
      setStep(0);
    }
    onConsumeBookingDraft?.();
  }, [bookingDraft, selectedExperience, onConsumeBookingDraft]);

  /** First page of API list can omit the user's experience — still show it as selected. */
  const pickerExperiences = useMemo(() => {
    const base = Array.isArray(expOptions) ? [...expOptions] : [];
    const anchor = bookingDraft?.experience || selectedExperience || selectedExp;
    if (anchor?.id && !base.some((e) => String(e.id) === String(anchor.id))) {
      return [anchor, ...base];
    }
    return base;
  }, [expOptions, bookingDraft, selectedExperience, selectedExp]);

  const priceNum = Number(selectedExp?.price || 0);
  const total    = Math.round((priceNum * parseInt(form.guests) + 25) * 1.05);

  const minTravelDate = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const selectedExpThumb = experienceThumbUrl(selectedExp);

  // Realtime: admin confirmation/cancel reflects immediately
  useRealtimeBookings(user?.id, (payload) => {
    const ev = payload?.eventType;
    if (!ev) return;

    if (ev === "INSERT") {
      if (!payload.new?.id) return;
      setBookings((prev) => (prev.some((b) => b.id === payload.new.id) ? prev : [payload.new, ...prev]));
      return;
    }

    if (ev === "UPDATE") {
      const next = payload?.new;
      if (!next?.id) return;
      setBookings((prev) => prev.map((b) => (b.id === next.id ? { ...b, ...next } : b)));
      if (next.status === "confirmed") toast("Your booking has been confirmed ✓", "success");
      if (next.status === "cancelled") toast("Your booking was cancelled.", "warning");
      return;
    }

    if (ev === "DELETE") {
      const id = payload?.old?.id;
      if (!id) return;
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  });

  const statusLabel = (s) =>
    s === "pending" ? "Pending" : s === "confirmed" ? "Confirmed" : s === "completed" ? "Completed" : "Cancelled";

  const mapped = bookings.map((b) => ({
    id:       b.id,
    title:    b.experiences?.title   || "Experience",
    location: b.experiences?.location || "",
    gradient: b.experiences?.gradient || selectedExp?.gradient || "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
    status:   statusLabel(b.status),
    date:     b.travel_date ? new Date(b.travel_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    guests:   b.guests,
    total:    `€${Number(b.total_amount || 0).toFixed(0)}`,
  }));

  const filtered = mapped.filter((b) =>
    tab === "upcoming" ? (b.status === "Pending" || b.status === "Confirmed") : (b.status !== "Pending" && b.status !== "Confirmed")
  );

  const handleStripeCheckout = async () => {
    if (!isAuthenticated) {
      setPage("login");
      return;
    }
    if (!selectedExp?.id || !form.date) {
      toast("Choose a date and experience first.", "error");
      return;
    }
    setPayLoading(true);
    try {
      const booking = await createBooking({
        experience_id: selectedExp.id,
        travel_date: form.date,
        guests: parseInt(form.guests, 10),
        special_requests: form.notes || undefined,
        booking_type: "experience",
      });
      const { url } = await paymentsApi.checkout(booking.id);
      if (url) {
        window.location.href = url;
        return;
      }
      toast("Could not start checkout.", "error");
    } catch (e) {
      toast(e?.message || "Payment could not start. Check Stripe configuration.", "error");
    } finally {
      setPayLoading(false);
    }
  };

  const openForm = () => {
    setShowForm(true);
    setSuccess(null);
    setStep(0);
    setSelectedExp(null);
    didInit.current = false;
  };

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10 px-5 md:px-8 lg:px-10">
      <div className="py-6 flex items-center justify-between">
        <div>
          <h1 className="font-display" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 400, color: "var(--ink)" }}>
            My <em>Bookings</em>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--smoke)" }}>Manage your Morocco experiences</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(192,101,74,.3)" }}>
          + Book Now
        </button>
      </div>

      {/* Success screen (inline, not modal) */}
      {success && (
        <SuccessScreen
          bookingRef={success}
          onViewBookings={() => {
            setSuccess(null);
            setShowForm(false);
            setStep(0);
          }}
          setPage={setPage}
        />
      )}

      {!success && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {["upcoming", "completed"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className="chip capitalize"
                style={{ background: tab === t ? "var(--ink)" : "transparent", color: tab === t ? "var(--parchment)" : "var(--smoke)", borderColor: tab === t ? "var(--ink)" : "var(--clay)" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Booking cards */}
          <div className="space-y-4 mb-8">
            {loading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden h-28 shimmer" style={{ background: "var(--sand)", border: "1px solid var(--light-clay)" }} />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
                <p className="font-display text-xl mb-2" style={{ color: "var(--smoke)" }}>
                  {tab === "upcoming" ? "Your adventures await" : "No completed bookings yet"}
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>
                  {tab === "upcoming" ? "Start planning your Morocco adventure" : "Complete a trip to see it here"}
                </p>
                <button onClick={() => setPage("explore")} className="chip chip-inactive">Browse experiences</button>
              </div>
            ) : (
              filtered.map((b) => <BookingCard key={b.id} booking={b} />)
            )}
          </div>
        </>
      )}

      {/* Multi-step booking modal */}
      {showForm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center modal-backdrop"
            style={{ background: "rgba(26,20,16,.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <div
              className="modal-panel w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 md:p-8"
              style={{ background: "var(--parchment)", maxHeight: "92vh", overflowY: "auto" }}
            >

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>
                {step === 0 ? "Choose Experience" : step === 1 ? "Guest Details" : step === 2 ? "Review Booking" : "Payment"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}><Ico.X /></button>
            </div>

            <StepIndicator step={step} />

            {/* Step 0: Experience selector */}
            {step === 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Select Experience</p>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x -mx-1 px-1">
                  {(pickerExperiences?.length ? pickerExperiences : []).map((exp) => {
                    const thumb = experienceThumbUrl(exp);
                    return (
                    <button key={exp.id} onClick={() => setSelectedExp(exp)}
                      className="snap-s flex-shrink-0 rounded-2xl p-3 text-left transition-all"
                      style={{ width: 150, background: String(selectedExp?.id) === String(exp.id) ? "rgba(192,101,74,.12)" : "var(--sand)", border: String(selectedExp?.id) === String(exp.id) ? "2px solid var(--terracotta)" : "1.5px solid var(--clay)", cursor: "pointer", boxShadow: String(selectedExp?.id) === String(exp.id) ? "0 0 0 1px rgba(192,101,74,.2)" : "none" }}>
                      <div className="h-20 rounded-xl mb-2 overflow-hidden relative">
                        {thumb ? (
                          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 w-full h-full" style={{ background: exp.gradient }} />
                        )}
                      </div>
                      <p className="text-xs font-semibold leading-tight" style={{ color: "var(--ink)" }}>{exp.title}</p>
                      <p className="text-xs mt-0.5 font-bold" style={{ color: "var(--terracotta)" }}>€{Number(exp.price || 0).toFixed(0)}</p>
                    </button>
                    );
                  })}
                </div>
                <button onClick={() => setStep(1)} disabled={!selectedExp}
                  className="w-full mt-6 py-4 rounded-2xl font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer" }}>
                  Continue →
                </button>
              </div>
            )}

            {/* Step 1: Guests + date */}
            {step === 1 && (
              <div className="space-y-4">
                {selectedExp && (
                  <div
                    className="flex gap-3 p-3 rounded-2xl mb-1"
                    style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                      {selectedExpThumb ? (
                        <img
                          src={selectedExpThumb}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0" style={{ background: selectedExp.gradient }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--smoke)" }}>
                        Your experience
                      </p>
                      <p className="font-semibold text-sm leading-tight mt-0.5" style={{ color: "var(--ink)" }}>
                        {selectedExp.title}
                      </p>
                      {selectedExp.location ? (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--smoke)" }}>
                          {selectedExp.location}
                        </p>
                      ) : null}
                      <p className="text-xs font-bold mt-1" style={{ color: "var(--terracotta)" }}>
                        €{Number(selectedExp.price || 0).toFixed(0)} per person
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-xs">Travel Date *</label>
                    <input
                      required
                      type="date"
                      min={minTravelDate}
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="form-input mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="label-xs">Guests</label>
                    <select value={form.guests} onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                      className="form-input mt-1.5">
                      {[1,2,3,4,5,6,7,8].map((n) => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-xs">Special Requests (optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                    placeholder="Dietary needs, accessibility, etc."
                    className="form-input mt-1.5" style={{ resize: "none" }} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setStep(0)} className="px-5 py-4 rounded-2xl text-sm font-medium"
                    style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>← Back</button>
                  <button onClick={() => setStep(2)} disabled={!form.date}
                    className="flex-1 py-4 rounded-2xl font-semibold text-sm"
                    style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: form.date ? "pointer" : "not-allowed", opacity: form.date ? 1 : .6 }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review summary */}
            {step === 2 && (
              <div>
                <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid var(--clay)" }}>
                  <div className="h-28" style={{ background: selectedExp.gradient }} />
                  <div className="p-4" style={{ background: "var(--sand)" }}>
                    <h3 className="font-display mb-1" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>{selectedExp.title}</h3>
                    <p className="text-sm" style={{ color: "var(--smoke)" }}>{selectedExp.location}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-5 text-sm">
                  {[
                    ["Travel Date",  new Date(form.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })],
                    ["Guests",       `${form.guests} ${parseInt(form.guests) === 1 ? "person" : "people"}`],
                    ["Base price",   `€${priceNum} × ${form.guests} = €${priceNum * parseInt(form.guests)}`],
                    ["Guide fee",    "€25"],
                    ["Platform fee", `€${Math.round((priceNum * parseInt(form.guests) + 25) * 0.05)}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span style={{ color: "var(--smoke)" }}>{k}</span>
                      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-semibold text-base" style={{ borderTop: "1px solid var(--clay)" }}>
                    <span style={{ color: "var(--ink)" }}>Total</span>
                    <span style={{ color: "var(--terracotta)" }}>€{total}</span>
                  </div>
                </div>
                {form.notes && (
                  <div className="mb-5 p-3 rounded-xl text-sm" style={{ background: "var(--sand)", color: "var(--smoke)" }}>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>Special requests: </span>{form.notes}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="px-5 py-4 rounded-2xl text-sm font-medium"
                    style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>← Back</button>
                  <button onClick={() => setStep(3)}
                    className="flex-1 py-4 rounded-2xl font-semibold text-sm"
                    style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer" }}>
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment — Stripe Checkout */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 mb-2" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Amount due</p>
                  <p className="font-display" style={{ fontSize: 28, fontWeight: 500, color: "var(--terracotta)" }}>€{total}</p>
                </div>

                <p className="text-sm" style={{ color: "var(--smoke)" }}>
                  You’ll complete payment securely on Stripe. After payment, you’ll return here to see your confirmation.
                </p>

                <div className="rounded-2xl p-4" style={{ background: "rgba(90, 126, 92, .08)", border: "1px solid rgba(90, 126, 92, .25)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--sage)", letterSpacing: ".1em" }}>
                    Demo test card (Stripe)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: "var(--ink)" }}>
                    <div><span style={{ color: "var(--smoke)" }}>Card number:</span> <span className="font-mono font-semibold">4242 4242 4242 4242</span></div>
                    <div><span style={{ color: "var(--smoke)" }}>CVC:</span> <span className="font-mono font-semibold">123</span></div>
                    <div><span style={{ color: "var(--smoke)" }}>Expiry:</span> <span className="font-mono font-semibold">12/34</span></div>
                    <div><span style={{ color: "var(--smoke)" }}>Name:</span> <span className="font-semibold">Any</span></div>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: "var(--smoke)" }}>
                    To simulate a declined payment later, try <span className="font-mono">4000 0000 0000 9995</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs py-2" style={{ color: "var(--smoke)" }}>
                  <span style={{ color: "var(--sage)" }}>🔒</span>
                  Secured by Stripe · Cards and wallets where available
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep(2)} className="px-5 py-4 rounded-2xl text-sm font-medium"
                    style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>← Back</button>
                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={payLoading}
                    className="flex-1 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
                      color: "#fff",
                      border: "none",
                      cursor: payLoading ? "not-allowed" : "pointer",
                      opacity: payLoading ? 0.85 : 1,
                    }}
                  >
                    {payLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Redirecting…
                      </>
                    ) : (
                      `Pay €${total} with Stripe`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
