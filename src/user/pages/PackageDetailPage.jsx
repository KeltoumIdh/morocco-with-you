import { useEffect, useMemo, useState } from "react";
import { Ico, MoroccoMotif } from "../icons";
import { useToast } from "../../context/ToastContext";
import CardSkeleton from "../components/ui/CardSkeleton";
import { packagesApi } from "../../lib/api";

function heroUrl(p) {
  const urls = p?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

export default function PackageDetailPage({ pkg, setPage, setSelectedPackage }) {
  const toast = useToast();
  const [loading, setLoading] = useState(!pkg?.id);
  const [data, setData] = useState(pkg || null);
  const [startDate, setStartDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pkg?.id) { setData(pkg); setLoading(false); return; }
    setLoading(false);
  }, [pkg]);

  const img = heroUrl(data);
  const highlights = useMemo(() => (Array.isArray(data?.highlights) ? data.highlights : []), [data]);
  const included = useMemo(() => (Array.isArray(data?.included) ? data.included : []), [data]);
  const notIncluded = useMemo(() => (Array.isArray(data?.not_included) ? data.not_included : []), [data]);
  const cities = useMemo(() => (Array.isArray(data?.cities) ? data.cities.join(" • ") : ""), [data]);

  const canBook = !!startDate && !submitting;

  const handleRequestThisPackage = async () => {
    if (!data?.id) return;
    if (!startDate) { toast("Please select a start date", "warning"); return; }
    setSubmitting(true);
    try {
      await packagesApi.request({
        package_id: data.id,
        full_name: "",
        email: "",
        phone: "",
        start_date: startDate,
        end_date: "",
        group_size: guests,
        group_type: "Group",
        cities: Array.isArray(data.cities) ? data.cities : [],
        budget_range: "",
        interests: [],
        accommodation_type: "",
        special_requests: notes || `Requesting package: ${data.title}`,
      });
      toast("Request received ✓", "success");
      // Route to planning page so the user can submit full details if needed
      setPage("planning");
    } catch (e) {
      toast(e.message || "Request failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-enter pt-14 md:pt-0 px-5 md:px-8 lg:px-10 py-6">
        <CardSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-enter pt-14 md:pt-0 px-5 md:px-8 lg:px-10 py-10">
        <p className="font-display text-2xl" style={{ color: "var(--smoke)" }}>Package not found</p>
        <button onClick={() => setPage("planning")} className="mt-4 px-6 py-3 rounded-2xl"
          style={{ background: "var(--light-clay)", border: "none", cursor: "pointer" }}>
          Back to Planning
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10">
      <div className="relative overflow-hidden" style={{ height: "55vw", maxHeight: 420, background: data.gradient || "linear-gradient(135deg,#6B8CAE,#1A2C38)" }}>
        <MoroccoMotif />
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.78) 0%,rgba(26,20,16,.12) 55%,transparent 100%)" }} />
        <div className="absolute bottom-5 left-5 right-5 md:left-8 md:right-8 lg:left-10 lg:right-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(212,168,83,.85)", letterSpacing: ".12em" }}>
            Package
          </p>
          <h1 className="font-display text-white" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 400, lineHeight: 1.05 }}>
            {data.title}
          </h1>
          <p className="mt-2" style={{ color: "rgba(255,255,255,.65)", fontSize: 14 }}>
            {data.subtitle || cities || "Morocco"}
          </p>
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 pt-5">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { setSelectedPackage?.(null); setPage("planning"); }}
            className="chip chip-inactive" style={{ cursor: "pointer" }}>
            ← Back
          </button>
          <div className="flex gap-2">
            <button className="chip chip-inactive" onClick={() => toast("Saved", "success")}>Save ♥</button>
            <button className="chip chip-inactive" onClick={() => toast("Link copied", "success")}>Share</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="chip chip-active">{Number(data.duration_days || 0)} Days</span>
          {data.difficulty && <span className="chip chip-inactive" style={{ textTransform: "capitalize" }}>{data.difficulty}</span>}
          <span className="chip chip-inactive"><Ico.Pin /> {cities || "Morocco"}</span>
          <span className="chip chip-active">From €{Number(data.price_from || 0).toFixed(0)}/person</span>
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 400 }}>Overview</h2>
            <p className="mt-3" style={{ color: "var(--smoke)", fontSize: 14, lineHeight: 1.7 }}>
              {data.description || "A multi-day journey crafted for comfort, discovery, and authenticity."}
            </p>
          </div>

          {highlights.length > 0 && (
            <div>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 400 }}>Highlights</h3>
              <div className="mt-3 space-y-2">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ color: "var(--sage)", marginTop: 2 }}><Ico.Check /></span>
                    <span style={{ fontSize: 13, color: "var(--smoke)" }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(included.length || notIncluded.length) ? (
            <div className="grid md:grid-cols-2 gap-5">
              {included.length > 0 && (
                <div className="rounded-3xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--sage)", letterSpacing: ".12em" }}>Included</p>
                  <div className="mt-3 space-y-2">
                    {included.map((x, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: "var(--sage)", marginTop: 2 }}><Ico.Check /></span>
                        <span style={{ fontSize: 13, color: "var(--smoke)" }}>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {notIncluded.length > 0 && (
                <div className="rounded-3xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>Not included</p>
                  <div className="mt-3 space-y-2">
                    {notIncluded.map((x, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: "var(--terracotta)", marginTop: 2 }}><Ico.X /></span>
                        <span style={{ fontSize: 13, color: "var(--smoke)" }}>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-3xl p-6" style={{ background: "linear-gradient(135deg,var(--light-clay),var(--sand))", border: "1px solid var(--clay)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>Itinerary</p>
            <p style={{ color: "var(--smoke)", fontSize: 13 }}>
              Full itinerary is available in the package details JSON.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-3xl p-6 lg:sticky" style={{ top: 18, background: "var(--parchment)", border: "1px solid var(--clay)", boxShadow: "0 10px 30px rgba(26,20,16,.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
              Request
            </p>
            <p className="font-display" style={{ fontSize: 24, fontWeight: 400 }}>
              Start <em>date</em>
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Start date</p>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl"
                  style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", outline: "none" }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Guests</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 800 }}>−</button>
                  <div className="px-5 py-3 rounded-2xl"
                    style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", minWidth: 64, textAlign: "center" }}>
                    {guests}
                  </div>
                  <button type="button" onClick={() => setGuests((g) => Math.min(30, g + 1))}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 800 }}>+</button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Special requests</p>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl"
                  style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", outline: "none", resize: "vertical" }} />
              </div>

              <button
                type="button"
                disabled={!canBook}
                onClick={handleRequestThisPackage}
                className="w-full px-8 py-4 rounded-2xl font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
                  color: "#fff",
                  border: "none",
                  cursor: canBook ? "pointer" : "not-allowed",
                  opacity: canBook ? 1 : 0.65,
                  boxShadow: "0 8px 28px rgba(192,101,74,.25)",
                }}
              >
                {submitting ? "Requesting…" : "Request This Package"}
              </button>
              <button
                type="button"
                onClick={() => setPage("planning")}
                className="w-full px-8 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}
              >
                Or submit custom request
              </button>
              <p className="text-xs" style={{ color: "var(--smoke)" }}>
                We’ll confirm details and send a quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

