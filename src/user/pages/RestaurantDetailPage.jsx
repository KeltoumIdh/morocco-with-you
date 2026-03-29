import { useEffect, useMemo, useState } from "react";
import { Ico, MoroccoMotif } from "../icons";
import { useToast } from "../../context/ToastContext";
import CardSkeleton from "../components/ui/CardSkeleton";

function heroUrl(r) {
  const urls = r?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

export default function RestaurantDetailPage({ restaurant, setPage, setSelectedRestaurant }) {
  const toast = useToast();
  const [loading, setLoading] = useState(!restaurant?.id);
  const [data, setData] = useState(restaurant || null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [covers, setCovers] = useState(2);

  useEffect(() => {
    if (restaurant?.id) { setData(restaurant); setLoading(false); return; }
    setLoading(false);
  }, [restaurant]);

  const img = heroUrl(data);
  const features = useMemo(() => ([
    { key: "terrace", on: !!data?.has_terrace, label: "Terrace" },
    { key: "wifi", on: !!data?.has_wifi, label: "Wi‑Fi" },
    { key: "res", on: !!data?.reservations, label: "Reservations" },
  ]), [data]);

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
        <p className="font-display text-2xl" style={{ color: "var(--smoke)" }}>Restaurant not found</p>
        <button onClick={() => setPage("restaurants")} className="mt-4 px-6 py-3 rounded-2xl"
          style={{ background: "var(--light-clay)", border: "none", cursor: "pointer" }}>
          Back to Restaurants
        </button>
      </div>
    );
  }

  const reserveLink = data.website || (data.phone ? `tel:${data.phone}` : null);

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10">
      <div className="relative overflow-hidden" style={{ height: "55vw", maxHeight: 420, background: data.gradient || "linear-gradient(135deg,#C0654A,#1A1410)" }}>
        <MoroccoMotif />
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.78) 0%,rgba(26,20,16,.12) 55%,transparent 100%)" }} />
        <div className="absolute bottom-5 left-5 right-5 md:left-8 md:right-8 lg:left-10 lg:right-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(212,168,83,.85)", letterSpacing: ".12em" }}>
            Restaurant
          </p>
          <h1 className="font-display text-white" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 400, lineHeight: 1.05 }}>
            {data.name}
          </h1>
          <p className="mt-2" style={{ color: "rgba(255,255,255,.65)", fontSize: 14 }}>
            {data.cuisine ? `${data.cuisine} · ` : ""}{data.location}
          </p>
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 pt-5">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { setSelectedRestaurant?.(null); setPage("restaurants"); }}
            className="chip chip-inactive" style={{ cursor: "pointer" }}>
            ← Back
          </button>
          <div className="flex gap-2">
            <button className="chip chip-inactive" onClick={() => toast("Saved", "success")}>Save ♥</button>
            <button className="chip chip-inactive" onClick={() => toast("Link copied", "success")}>Share</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {data.price_range && <span className="chip chip-active" style={{ color: "var(--gold)" }}>{data.price_range}</span>}
          {features.filter((f) => f.on).map((f) => <span key={f.key} className="chip chip-inactive">{f.label}</span>)}
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 400 }}>About</h2>
            <p className="mt-3" style={{ color: "var(--smoke)", fontSize: 14, lineHeight: 1.7 }}>
              {data.description || "A standout table with flavors that feel unmistakably Moroccan."}
            </p>
          </div>

          <div className="rounded-3xl p-6" style={{ background: "linear-gradient(135deg,var(--light-clay),var(--sand))", border: "1px solid var(--clay)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>Map</p>
            <div className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg,rgba(192,101,74,.15),rgba(212,168,83,.10))", border: "1px solid rgba(232,196,160,.7)" }}>
              <p style={{ color: "var(--smoke)", fontSize: 14 }}>View on Maps</p>
              <button className="chip chip-active" onClick={() => toast("Coming soon", "info")}>Open</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-3xl p-6 lg:sticky" style={{ top: 18, background: "var(--parchment)", border: "1px solid var(--clay)", boxShadow: "0 10px 30px rgba(26,20,16,.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
              Reserve
            </p>
            <p className="font-display" style={{ fontSize: 24, fontWeight: 400 }}>
              Pick a <em>time</em>
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Date</p>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Time</p>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl"
                    style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", outline: "none" }} />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Covers</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setCovers((c) => Math.max(1, c - 1))}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 800 }}>−</button>
                  <div className="px-5 py-3 rounded-2xl"
                    style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", minWidth: 64, textAlign: "center" }}>
                    {covers}
                  </div>
                  <button type="button" onClick={() => setCovers((c) => Math.min(30, c + 1))}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--ink)", fontWeight: 800 }}>+</button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!reserveLink) { toast("Contact details not available", "warning"); return; }
                  window.open(reserveLink, "_blank");
                }}
                className="w-full px-8 py-4 rounded-2xl font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 28px rgba(192,101,74,.25)",
                }}
              >
                Reserve a table
              </button>
              <p className="text-xs" style={{ color: "var(--smoke)" }}>
                We'll redirect to phone/website if available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

