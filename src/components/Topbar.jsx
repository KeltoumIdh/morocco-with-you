import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Icon from "./Icon";
import { ICONS, NAV_ITEMS } from "../config/nav";

function Topbar({ onMenu, onCollapse, collapsed }) {
  const location = useLocation();

  const activeItem = useMemo(
    () => NAV_ITEMS.find((i) => i.to === location.pathname),
    [location.pathname]
  );

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 flex-shrink-0 z-30">
      <button
        onClick={onMenu}
        className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Icon d={ICONS.menu} size={17} className="text-slate-500" />
      </button>

      <button
        onClick={onCollapse}
        className="hidden lg:flex p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon
          d={ICONS[collapsed ? "chevR" : "chevL"]}
          size={15}
          className="text-slate-400"
        />
      </button>

      {activeItem && (
        <div className="hidden sm:flex items-center gap-2">
          <Icon d={ICONS[activeItem.icon]} size={15} className="text-slate-400" />
          <span className="syne text-sm font-semibold text-slate-700">
            {activeItem.label}
          </span>
        </div>
      )}

      <div className="flex-1 max-w-xs relative ml-2 hidden sm:block">
        <Icon
          d={ICONS.search}
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
        />
        <input
          placeholder="Quick search…"
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-200 focus:bg-white transition-colors"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Icon d={ICONS.bell} size={16} className="text-slate-400" />
          <span className="badge-pulse absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
        </button>
        <div className="ml-1 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  );
}

export default Topbar;

