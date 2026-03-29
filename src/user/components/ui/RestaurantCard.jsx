import { useMemo, useState } from "react";
import { Ico } from "../../icons";

function coverUrl(r) {
  const urls = r?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

const PriceRange = ({ range }) => (
  <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: 13 }}>
    {range || "—"}
  </span>
);

function IconPill({ on, label }) {
  return (
    <span
      className="chip"
      style={{
        background: on ? "rgba(122,140,110,.14)" : "rgba(232,196,160,.18)",
        borderColor: on ? "rgba(122,140,110,.35)" : "rgba(232,196,160,.35)",
        color: on ? "var(--sage)" : "var(--smoke)",
        fontSize: 11,
      }}
    >
      {label}
    </span>
  );
}

export default function RestaurantCard({ restaurant, onTap }) {
  const [liked, setLiked] = useState(false);
  const img = coverUrl(restaurant);
  const meta = useMemo(() => ([
    { key: "terrace", on: !!restaurant?.has_terrace, label: "Terrace" },
    { key: "wifi", on: !!restaurant?.has_wifi, label: "Wi‑Fi" },
    { key: "res", on: !!restaurant?.reservations, label: "Reservations" },
  ]), [restaurant]);

  return (
    <div
      onClick={onTap}
      className="card-lift tap-ripple cursor-pointer rounded-2xl overflow-hidden"
      style={{ background: "var(--parchment)", boxShadow: "0 4px 24px rgba(26,20,16,.08)" }}
    >
      <div className="img-zoom relative overflow-hidden" style={{ height: 220 }}>
        {img ? (
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="img-bg absolute inset-0 w-full h-full" style={{ background: restaurant?.gradient || "linear-gradient(135deg,#C0654A,#1A1410)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.62) 0%,transparent 55%)" }} />

        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-3.5 right-3.5 flex"
          style={{
            color: liked ? "var(--terracotta)" : "rgba(255,255,255,.9)",
            background: "rgba(250,246,238,.18)", backdropFilter: "blur(8px)",
            borderRadius: "50%", padding: 8, border: "none", cursor: "pointer",
          }}
        >
          <Ico.Heart f={liked} />
        </button>

        <div className="absolute bottom-3.5 left-4 right-4">
          <h3 className="font-display text-white" style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.2 }}>
            {restaurant?.name}
          </h3>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 12, marginTop: 2 }}>
            {restaurant?.cuisine || restaurant?.city || restaurant?.location}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1" style={{ color: "var(--smoke)" }}>
            <Ico.Pin /><span style={{ fontSize: 13 }}>{restaurant?.city || restaurant?.location}</span>
          </div>
          <PriceRange range={restaurant?.price_range} />
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {meta.map((m) => <IconPill key={m.key} on={m.on} label={m.label} />)}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1" style={{ color: "var(--gold)" }}>
            <Ico.Star f />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{Number(restaurant?.rating || 0).toFixed(1)}</span>
            <span style={{ fontSize: 12, color: "var(--smoke)" }}>({restaurant?.review_count || 0})</span>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>
            Reserve →
          </span>
        </div>
      </div>
    </div>
  );
}

