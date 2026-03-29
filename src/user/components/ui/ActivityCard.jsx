import { useMemo, useState } from "react";
import { Ico } from "../../icons";

function coverUrl(a) {
  const urls = a?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

function formatPrice(price, price_type) {
  if (price_type === "free") return "Free";
  if (price_type === "on_request") return "On Request";
  const n = typeof price === "number" ? price : Number(String(price ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return "€—";
  return `€${n.toFixed(0)}`;
}

export default function ActivityCard({ activity, onTap }) {
  const [liked, setLiked] = useState(false);
  const img = coverUrl(activity);
  const category = activity?.category || "";
  const duration = activity?.duration || "";
  const minAge = Number(activity?.min_age || 0);

  const meta = useMemo(() => {
    const parts = [];
    if (duration) parts.push({ icon: <Ico.Clock />, text: duration });
    if (minAge > 0) parts.push({ icon: null, text: `Age ${minAge}+` });
    return parts;
  }, [duration, minAge]);

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
          <div className="img-bg absolute inset-0 w-full h-full" style={{ background: activity?.gradient || "linear-gradient(135deg,#7A8C6E,#2C3828)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.65) 0%,transparent 55%)" }} />

        {category && (
          <div className="absolute top-3 left-3">
            <span style={{ fontSize: 9, letterSpacing: ".09em", textTransform: "uppercase", background: "rgba(212,168,83,.92)", color: "var(--ink)", padding: "3px 8px", borderRadius: 100, fontWeight: 700 }}>
              {category}
            </span>
          </div>
        )}

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
            {activity?.title}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1" style={{ color: "var(--smoke)" }}>
            <Ico.Pin /><span style={{ fontSize: 13, textTransform: "capitalize" }}>{activity?.location}</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--gold)" }}>
            <Ico.Star f />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{Number(activity?.rating || 0).toFixed(1)}</span>
            <span style={{ fontSize: 12, color: "var(--smoke)" }}>({activity?.review_count || 0})</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-3 flex-wrap" style={{ color: "var(--smoke)" }}>
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1 text-xs">
                {m.icon}{m.text}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--terracotta)" }}>
            {formatPrice(activity?.price, activity?.price_type)}
          </span>
        </div>
      </div>
    </div>
  );
}

