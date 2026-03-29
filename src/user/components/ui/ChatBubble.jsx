import { useState } from "react";
import { catalogueCtaLabel, dedupeRetrievedItems } from "../../utils/retrievedItems";

function typeEmoji(itemType) {
  switch (itemType) {
    case "activity":
      return "🏄";
    case "accommodation":
      return "🏡";
    case "restaurant":
      return "🍽";
    case "package":
      return "🗺";
    case "group_trip":
      return "🚌";
    case "provider":
      return "🏢";
    case "experience":
      return "⭐";
    default:
      return "✦";
  }
}

function shortTitle(s, max = 24) {
  const t = String(s || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, Math.max(1, max - 1)).trimEnd() + "…";
}

function similarityNumber(item) {
  const n = Number(item?.similarity);
  return Number.isFinite(n) ? n : -1;
}

/**
 * Sometimes the vector search can return different rows with the same title.
 * For chat UI we collapse those duplicates by (item_type + normalized title),
 * keeping the highest-similarity result.
 */
function dedupeByTypeAndTitle(items) {
  const map = new Map();
  for (const it of items || []) {
    const t = String(it?.title || "").trim().toLowerCase();
    const baseKey =
      it?.item_type && t ? `${it.item_type}-${t}` : `${it?.item_type || ""}-${it?.item_id || ""}`;
    const prev = map.get(baseKey);
    if (!prev) {
      map.set(baseKey, it);
      continue;
    }
    if (similarityNumber(it) > similarityNumber(prev)) {
      map.set(baseKey, it);
    }
  }
  return [...map.values()];
}

export default function ChatBubble({ msg, isTyping, onOpenCatalogueItem }) {
  if (isTyping) {
    return (
      <div className="flex items-end gap-2 mb-4">
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>
          AI
        </div>
        <div className="px-4 py-3 flex gap-1.5 items-center"
          style={{ background: "var(--light-clay)", borderRadius: "4px 18px 18px 18px", minHeight: 44 }}>
          <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--smoke)", display: "inline-block" }} />
          <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--smoke)", display: "inline-block" }} />
          <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--smoke)", display: "inline-block" }} />
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";
  const [openingKey, setOpeningKey] = useState(null);
  const retrievedDeduped =
    !isUser && Array.isArray(msg.retrievedItems)
      ? dedupeRetrievedItems(msg.retrievedItems)
      : [];
  const retrievedDisplay = dedupeByTypeAndTitle(retrievedDeduped);
  const ctaItems = retrievedDisplay.slice(0, 3);
  const ctaLabelCounts = ctaItems.reduce((acc, it) => {
    const base = catalogueCtaLabel(it?.item_type);
    acc[base] = (acc[base] || 0) + 1;
    return acc;
  }, {});

  const handleOpen = async (item) => {
    if (!onOpenCatalogueItem || !item?.item_id || !item?.item_type) return;
    const k = `${item.item_type}-${item.item_id}`;
    setOpeningKey(k);
    try {
      await onOpenCatalogueItem(item);
    } finally {
      setOpeningKey(null);
    }
  };

  return (
    <div className={`flex items-end gap-2 mb-4 bubble-in ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>
          AI
        </div>
      )}
      <div className="max-w-[75%]">
        <div className="px-4 py-3 text-sm leading-relaxed"
          style={{
            background: isUser ? "linear-gradient(135deg,var(--terracotta),var(--deep))" : "var(--light-clay)",
            color: isUser ? "#fff" : "var(--ink)",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          }}>
          {msg.text}
        </div>
        {!isUser && retrievedDeduped.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            <p
              style={{
                fontSize: 10,
                color: "var(--smoke)",
                width: "100%",
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              ✦ Sources from catalogue
            </p>
            {retrievedDisplay.slice(0, 5).map((item, i) => (
              <div
                key={`${item.item_id || i}-${item.item_type || ""}-${i}`}
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 100,
                  fontWeight: 500,
                  background: "rgba(212,168,83,.1)",
                  color: "var(--terracotta)",
                  border: "1px solid rgba(212,168,83,.25)",
                }}
              >
                {typeEmoji(item.item_type)}{" "}
                {item.title}
                {item.similarity != null && Number.isFinite(Number(item.similarity)) ? (
                  <span style={{ opacity: 0.6, marginLeft: 4 }}>
                    {(Number(item.similarity) * 100).toFixed(0)}%
                  </span>
                ) : null}
              </div>
            ))}
            {onOpenCatalogueItem && (
              <div style={{ width: "100%", marginTop: 6 }}>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--smoke)",
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Continue on the app
                </p>
                <div className="flex flex-wrap gap-2">
                  {ctaItems.map((item, i) => {
                    const k = `${item.item_type}-${item.item_id}`;
                    const busy = openingKey === k;
                    const base = catalogueCtaLabel(item.item_type);
                    const label =
                      (ctaLabelCounts[base] || 0) > 1
                        ? `${base}: ${shortTitle(item.title)}`
                        : base;
                    return (
                      <button
                        key={`cta-${k}-${i}`}
                        type="button"
                        disabled={busy}
                        onClick={() => handleOpen(item)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl"
                        style={{
                          border: "none",
                          cursor: busy ? "wait" : "pointer",
                          opacity: busy ? 0.75 : 1,
                          color: "#fff",
                          background: busy
                            ? "var(--clay)"
                            : "linear-gradient(135deg,var(--terracotta),var(--deep))",
                          boxShadow: busy
                            ? "none"
                            : "0 4px 14px rgba(192,101,74,.35)",
                        }}
                      >
                        {busy ? "Opening…" : label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
