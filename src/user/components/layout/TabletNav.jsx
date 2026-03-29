import { useAuth } from "../../../context/AuthContext";
import { Ico } from "../../icons";
import AdminDashboardLink from "../AdminDashboardLink";

const NAV = [
  { id: "home",      label: "Home",        Icon: Ico.Home },
  { id: "explore",   label: "Explore",     Icon: Ico.Explore },
  { id: "groups",    label: "Groups",      Icon: Ico.Group },
  { id: "activities",     label: "Activities",   Icon: Ico.Zap },
  { id: "accommodations", label: "Hébergement",  Icon: Ico.Home2 },
  { id: "restaurants",    label: "Restaurants",  Icon: Ico.Fork },
  { id: "planning",       label: "Plan My Trip", Icon: Ico.Map },
  { id: "ai",        label: "AI Planner",  Icon: Ico.Sparkle },
  { id: "itinerary", label: "Itinerary",   Icon: Ico.Map },
  { id: "chat",      label: "Chat",        Icon: Ico.Chat },
  { id: "profile",   label: "Profile",     Icon: Ico.Profile },
];

export default function TabletNav({ active, setPage }) {
  const { isAdmin } = useAuth();
  return (
    <header className="glass sticky top-0 z-30 hidden md:block lg:hidden"
      style={{ borderBottom: "1px solid var(--light-clay)" }}>
      <div className="px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>
            MW
          </div>
          <span className="font-display font-medium" style={{ fontSize: 14, color: "var(--ink)" }}>Morocco With You</span>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map(({ id, label, Icon }) => {
            const on = active === id;
            return (
              <button key={id} onClick={() => setPage(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
                style={{
                  background: on ? "rgba(192,101,74,.1)" : "transparent",
                  color: on ? "var(--terracotta)" : "var(--smoke)",
                  fontWeight: on ? 600 : 400,
                  border: "none", cursor: "pointer",
                }}>
                <Icon />
                {label}
              </button>
            );
          })}
        </nav>
        {isAdmin && (
          <div className="flex-shrink-0 pl-2">
            <AdminDashboardLink variant="inline" />
          </div>
        )}
      </div>
    </header>
  );
}
