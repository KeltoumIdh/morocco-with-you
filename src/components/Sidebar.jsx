import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { ICONS, NAV_GROUPS, NAV_ITEMS } from "../config/nav";

function Sidebar({ collapsed = false }) {
  return (
    <aside
      style={{ background: "#0f172a" }}
      className={`h-full hidden lg:flex flex-col transition-all duration-200 flex-shrink-0 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${
          collapsed ? "justify-center px-0" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Icon d={ICONS.globe} size={14} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="syne text-white text-sm font-semibold">TravelOps</p>
            <p className="text-slate-500 text-xs">Admin Console</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {Object.entries(NAV_GROUPS).map(([group, groupLabel]) => {
          const items = NAV_ITEMS.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest px-3 mb-1.5">
                  {groupLabel}
                </p>
              )}

              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "sidebar-item w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-0.5",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-300",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon d={ICONS[item.icon]} size={15} className="flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 badge-pulse" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                Admin User
              </p>
              <p className="text-xs text-slate-500 truncate">admin@travel.io</p>
            </div>
            <Icon d={ICONS.settings} size={13} className="text-slate-500" />
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;

