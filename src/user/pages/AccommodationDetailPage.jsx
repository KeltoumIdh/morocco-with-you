import { useEffect, useMemo, useState } from "react";
import { accommodationsApi } from "../../lib/api";
import { Ico, MoroccoMotif } from "../icons";
import { useToast } from "../../context/ToastContext";
import CardSkeleton from "../components/ui/CardSkeleton";

function heroUrl(a) {
  const urls = a?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

export default function AccommodationDetailPage({ accommodation, setPage, setSelectedAccommodation }) {
  const toast = useToast();
  const [loading, setLoading] = useState(!accommodation?.id);
  const [data, setData] = useState(accommodation || null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    if (accommodation?.id) { setData(accommodation); setLoading(false); return; }
    setLoading(false);
  }, [accommodation]);

  const img = heroUrl(data);
  const amenities = useMemo(() => (Array.isArray(data?.amenities) ? data.amenities : []), [data]);

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
        <p className="font-display text-2xl" style={{ color: "var(--smoke)" }}>Accommodation not found</p>
        <button onClick={() => setPage("accommodations")} className="mt-4 px-6 py-3 rounded-2xl"
          style={{ background: "var(--light-clay)", border: "none", cursor: "pointer" }}>
          Back to Hébergement
        </button>
      </div>
    );
  }

  const bookingUrl = data.booking_url || data.website;

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10">
      <div className="relative overflow-hidden" style={{ height: "55vw", maxHeight: 420, background: data.gradient || "linear-gradient(145deg,#D4A853,#8B5E3C)" }}>
        <MoroccoMotif />
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.78) 0%,rgba(26,20,16,.12) 55%,transparent 100%)" }} />
        <div className="absolute bottom-5 left-5 right-5 md:left-8 md:right-8 lg:left-10 lg:right-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(212,168,83,.85)", letterSpacing: ".12em" }}>
            Hébergement
          </p>
          <h1 className="font-display text-white" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 400, lineHeight: 1.05 }}>
            {data.name}
          </h1>
          <p className="mt-2" style={{ color: "rgba(255,255,255,.65)", fontSize: 14 }}>
            {data.type ? `${data.type} · ` : ""}{data.location}
          </p>
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 pt-5">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { setSelectedAccommodation?.(null); setPage("accommodations"); }}
            className="chip chip-inactive" style={{ cursor: "pointer" }}>
            ← Back
          </button>
          <div className="flex gap-2">
            <button className="chip chip-inactive" onClick={() => toast("Saved", "success")}>Save ♥</button>
            <button className="chip chip-inactive" onClick={() => toast("Link copied", "success")}>Share</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {data.type && <span className="chip chip-inactive">{data.type}</span>}
          {data.stars && <span className="chip chip-inactive">{data.stars}★</span>}
          {data.price_from != null && <span className="chip chip-active">From €{Number(data.price_from).toFixed(0)}/night</span>}
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 400 }}>About</h2>
            <p className="mt-3" style={{ color: "var(--smoke)", fontSize: 14, lineHeight: 1.7 }}>
              {data.description || "A beautiful place to stay — handpicked for comfort and character."}
            </p>
          </div>

          {amenities.length > 0 && (
            <div>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 400 }}>Amenities</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="chip chip-inactive">{a}</span>
                ))}
              </div>
            </div>
          )}

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
              Availability
            </p>
            <p className="font-display" style={{ fontSize: 24, fontWeight: 400 }}>
              Check <em>dates</em>
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Check-in</p>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl"
                  style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", outline: "none" }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--smoke)" }}>Check-out</p>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
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

              <button
                type="button"
                onClick={() => {
                  if (bookingUrl) window.open(bookingUrl, "_blank");
                  else toast("Contact details not available", "warning");
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
                Check Availability
              </button>
              <p className="text-xs" style={{ color: "var(--smoke)" }}>
                We'll redirect you to the official booking link when available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

