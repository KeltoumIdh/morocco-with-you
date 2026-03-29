import { useState } from "react";
import { Ico } from "../../icons";

function coverUrl(exp) {
  const u = exp?.image_url;
  if (u == null || String(u).trim() === "") return null;
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return null;
}

export default function ExperienceCard({ exp, onTap, compact = false }) {
  const [liked, setLiked] = useState(false);
  const img = coverUrl(exp);

  const formatPrice = (price) => {
    const n =
      typeof price === "number"
        ? price
        : Number(String(price ?? "").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(n)) return "€—";
    return `€${n.toFixed(0)}`;
  };

  if (compact) {
    return (
      <div
        onClick={onTap}
        className="card-lift tap-ripple snap-s cursor-pointer flex-shrink-0 rounded-2xl overflow-hidden"
        style={{ width: 200 }}
      >
        <div className="img-zoom rounded-2xl overflow-hidden relative" style={{ height: 140 }}>
          {img ? (
            <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="img-bg absolute inset-0 w-full h-full" style={{ background: exp.gradient }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.7) 0%,transparent 55%)" }} />
          {exp.semanticMatchPct ? (
            <span
              className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(212,168,83,.95)", color: "var(--ink)" }}
            >
              {exp.semanticMatchPct}
            </span>
          ) : null}
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className="absolute top-2.5 right-2.5 flex"
            style={{ color: liked ? "var(--terracotta)" : "rgba(255,255,255,.85)", background: "none", border: "none", cursor: "pointer" }}
          >
            <Ico.Heart f={liked} />
          </button>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="font-display text-white" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{exp.title}</p>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: 11, marginTop: 2, textTransform: "capitalize" }}>{exp.location}</p>
          </div>
        </div>
        <div className="pt-2.5 px-0.5 flex justify-between items-center">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--terracotta)" }}>{formatPrice(exp.price)}</span>
          <div className="flex items-center gap-1" style={{ color: "var(--gold)" }}>
            <Ico.Star f /><span style={{ fontSize: 12, color: "var(--smoke)" }}>{exp.rating}</span>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="img-bg absolute inset-0 w-full h-full" style={{ background: exp.gradient }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.65) 0%,transparent 55%)" }} />
        <div className="exp-overlay absolute inset-0 flex items-center justify-center" style={{ background: "rgba(26,20,16,.35)" }}>
          <span className="font-display text-white text-lg italic">View Experience →</span>
        </div>
        {exp.semanticMatchPct ? (
          <span
            className="absolute top-3.5 left-3.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: "rgba(212,168,83,.95)", color: "var(--ink)", boxShadow: "0 2px 8px rgba(0,0,0,.12)" }}
          >
            {exp.semanticMatchPct} match
          </span>
        ) : null}
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
          <div className="flex gap-1.5 mb-1.5">
            {(exp.tags || []).map((t) => (
              <span key={t} style={{ fontSize: 9, letterSpacing: ".09em", textTransform: "uppercase", background: "rgba(212,168,83,.92)", color: "var(--ink)", padding: "3px 8px", borderRadius: 100, fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>
          <h3 className="font-display text-white" style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.2 }}>{exp.title}</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1" style={{ color: "var(--smoke)" }}>
            <Ico.Pin /><span style={{ fontSize: 13, textTransform: "capitalize" }}>{exp.location}</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--gold)" }}>
            <Ico.Star f />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{exp.rating}</span>
            <span style={{ fontSize: 12, color: "var(--smoke)" }}>({exp.reviews})</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-3" style={{ color: "var(--smoke)" }}>
            <span className="flex items-center gap-1 text-xs"><Ico.Clock />{exp.duration}</span>
            <span className="flex items-center gap-1 text-xs"><Ico.Users />Max {exp.maxGroup}</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--terracotta)" }}>{formatPrice(exp.price)}</span>
        </div>
      </div>
    </div>
  );
}
