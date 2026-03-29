import { useEffect, useMemo, useRef, useState } from "react";
import { Ico } from "../icons";
import Chip from "../components/ui/Chip";
import CardSkeleton from "../components/ui/CardSkeleton";
import PackageCard from "../components/ui/PackageCard";
import { packagesApi } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

const CITIES = [
  "Marrakech", "Fès", "Casablanca", "Essaouira", "Chefchaouen",
  "Sahara/Merzouga", "Atlas Mountains", "Agadir", "Rabat",
];

const BUDGETS = [
  "Budget (<€500)",
  "Mid-range (€500-1200)",
  "Premium (€1200-2500)",
  "Luxury (€2500+)",
];

const ACCOM = ["Riad", "Hotel", "Guesthouse", "Mixed", "No preference"];

const INTERESTS = ["Desert", "Culture", "Food", "Hiking", "Surf", "Wellness", "Photography", "History"];

function MultiChips({ options, value, onChange }) {
  const set = new Set(value || []);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = set.has(o);
        return (
          <button
            key={o}
            type="button"
            className={`chip ${on ? "chip-active" : "chip-inactive"}`}
            onClick={() => {
              const next = on ? (value || []).filter((x) => x !== o) : [...(value || []), o];
              onChange(next);
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function PlanningPage({
  setPage,
  setSelectedPackage,
  selectedPackage,
  planningPrefill,
  onConsumePlanningPrefill,
}) {
  const toast = useToast();
  const planningAnchorRef = useRef(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPrefillBanner, setAiPrefillBanner] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    group_type: "Solo",
    start_date: "",
    end_date: "",
    group_size: 1,
    cities: [],
    budget_range: BUDGETS[1],
    accommodation_type: "Mixed",
    interests: [],
    special_requests: "",
    package_id: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    packagesApi.list({ limit: 12, offset: 0 })
      .then((res) => {
        if (!mounted) return;
        setPackages(res.packages || []);
      })
      .catch(() => mounted && setPackages([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Prefill when navigating from a package detail.
  useEffect(() => {
    if (!selectedPackage?.id) return;
    setForm((f) => ({
      ...f,
      package_id: selectedPackage.id,
      cities: Array.isArray(selectedPackage.cities) && selectedPackage.cities.length ? selectedPackage.cities : f.cities,
      special_requests: f.special_requests || `Interested in package: ${selectedPackage.title}`,
    }));
  }, [selectedPackage]);

  // Prefill from AI itinerary (“Request this trip”) — cities, wizard fields, and special_requests.
  useEffect(() => {
    if (!planningPrefill) return;
    const hasText = !!planningPrefill.special_requests;
    const hasCities = Array.isArray(planningPrefill.cities) && planningPrefill.cities.length > 0;
    const hasFormBits =
      !!planningPrefill.group_type ||
      !!planningPrefill.budget_range ||
      (Array.isArray(planningPrefill.interests) && planningPrefill.interests.length > 0);
    if (!hasText && !hasCities && !hasFormBits) return;

    setForm((f) => {
      const extra = hasCities ? planningPrefill.cities : [];
      const mergedCities = [...new Set([...(f.cities || []), ...extra])];
      const next = {
        ...f,
        cities: mergedCities,
      };
      if (hasText) next.special_requests = planningPrefill.special_requests;
      if (planningPrefill.group_type) next.group_type = planningPrefill.group_type;
      if (planningPrefill.budget_range && BUDGETS.includes(planningPrefill.budget_range)) {
        next.budget_range = planningPrefill.budget_range;
      }
      if (Array.isArray(planningPrefill.interests) && planningPrefill.interests.length) {
        const add = planningPrefill.interests.filter((x) => INTERESTS.includes(x));
        next.interests = [...new Set([...(f.interests || []), ...add])];
      }
      return next;
    });
    setAiPrefillBanner(true);
    onConsumePlanningPrefill?.();
    requestAnimationFrame(() => {
      planningAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [planningPrefill, onConsumePlanningPrefill]);

  const canSubmit = useMemo(() => {
    return !!form.full_name.trim() && !!form.email.trim() && !!form.start_date;
  }, [form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await packagesApi.request({
        package_id: form.package_id || undefined,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        group_size: form.group_size,
        group_type: form.group_type,
        cities: form.cities,
        budget_range: form.budget_range,
        interests: form.interests,
        accommodation_type: form.accommodation_type,
        special_requests: form.special_requests,
      });
      setSubmitted(true);
    } catch (err) {
      toast(err.message || "Request failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter pt-14 md:pt-0">
      <div className="px-5 md:px-8 lg:px-10 pt-6 pb-4">
        <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "var(--ink)" }}>
          Plan My Trip
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--smoke)" }}>
          Browse packages or request a custom plan.
        </p>
      </div>

      {/* SECTION A — Packages */}
      <section className="px-5 md:px-8 lg:px-10 pb-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
              Curated tours
            </p>
            <h2 className="font-display" style={{ fontSize: "clamp(24px,3.2vw,34px)", fontWeight: 400 }}>
              Browse <em>Packages</em>
            </h2>
          </div>
        </div>

        {!loading && packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--smoke)" }}>No packages yet.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-4">
              {loading
                ? Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : packages.map((p) => (
                    <PackageCard
                      key={p.id}
                      pkg={p}
                      onTap={() => { setSelectedPackage?.(p); setPage("package"); }}
                    />
                  ))}
            </div>
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : packages.map((p) => (
                    <PackageCard
                      key={p.id}
                      pkg={p}
                      onTap={() => { setSelectedPackage?.(p); setPage("package"); }}
                    />
                  ))}
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {loading
                ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : packages.map((p) => (
                    <PackageCard
                      key={p.id}
                      pkg={p}
                      onTap={() => { setSelectedPackage?.(p); setPage("package"); }}
                    />
                  ))}
            </div>
          </>
        )}
      </section>

      {/* SECTION B — Custom Planning */}
      <section
        id="planning-custom-request"
        ref={planningAnchorRef}
        className="px-5 md:px-8 lg:px-10 pb-24 lg:pb-10 scroll-mt-24"
      >
        <div className="rounded-3xl p-6 md:p-10" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
            Custom planning
          </p>
          <h2 className="font-display" style={{ fontSize: "clamp(26px,3.6vw,44px)", fontWeight: 400, color: "var(--ink)" }}>
            Plan Your Custom <em>Journey</em>
          </h2>
          <p className="mt-2" style={{ color: "var(--smoke)", fontSize: 14 }}>
            Tell us your dream trip — we'll craft it for you
          </p>

          {aiPrefillBanner && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm flex justify-between gap-3 items-start"
              style={{ background: "rgba(192,101,74,.1)", border: "1px solid rgba(192,101,74,.28)", color: "var(--ink)" }}
            >
              <span>
                We dropped your <strong>AI itinerary</strong> into special requests and highlighted matching cities. Add your
                travel dates and submit — the team will reply with a real quote.
              </span>
              <button
                type="button"
                onClick={() => setAiPrefillBanner(false)}
                className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ background: "var(--parchment)", color: "var(--smoke)", border: "none", cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-12">
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
                background: "linear-gradient(135deg,var(--sage),var(--gold))",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>
                <div style={{ transform: "scale(1.8)" }}><Ico.Check /></div>
              </div>
              <h2 className="font-display" style={{ fontSize: 28, fontWeight: 400 }}>
                Request <em>Received</em>
              </h2>
              <p style={{ color: "var(--smoke)", marginTop: 8, fontSize: 14 }}>
                Thank you! Our travel experts will contact you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}
              >
                Submit another request
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Full name*</p>
                  <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Email*</p>
                  <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Phone</p>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Group type</p>
                  <select value={form.group_type} onChange={(e) => setForm((f) => ({ ...f, group_type: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none", cursor: "pointer" }}>
                    {["Solo","Couple","Family","Friends","Group","Corporate"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Start date*</p>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>End date*</p>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Group size</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, group_size: Math.max(1, Number(f.group_size || 1) - 1) }))}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 800 }}>−</button>
                  <div className="px-5 py-3 rounded-2xl"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", minWidth: 88, textAlign: "center" }}>
                    {form.group_size}
                  </div>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, group_size: Math.min(30, Number(f.group_size || 1) + 1) }))}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 800 }}>+</button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Cities of interest</p>
                <MultiChips options={CITIES} value={form.cities} onChange={(cities) => setForm((f) => ({ ...f, cities }))} />
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Budget per person</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, budget_range: b }))}
                      className={`chip ${form.budget_range === b ? "chip-active" : "chip-inactive"}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Accommodation preference</p>
                <div className="flex flex-wrap gap-2">
                  {ACCOM.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accommodation_type: a }))}
                      className={`chip ${form.accommodation_type === a ? "chip-active" : "chip-inactive"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Interests</p>
                <MultiChips options={INTERESTS} value={form.interests} onChange={(interests) => setForm((f) => ({ ...f, interests }))} />
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Special requests</p>
                <textarea value={form.special_requests} onChange={(e) => setForm((f) => ({ ...f, special_requests: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl"
                  style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", outline: "none", resize: "vertical" }} />
              </div>

              <button
                type="button"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
                className="w-full px-8 py-4 rounded-2xl font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
                  color: "#fff",
                  border: "none",
                  cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                  opacity: canSubmit && !submitting ? 1 : 0.65,
                  boxShadow: "0 8px 28px rgba(192,101,74,.25)",
                }}
              >
                {submitting ? "Sending…" : "Send Planning Request →"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

