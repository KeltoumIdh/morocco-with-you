import { useEffect, useMemo, useState } from "react";
import ItineraryDay from "../components/ui/ItineraryDay";
import ItineraryRouteMap from "../components/ui/ItineraryRouteMap";
import { Ico } from "../icons";
import { useItinerary } from "../../hooks/useItinerary";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  buildItineraryExportText,
  buildOrderedTripStops,
  buildPlanningPrefillFromItinerary,
  deriveTripDestinations,
  downloadTextFile,
  extractPlannerMetaFromItinerary,
} from "../utils/itineraryHelpers";

export default function ItineraryPage({ setPage, generatedItinerary, onRequestTripQuote, itineraryHydrating }) {
  const toast = useToast();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toggleSave } = useItinerary();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(generatedItinerary?.is_saved ?? false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSaved(generatedItinerary?.is_saved ?? false);
  }, [generatedItinerary?.id, generatedItinerary?.is_saved]);

  const content = generatedItinerary?.content || generatedItinerary;
  const days =
    Array.isArray(content?.days) && content.days.length > 0
      ? content.days.map((d, i) => ({
          day: d.day ?? i + 1,
          items: (d.items || []).map((a) => ({
            time:     a.time     || "Morning",
            activity: a.activity || a.title || String(a),
            duration: a.duration || "2h",
            note:     a.note     || a.description || "",
            location: a.location || "Morocco",
          })),
        }))
      : null;

  const title = content?.title || "Morocco Itinerary";
  const estimatedTotal =
    content?.estimatedTotal ??
    (generatedItinerary?.total_price != null ? Number(generatedItinerary.total_price) : undefined);
  const daysForMap = days ?? [];
  const totalDays = daysForMap.length;
  const totalActivities = daysForMap.reduce((s, d) => s + d.items.length, 0);
  const destinationsLine = useMemo(() => deriveTripDestinations(daysForMap), [daysForMap]);
  const tripStops = useMemo(() => buildOrderedTripStops(daysForMap), [daysForMap]);

  const handleExport = () => {
    if (!days?.length) return;
    setExporting(true);
    try {
      const text = buildItineraryExportText({
        title,
        days,
        estimatedTotal,
        destinationsLine,
      });
      const safe = title.replace(/[^\w\s-]+/g, "").trim().slice(0, 48) || "itinerary";
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`morocco-itinerary-${safe}-${stamp}.txt`, text);
      toast("Itinerary saved as a .txt file (check Downloads).", "success");
    } catch (e) {
      console.error(e);
      toast("Could not export. Try again or use Print from your browser.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleRequestTripQuote = () => {
    if (!days?.length) return;
    const plannerMeta = extractPlannerMetaFromItinerary(generatedItinerary, content);
    const prefill = buildPlanningPrefillFromItinerary({
      title,
      days,
      totalDays,
      destinationsLine,
      estimatedTotal,
      plannerMeta,
    });
    if (onRequestTripQuote) {
      onRequestTripQuote(prefill);
      return;
    }
    setPage("planning");
  };

  const handleSave = async () => {
    if (!isAuthenticated) { setPage("login"); return; }
    if (!generatedItinerary?.id) return;
    setSaving(true);
    try {
      await toggleSave(generatedItinerary.id);
      setSaved((s) => !s);
    } finally {
      setSaving(false);
    }
  };

  if (itineraryHydrating) {
    return (
      <div className="page-enter pt-14 md:pt-0 pb-24 flex flex-col items-center justify-center min-h-[55vh] px-6">
        <div className="w-10 h-10 rounded-2xl border-2 border-[var(--clay)] border-t-[var(--terracotta)] animate-spin mb-4" />
        <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>Loading your latest trip…</p>
        <p className="text-xs mt-2 text-center max-w-sm" style={{ color: "var(--smoke)" }}>
          Fetching your most recent AI itinerary from your account.
        </p>
      </div>
    );
  }

  if (!days) {
    return (
      <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10 px-5 md:px-8 lg:px-10 py-10 max-w-lg mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
          Itineraries
        </p>
        <h1 className="font-display mb-3" style={{ fontSize: "clamp(26px,4vw,34px)", fontWeight: 400, color: "var(--ink)" }}>
          No trip <em>on screen</em>
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--smoke)", lineHeight: 1.6 }}>
          Nothing loaded yet. Use the <strong style={{ color: "var(--ink)" }}>AI Trip Planner</strong> to create a plan — it will
          appear here and stay after refresh while you are signed in.
        </p>
        <button
          type="button"
          onClick={() => setPage("ai")}
          className="w-full max-w-xs py-4 rounded-2xl font-semibold text-sm mx-auto"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)" }}
        >
          <span className="inline-flex items-center gap-2 justify-center"><Ico.Sparkle /> AI Trip Planner</span>
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-0">
      <div className="lg:grid lg:grid-cols-3 min-h-screen">
        {/* Main content */}
        <div className="lg:col-span-2 px-5 md:px-8 lg:px-10 py-8 lg:overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>Your journey</p>
              <h1 className="font-display" style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 400, color: "var(--ink)" }}>
                {title.includes("Morocco") ? <>{title.replace("Morocco", "").trim() || "Morocco"} <em>Itinerary</em></> : <em>{title}</em>}
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap itinerary-no-print">
              {generatedItinerary?.id && isAuthenticated && (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: saved ? "rgba(192,101,74,.1)" : "var(--light-clay)", color: saved ? "var(--terracotta)" : "var(--ink)", border: saved ? "1.5px solid var(--terracotta)" : "1.5px solid var(--clay)", cursor: "pointer" }}>
                  <Ico.Heart f={saved} />{saving ? "Saving…" : saved ? "Saved" : "Save"}
                </button>
              )}
              <button onClick={() => setPage("ai")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>
                <Ico.Sparkle /> Regenerate
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: exporting ? "wait" : "pointer" }}>
                <Ico.Print /> {exporting ? "Export…" : "Export"}
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-8 mt-4">
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--smoke)" }}><Ico.Cal />{totalDays} days</span>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--smoke)" }}><Ico.Clock />{totalActivities} activities</span>
            {estimatedTotal && <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--smoke)" }}>✦ Est. €{estimatedTotal}</span>}
          </div>

          <p className="text-sm mb-4" style={{ color: "var(--smoke)" }}>
            This is an <strong style={{ color: "var(--ink)" }}>AI draft</strong> for inspiration. To pay for something concrete, book a listed experience or ask
            the team to turn this route into a quote.
          </p>

          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--terracotta)", letterSpacing: ".1em" }}>
              Route map
            </p>
            <ItineraryRouteMap stops={tripStops} />
          </div>

          {days.map((d, idx) => (
            <ItineraryDay key={`day-${d.day}-${idx}`} day={d.day} items={d.items} />
          ))}

        </div>

        {/* Sticky booking summary (desktop) */}
        <div className="hidden lg:block lg:col-span-1 border-l" style={{ borderColor: "var(--light-clay)" }}>
          <div className="sticky top-0 p-8">
            <div className="rounded-3xl p-6" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
              <h3 className="font-display mb-4" style={{ fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>Trip <em>Summary</em></h3>
              <div className="space-y-3 mb-6">
                {[
                  { label: "Duration",     value: `${totalDays} days` },
                  { label: "Activities",   value: `${totalActivities} planned` },
                  { label: "Destinations", value: destinationsLine },
                  { label: "Est. Budget",  value: estimatedTotal ? `€${estimatedTotal}` : "€850–€1,200" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span style={{ color: "var(--smoke)" }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--smoke)" }}>
                Instant checkout only applies to fixed listings. Use the button below for a tailored price from the team.
              </p>
              <button
                type="button"
                onClick={handleRequestTripQuote}
                className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)" }}>
                Request this trip <Ico.Arrow />
              </button>
              <button
                type="button"
                onClick={() => setPage("explore")}
                className="w-full mt-3 py-3 rounded-2xl text-sm font-medium"
                style={{ background: "var(--light-clay)", color: "var(--ink)", border: "1.5px solid var(--clay)", cursor: "pointer" }}>
                Book a listed experience
              </button>
              <button onClick={() => setPage("ai")}
                className="w-full mt-3 py-3 rounded-2xl text-sm font-medium"
                style={{ background: "transparent", color: "var(--smoke)", border: "1.5px solid var(--clay)", cursor: "pointer" }}>
                Modify Preferences
              </button>
            </div>

            <div className="mt-5 rounded-2xl p-5" style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--gold)", letterSpacing: ".1em" }}>Travel Tips</p>
              <ul className="space-y-2">
                {["Best visited March–May", "Dress modestly in medinas", "Bargain in souks — it's expected", "Learn a few words of Darija"].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs" style={{ color: "var(--smoke)" }}>
                    <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }}>✦</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div
        className="lg:hidden fixed bottom-16 left-0 right-0 px-5 pb-4 pt-2 itinerary-no-print space-y-2"
        style={{ background: "linear-gradient(to top,var(--parchment) 70%,transparent)" }}>
        <button
          type="button"
          onClick={handleRequestTripQuote}
          className="w-full py-4 rounded-2xl font-semibold text-sm"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)" }}>
          Request this trip
        </button>
        <button
          type="button"
          onClick={() => setPage("explore")}
          className="w-full py-3 rounded-2xl text-sm font-medium"
          style={{ background: "var(--light-clay)", color: "var(--ink)", border: "1.5px solid var(--clay)", cursor: "pointer" }}>
          Book a listed experience
        </button>
      </div>
    </div>
  );
}
