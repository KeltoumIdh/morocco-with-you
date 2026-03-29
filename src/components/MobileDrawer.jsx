import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { ICONS, NAV_ITEMS } from "../config/nav";

function MobileDrawer({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        style={{ background: "#0f172a" }}
        className={`fixed inset-y-0 left-0 z-50 w-[220px] transform transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Icon d={ICONS.globe} size={12} className="text-white" />
            </div>
            <span className="syne text-white text-sm font-semibold">
              TravelOps
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <Icon d={ICONS.x} size={15} className="text-slate-400" />
          </button>
        </div>

        <nav className="py-4 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "sidebar-item w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-0.5",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300",
                ].join(" ")
              }
            >
              <Icon d={ICONS[item.icon]} size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default MobileDrawer;

