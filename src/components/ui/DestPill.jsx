import { DEST_META } from "../../data/mock";

function DestPill({ route }) {
  const m = DEST_META[route] || { emoji: "🌍", grad: "from-slate-400 to-slate-300" };
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-md bg-gradient-to-br ${m.grad} flex items-center justify-center text-xs flex-shrink-0`}
      >
        {m.emoji}
      </div>
      <span className="text-sm text-slate-700 font-medium">{route}</span>
    </div>
  );
}

export default DestPill;

