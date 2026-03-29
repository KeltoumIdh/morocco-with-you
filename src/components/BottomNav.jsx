import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { ICONS, NAV_ITEMS } from "../config/nav";

function BottomNav() {
  const items = NAV_ITEMS.slice(0, 5);
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 px-2">
      <div className="flex justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "bottom-nav-item flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-colors",
                isActive ? "text-blue-600" : "text-slate-400",
              ].join(" ")
            }
          >
            <Icon d={ICONS[item.icon]} size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default BottomNav;

