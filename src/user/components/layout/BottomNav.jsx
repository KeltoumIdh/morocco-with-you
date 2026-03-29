import { useMemo, useState } from "react";
import { Ico } from "../../icons";

const NAV = [
  { id: "home",     label: "Home",    Icon: Ico.Home },
  { id: "explore",  label: "Explore", Icon: Ico.Explore },
  { id: "ai",       label: "AI",      Icon: Ico.Sparkle },
  { id: "chat",     label: "Chat",    Icon: Ico.Chat },
  { id: "profile",  label: "Profile", Icon: Ico.Profile },
];

export default function BottomNav({ active, setPage }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreLinks = useMemo(() => ([
    { id: "groups",         label: "Group Trips",  Icon: Ico.Group },
    { id: "activities",     label: "Activities",   Icon: Ico.Zap },
    { id: "accommodations", label: "Hébergement",  Icon: Ico.Home2 },
    { id: "restaurants",    label: "Restaurants",  Icon: Ico.Fork },
    { id: "planning",       label: "Plan My Trip", Icon: Ico.Map },
  ]), []);

  return (
    <>
      {/* More drawer */}
      {moreOpen && (
        <>
          <div
            onClick={() => setMoreOpen(false)}
            className="md:hidden"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(26,20,16,.22)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          />
          <div
            className="md:hidden animate-slideUp"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 61,
              background: "rgba(250,246,238,.96)",
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              borderTop: "1px solid rgba(232,196,160,.7)",
              borderRadius: "24px 24px 0 0",
              padding: "14px 14px 18px",
              boxShadow: "0 -10px 40px rgba(26,20,16,.22)",
            }}
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="font-display" style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>
                More
              </p>
              <button
                onClick={() => setMoreOpen(false)}
                style={{
                  background: "var(--light-clay)",
                  border: "none",
                  borderRadius: 12,
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--smoke)",
                }}
              >
                <Ico.X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {moreLinks.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMoreOpen(false);
                    setPage(id);
                  }}
                  className="rounded-2xl p-4 text-left card-lift"
                  style={{
                    background: "var(--parchment)",
                    border: "1px solid var(--light-clay)",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(26,20,16,.06)",
                  }}
                >
                  <div className="flex items-center gap-2" style={{ color: "var(--terracotta)" }}>
                    <Icon />
                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{label}</span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "var(--smoke)" }}>
                    Browse
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ background: "var(--parchment)", borderTop: "1px solid var(--light-clay)" }}>
        <div className="flex justify-around px-2 pb-safe">
        {NAV.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => setPage(id)}
              className="flex flex-col items-center gap-1 py-3 px-3 transition-colors"
              style={{ color: on ? "var(--terracotta)" : "var(--smoke)", background: "none", border: "none", cursor: "pointer" }}>
              <Icon />
              <span style={{ fontSize: 10, fontWeight: on ? 600 : 400 }}>{label}</span>
              <div className={`nav-dot ${on ? "active" : ""}`} />
            </button>
          );
        })}

        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-1 py-3 px-3 transition-colors"
          style={{ color: moreOpen ? "var(--terracotta)" : "var(--smoke)", background: "none", border: "none", cursor: "pointer" }}
        >
          <Ico.Dots />
          <span style={{ fontSize: 10, fontWeight: moreOpen ? 600 : 400 }}>More</span>
          <div className={`nav-dot ${moreOpen ? "active" : ""}`} />
        </button>
      </div>
    </nav>
    </>
  );
}
