import { LineChart, Line, ResponsiveContainer } from "recharts";
import Icon from "../Icon";
import { ICONS } from "../../config/nav";
import Card from "./Card";

function KpiCard({
  label,
  value,
  sub,
  trendUp,
  icon,
  iconBg,
  iconColor,
  spark,
  sparkColor,
}) {
  return (
    <Card lift>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon d={ICONS[icon]} size={17} className={iconColor} />
        </div>
        {spark && (
          <div className="w-20 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="syne text-2xl font-semibold text-slate-800">{value}</p>
      {sub && (
        <div
          className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${
            trendUp ? "text-emerald-600" : "text-red-500"
          }`}
        >
          <Icon d={ICONS[trendUp ? "up" : "down"]} size={11} />
          {sub}
        </div>
      )}
    </Card>
  );
}

export default KpiCard;

