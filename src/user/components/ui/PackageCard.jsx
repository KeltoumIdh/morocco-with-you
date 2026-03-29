import { useMemo, useState } from "react";
import { Ico } from "../../icons";

function coverUrl(p) {
  const urls = p?.image_urls;
  const u = Array.isArray(urls) ? urls.find((x) => /^https?:\/\//i.test(String(x || "").trim())) : null;
  return u ? String(u).trim() : null;
}

function difficultyColor(difficulty) {
  switch (String(difficulty || "").toLowerCase()) {
    case "challenging":
      return { bg: "rgba(192,101,74,.18)", border: "rgba(192,101,74,.35)", fg: "var(--terracotta)" };
    case "moderate":
      return { bg: "rgba(212,168,83,.18)", border: "rgba(212,168,83,.35)", fg: "var(--gold)" };
    default:
      return { bg: "rgba(122,140,110,.16)", border: "rgba(122,140,110,.35)", fg: "var(--sage)" };
  }
}

export default function PackageCard({ pkg, onTap }) {
  const [liked, setLiked] = useState(false);
  const img = coverUrl(pkg);
  const highlights = useMemo(() => (Array.isArray(pkg?.highlights) ? pkg.highlights.slice(0, 3) : []), [pkg]);
  const cities = useMemo(() => (Array.isArray(pkg?.cities) ? pkg.cities.join(" • ") : ""), [pkg]);
  const diff = difficultyColor(pkg?.difficulty);

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
          <div className="img-bg absolute inset-0 w-full h-full" style={{ background: pkg?.gradient || "linear-gradient(135deg,#6B8CAE,#1A2C38)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.62) 0%,transparent 55%)" }} />

        <div className="absolute top-3 left-3 flex gap-2">
          <span className="chip" style={{ background: "rgba(212,168,83,.18)", borderColor: "rgba(212,168,83,.35)", color: "var(--gold)" }}>
            {Number(pkg?.duration_days || 0) || 0} Days
          </span>
          <span className="chip" style={{ background: diff.bg, borderColor: diff.border, color: diff.fg, textTransform: "capitalize" }}>
            {String(pkg?.difficulty || "easy")}
          </span>
        </div>

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
            {pkg?.title}
          </h3>
          {pkg?.subtitle && (
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: 12, marginTop: 2 }}>
              {pkg.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1" style={{ color: "var(--smoke)" }}>
            <Ico.Pin /><span style={{ fontSize: 13 }}>{cities || "Morocco"}</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--terracotta)" }}>
            From €{Number(pkg?.price_from || 0).toFixed(0)}<span style={{ fontSize: 12, fontWeight: 600, color: "var(--smoke)" }}>/person</span>
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="mt-2 space-y-1">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: "var(--sage)", marginTop: 2 }}><Ico.Check /></span>
                <span style={{ fontSize: 12, color: "var(--smoke)", lineHeight: 1.35 }}>{h}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <span className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>
            View Package →
          </span>
        </div>
      </div>
    </div>
  );
}

