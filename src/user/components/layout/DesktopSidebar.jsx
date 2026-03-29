import { useAuth } from "../../../context/AuthContext";
import { Ico, MoroccoMotif } from "../../icons";
import AdminDashboardLink from "../AdminDashboardLink";

const NAV = [
  { id: "home",      label: "Home",        Icon: Ico.Home },
  { id: "explore",   label: "Explore",     Icon: Ico.Explore },
  { id: "groups",    label: "Group Trips", Icon: Ico.Group },
  { id: "activities",     label: "Activities",   Icon: Ico.Zap },
  { id: "accommodations", label: "Hébergement",  Icon: Ico.Home2 },
  { id: "restaurants",    label: "Restaurants",  Icon: Ico.Fork },
  { id: "planning",       label: "Plan My Trip", Icon: Ico.Map },
  { id: "ai",        label: "AI Planner",  Icon: Ico.Sparkle },
  { id: "itinerary", label: "Itineraries", Icon: Ico.Map },
  { id: "chat",      label: "AI Chat",     Icon: Ico.Chat },
  { id: "profile",   label: "Profile",     Icon: Ico.Profile },
];

export default function DesktopSidebar({ active, setPage }) {
  const { isAdmin } = useAuth();
  return (
    <aside className="desktop-sidebar hidden lg:flex flex-col"
      style={{ background: "var(--parchment)", borderRight: "1px solid var(--light-clay)" }}>

      {/* Brand */}
      <div className="px-6 py-7 border-b" style={{ borderColor: "var(--light-clay)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>
            MW
          </div>
          <div>
            <p className="font-display font-semibold" style={{ fontSize: 15, color: "var(--ink)" }}>Morocco With You</p>
            <p style={{ fontSize: 11, color: "var(--smoke)" }}>Luxury travel platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "var(--clay)", letterSpacing: ".12em" }}>
          Discover
        </p>
        {NAV.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => setPage(id)}
              className={`desk-nav-link ${on ? "active" : ""}`}>
              <Icon />
              <span>{label}</span>
              {on && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--terracotta)" }} />}
            </button>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="px-3 pb-3">
          <AdminDashboardLink variant="sidebar" />
        </div>
      )}

      {/* AI promo card */}
      <div className="p-4">
        <div className="pattern-bg relative rounded-2xl p-4 overflow-hidden" style={{ cursor: "pointer" }}
          onClick={() => setPage("ai")}>
          <MoroccoMotif />
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "rgba(212,168,83,.2)" }}>
              <Ico.Sparkle />
            </div>
            <p className="font-display text-white text-sm font-medium mb-1">AI Trip Planner</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>
              Generate your perfect Morocco itinerary in seconds.
            </p>
            <button className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(212,168,83,.2)", color: "var(--gold)", border: "1px solid rgba(212,168,83,.3)" }}>
              Try it free →
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
