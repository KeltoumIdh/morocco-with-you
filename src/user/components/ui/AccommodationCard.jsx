import { useMemo, useState } from "react";
import { Ico } from "../../icons";

function coverUrl(a) {
  const urls = a?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

const StarRating = ({ count = 0 }) => (
  <div className="flex gap-0.5" style={{ color: "var(--gold)" }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Ico.Star key={i} f={i < (Number(count) || 0)} />
    ))}
  </div>
);

export default function AccommodationCard({ accommodation, onTap }) {
  const [liked, setLiked] = useState(false);
  const img = coverUrl(accommodation);
  const amenities = useMemo(() => (Array.isArray(accommodation?.amenities) ? accommodation.amenities.slice(0, 3) : []), [accommodation]);
  const priceFrom = accommodation?.price_from;
  const type = accommodation?.type || "";

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
          <div className="img-bg absolute inset-0 w-full h-full" style={{ background: accommodation?.gradient || "linear-gradient(145deg,#D4A853,#8B5E3C)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.62) 0%,transparent 55%)" }} />

        {type && (
          <div className="absolute top-3 left-3">
            <span className="chip" style={{ background: "rgba(212,168,83,.22)", borderColor: "rgba(212,168,83,.35)", color: "var(--gold)" }}>
              {type}
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
            {accommodation?.name}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1" style={{ color: "var(--smoke)" }}>
            <Ico.Pin /><span style={{ fontSize: 13 }}>{accommodation?.city || accommodation?.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating count={accommodation?.stars || 0} />
            <span style={{ fontSize: 12, color: "var(--smoke)" }}>{Number(accommodation?.rating || 0).toFixed(1)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {amenities.map((a) => (
              <span key={a} className="chip chip-inactive" style={{ fontSize: 11 }}>
                {a}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--terracotta)" }}>
            {priceFrom != null ? `From €${Number(priceFrom).toFixed(0)}/night` : "Price on request"}
          </span>
        </div>
      </div>
    </div>
  );
}

