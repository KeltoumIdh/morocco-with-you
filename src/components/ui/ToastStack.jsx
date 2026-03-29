import Icon from "../Icon";
import { ICONS } from "../../config/nav";

function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{ animation: "modalIn 0.22s ease both" }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
            t.type === "success"
              ? "bg-emerald-600 text-white"
              : t.type === "error"
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-white"
          }`}
        >
          <Icon
            d={
              t.type === "success"
                ? ICONS.check
                : t.type === "error"
                  ? ICONS.x
                  : ICONS.zap
            }
            size={14}
          />
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default ToastStack;

