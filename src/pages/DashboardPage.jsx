import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";
import ChartTooltip from "../components/ui/ChartTooltip";
import { SPK } from "../data/mock";
import KpiCard from "../components/ui/KpiCard";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

function DashboardPage({ toast }) {
  return (
    <div className="page-enter space-y-6">
      <DashboardContent toast={toast} />
    </div>
  );
}

export default DashboardPage;

function DashboardContent({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await adminApi.dashboard();
      setData(d);
    } catch (e) {
      setError(e?.message || "Failed to load dashboard");
      toast?.(e?.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const kpis = data?.kpis || {};
  const revenueChart = Array.isArray(data?.revenueChart) ? data.revenueChart : [];
  const commChart = revenueChart.map((r) => ({
    month: r.month,
    paid: Number(r.commissions) || 0,
    pending: 0,
    cancelled: 0,
  }));
  const topTrips = (() => {
    const rows = Array.isArray(data?.recentBookings) ? data.recentBookings : [];
    const map = new Map();
    for (const b of rows) {
      const title = b?.experiences?.title || "—";
      const comm = (Number(b.total_amount) || 0) * 0.1;
      map.set(title, (map.get(title) || 0) + comm);
    }
    const arr = [...map.entries()]
      .map(([trip, commission]) => ({ trip, commission }))
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 6);
    const top = arr[0]?.commission || 1;
    return arr.map((t) => ({ ...t, pct: Math.max(5, Math.round((t.commission / top) * 100)) }));
  })();

  const fmtMoney = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "—";
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toLocaleString()}`;
  };

  const insights = [
    {
      icon: "zap",
      color: "text-amber-500 bg-amber-50",
      text: "Revenue up 39% MoM — best month in 2026",
    },
    {
      icon: "star",
      color: "text-blue-500 bg-blue-50",
      text: "Sahara Immersion is the #1 booked trip (31%)",
    },
    {
      icon: "up",
      color: "text-emerald-500 bg-emerald-50",
      text: "Avg. booking value grew $180 since January",
    },
    {
      icon: "alert",
      color: "text-red-400 bg-red-50",
      text: "Commission pending >7 days: 2 transactions ($367)",
    },
  ];

  const alerts = [
    {
      type: "warn",
      msg: "Pending commissions $367 — approaching 7-day threshold",
    },
    { type: "info", msg: "February commission was $4,390 — +10.4% vs January" },
    { type: "ok", msg: "Paid-out rate this month: 80% — on target" },
  ];

  const activity = [
    {
      icon: "book",
      color: "bg-blue-50 text-blue-500",
      text: "New booking BK-2841 — Sarah Johnson",
      time: "2 min ago",
    },
    {
      icon: "ai",
      color: "bg-violet-50 text-violet-500",
      text: "AI generated itinerary TR-001",
      time: "18 min ago",
    },
    {
      icon: "coin",
      color: "bg-emerald-50 text-emerald-500",
      text: "Commission CM-299 paid — $315",
      time: "1h ago",
    },
    {
      icon: "users",
      color: "bg-amber-50 text-amber-500",
      text: "New user registered: Emma Clarke 🇬🇧",
      time: "3h ago",
    },
    {
      icon: "book",
      color: "bg-red-50 text-red-400",
      text: "Booking BK-2838 cancelled",
      time: "5h ago",
    },
  ];

  const planningFeed = (Array.isArray(data?.recentPlanningRequests) ? data.recentPlanningRequests : [])
    .slice(0, 5)
    .map((r) => ({
      icon: "file",
      color: "bg-violet-50 text-violet-500",
      text: `New planning request — ${r.full_name || r.email || "Customer"}`,
      time: r.created_at ? new Date(r.created_at).toLocaleString() : "—",
    }));

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">
            Wednesday, March 18 — 2026
          </p>
          <h1 className="syne text-2xl font-semibold text-slate-800">
            Overview
          </h1>
        </div>
        <Button variant="ghost" icon="export" size="sm">
          Export
        </Button>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Operations
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi
            label="Total Bookings"
            value={Number.isFinite(kpis.totalBookings) ? kpis.totalBookings.toLocaleString() : "—"}
            sub="+12% this month"
            trendUp
            icon="book"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            spark={SPK.bookings}
            sparkColor="#3b82f6"
          />
          <Kpi
            label="Total Revenue"
            value={Number.isFinite(kpis.totalRevenue) ? fmtMoney(kpis.totalRevenue) : "—"}
            sub="+39% vs Feb"
            trendUp
            icon="globe"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            spark={SPK.revenue}
            sparkColor="#6366f1"
          />
          <Kpi
            label="Active Users"
            value={Number.isFinite(kpis.totalUsers) ? kpis.totalUsers.toLocaleString() : "—"}
            sub="+34 new users"
            trendUp
            icon="users"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            spark={SPK.users}
            sparkColor="#8b5cf6"
          />
          <Kpi
            label="Commissions"
            value={Number.isFinite(kpis.commission) ? fmtMoney(kpis.commission) : "—"}
            sub="+39% vs Feb"
            trendUp
            icon="coin"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            spark={SPK.commission}
            sparkColor="#f59e0b"
          />
          <Kpi
            label="Planning Requests"
            value={Number.isFinite(kpis.planningRequestsNew) ? kpis.planningRequestsNew.toLocaleString() : "—"}
            sub="New"
            icon="file"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            spark={SPK.users}
            sparkColor="#8b5cf6"
          />
          <Kpi
            label="Activities Booked"
            value={Number.isFinite(kpis.activityBookingsCount) ? kpis.activityBookingsCount.toLocaleString() : "—"}
            sub="All time"
            icon="zap"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            spark={SPK.bookings}
            sparkColor="#10b981"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3">
          <SectionHeader
            title="Revenue & Bookings"
            desc="Monthly performance — 7 months"
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={revenueChart}
              margin={{ top: 5, right: 5, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="book" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#6366f1"
                fill="url(#rev)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                name="Bookings"
                stroke="#3b82f6"
                fill="url(#book)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="xl:col-span-2">
          <SectionHeader title="Commissions (Paid/Pending)" desc="Monthly summary" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={commChart}
              margin={{ top: 5, right: 5, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              />
              <Bar dataKey="paid" name="Paid" stackId="a" fill="#10b981" />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#fbbf24" />
              <Bar
                dataKey="cancelled"
                name="Cancelled"
                stackId="a"
                fill="#f87171"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <SectionHeader title="Insights" desc="Highlights & anomalies" />
          <div className="space-y-3">
            {insights.map((i, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${i.color}`}>
                  <Icon d={ICONS[i.icon]} size={15} />
                </div>
                <p className="text-sm text-slate-700 leading-snug">{i.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Alerts" desc="What needs attention" />
          <div className="space-y-2">
            {alerts.map((a, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-xl text-sm ${
                  a.type === "warn"
                    ? "bg-amber-50 text-amber-800"
                    : a.type === "ok"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-50 text-slate-700"
                }`}
              >
                {a.msg}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Activity" desc="Latest events" />
          <div className="space-y-3">
            {[...planningFeed, ...activity].slice(0, 7).map((a, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.color}`}>
                  <Icon d={ICONS[a.icon]} size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 truncate">{a.text}</p>
                  <p className="text-xs text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Top trips by commission" desc="Leaderboard" />
        <div className="space-y-3">
          {topTrips.map((t, i) => (
            <div key={t.trip} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {t.trip}
                  </p>
                  <span className="text-xs font-bold text-emerald-600">
                    ${Math.round(t.commission).toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Kpi(props) {
  return <KpiCard {...props} />;
}

