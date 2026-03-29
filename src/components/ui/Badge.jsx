const BADGE_STYLE = {
  new: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  contacted: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  closed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
  draft: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  published: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  error: "bg-red-50 text-red-600 ring-1 ring-red-200",
  featured: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const DOT_COLOR = {
  new: "bg-amber-400",
  contacted: "bg-sky-400",
  closed: "bg-emerald-400",
  confirmed: "bg-emerald-400",
  pending: "bg-amber-400",
  cancelled: "bg-red-400",
  draft: "bg-slate-400",
  published: "bg-sky-400",
  active: "bg-emerald-400",
  inactive: "bg-slate-300",
  paid: "bg-emerald-400",
  success: "bg-emerald-400",
  error: "bg-red-400",
};

function Badge({ status, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        BADGE_STYLE[status] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          DOT_COLOR[status] || "bg-gray-400"
        }`}
      />
      {label || status}
    </span>
  );
}

export default Badge;

