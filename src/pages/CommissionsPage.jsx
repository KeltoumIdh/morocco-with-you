import {
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
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ChartTooltip from "../components/ui/ChartTooltip";
import DestPill from "../components/ui/DestPill";
import SectionHeader from "../components/ui/SectionHeader";
import Table from "../components/ui/Table";
import { DEST_META } from "../data/mock";
import { adminApi } from "../lib/api";
import { supabase } from "../lib/supabase";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

const mapCommission = (c) => ({
  id: c.id,
  bookingId: c.booking_id,
  booking: "BK-" + String(c.booking_id || "").slice(0, 6),
  user: c.user,
  trip: c.trip,
  date: c.date,
  bookingAmt: Number(c.booking_amt) || 0,
  commission: Number(c.commission) || 0,
  status: c.status || "pending",
});

function pdfSelectionWarning(providerId, month) {
  const needM = !String(month || "").trim();
  const needP = !String(providerId || "").trim();
  if (!needM && !needP) return null;
  if (needM && needP) return "Select a month and a provider.";
  if (needM) return "Select a month.";
  return "Select a provider.";
}

function CommissionsPage({ toast }) {
  const [commissions, setCommissions] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pdfSelectionReady = Boolean(String(month || "").trim() && String(providerId || "").trim());
  const paid = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + c.commission, 0);
  const pending = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.commission, 0);
  const total = commissions.reduce((s, c) => s + c.commission, 0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminApi.commissions.list();
      setCommissions((rows || []).map(mapCommission));
    } catch (e) {
      setError(e?.message || "Failed to load commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    adminApi.providers.list().then((rows) => setProviders(rows || [])).catch(() => setProviders([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePdf = async () => {
    if (!pdfSelectionReady) {
      const msg =
        providers.length === 0
          ? "Add a provider under Providers first, then pick them here to generate a PDF."
          : pdfSelectionWarning(providerId, month) || "Select month and provider";
      toast?.(msg, "error");
      return;
    }
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const base = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const url = `${base}/admin/commissions/report?` + new URLSearchParams({ provider_id: providerId, month });
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const dl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dl;
      a.download = `commission-${providerId}-${month}.pdf`;
      a.click();
      window.URL.revokeObjectURL(dl);
      toast?.("PDF generated", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to generate PDF", "error");
    }
  };

  const sendReport = async () => {
    if (!pdfSelectionReady) {
      const msg =
        providers.length === 0
          ? "Add a provider under Providers first, then pick them here to send a report."
          : pdfSelectionWarning(providerId, month) || "Select month and provider";
      toast?.(msg, "error");
      return;
    }
    try {
      await adminApi.commissions.sendReport(providerId, month);
      toast?.("Report email sent", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to send report", "error");
    }
  };

  const exportCsv = () => {
    const header = ["ID", "Booking", "Customer", "Route", "Date", "BookingAmt", "Commission", "Status"];
    const rows = commissions.map((c) => [c.id, c.booking, c.user, c.trip, c.date, c.bookingAmt, c.commission, c.status]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markPaid = async (id) => {
    try {
      const row = commissions.find((c) => c.id === id);
      if (!row?.bookingId) return;
      await adminApi.commissions.update(row.bookingId, { commission_status: "paid" });
      setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, status: "paid" } : c)));
      toast?.("Commission marked as paid", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to update commission", "error");
    }
  };

  const monthFromRow = (row) => {
    if (row?.createdAt) {
      const d = new Date(row.createdAt);
      if (!Number.isNaN(d.valueOf())) {
        return d.toLocaleDateString("en-US", { month: "short" });
      }
    }
    const s = String(row?.date || "");
    return s.split(" ")[0] || "—";
  };

  const monthly = (() => {
    const map = new Map();
    for (const c of commissions) {
      const month = monthFromRow(c);
      const cur = map.get(month) || { month, paid: 0, pending: 0, cancelled: 0 };
      cur[c.status] = (cur[c.status] || 0) + (Number(c.commission) || 0);
      map.set(month, cur);
    }
    // stable order Jan..Dec for nice charts
    const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return [...map.values()].sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
  })();

  const topTrips = (() => {
    const map = new Map();
    for (const c of commissions) {
      const key = c.trip || "—";
      map.set(key, (map.get(key) || 0) + (Number(c.commission) || 0));
    }
    const arr = [...map.entries()]
      .map(([trip, commission]) => ({ trip, commission }))
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 6);
    const top = arr[0]?.commission || 1;
    return arr.map((t) => ({ ...t, pct: Math.max(5, Math.round((t.commission / top) * 100)) }));
  })();

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="syne text-2xl font-semibold text-slate-800">Commissions</h1>
        <p className="text-xs text-slate-400 mt-1">Reconcile and track all booking commissions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          [
            "Total Commission",
            "$" + total,
            "All transactions",
            "border-slate-300",
            "text-slate-800",
          ],
          [
            "Paid Out",
            "$" + paid,
            `${total ? Math.round((paid / total) * 100) : 0}% paid out`,
            "border-emerald-400",
            "text-emerald-600",
          ],
          [
            "Pending",
            "$" + pending,
            `${commissions.filter((c) => c.status === "pending").length} awaiting`,
            "border-amber-400",
            "text-amber-600",
          ],
        ].map(([l, v, s, border, c]) => (
          <Card key={l} className={`border-l-4 ${border}`}>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">{l}</p>
            <p className={`syne text-3xl font-semibold ${c}`}>{v}</p>
            <p className="text-xs text-slate-400 mt-1">{s}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-2">
          <SectionHeader title="Top Trips by Commission" />
          <div className="space-y-3">
            {topTrips.map((t, i) => {
              const m = DEST_META[t.trip] || { emoji: "🌍", grad: "from-slate-400 to-slate-300" };
              return (
                <div key={t.trip} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.grad} flex items-center justify-center text-xs flex-shrink-0`}
                  >
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-700 truncate">{t.trip}</p>
                      <span className="text-xs font-bold text-emerald-600">
                        ${t.commission.toLocaleString()}
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
              );
            })}
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionHeader title="Monthly Commission Summary" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="paid" name="Paid" stackId="a" fill="#10b981" />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#fbbf24" />
              <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card p="p-5">
        <SectionHeader
          title="Commission Log"
          desc="All transactions"
          right={
            <div className="flex flex-wrap gap-2 items-end justify-end">
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Month</span>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </label>
              <label className="flex flex-col gap-0.5 min-w-[140px]">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Provider</span>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white w-full"
                >
                  <option value="">Choose provider…</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 items-center pt-4 sm:pt-5">
                <Button variant="ghost" size="xs" onClick={generatePdf}>
                  Generate PDF
                </Button>
                <Button variant="ghost" size="xs" onClick={sendReport}>
                  Send to Provider
                </Button>
                <Button variant="ghost" icon="export" size="xs" onClick={exportCsv}>
                  Export CSV
                </Button>
              </div>
            </div>
          }
        />
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Table
            columns={[
              { key: "id", label: "ID", render: (v) => <span className="font-mono text-xs text-slate-400">{v}</span> },
              {
                key: "booking",
                label: "Booking",
                render: (v) => <span className="font-mono text-xs text-indigo-500 font-semibold">{v}</span>,
              },
              { key: "user", label: "Customer" },
              { key: "trip", label: "Route", render: (v) => <DestPill route={v} /> },
              { key: "date", label: "Date", render: (v) => <span className="text-xs text-slate-400">{v}</span> },
              { key: "bookingAmt", label: "Booking Amt", render: (v) => `$${v.toLocaleString()}` },
              { key: "commission", label: "Commission", render: (v) => <span className="font-bold text-slate-800">${v}</span> },
              { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
            ]}
            data={commissions}
            actions={(row) => (
              <>
                {row.status === "pending" && (
                  <button
                    onClick={() => markPaid(row.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    type="button"
                  >
                    <Icon d={ICONS.check} size={11} />
                    Mark Paid
                  </button>
                )}
              </>
            )}
          />
        )}
        {!loading && !error && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <p><strong>Total revenue:</strong> ${commissions.reduce((s, c) => s + c.bookingAmt, 0).toFixed(2)}</p>
              <p><strong>Total commission:</strong> ${commissions.reduce((s, c) => s + c.commission, 0).toFixed(2)}</p>
              <p><strong>Paid:</strong> ${paid.toFixed(2)}</p>
              <p><strong>Pending:</strong> ${pending.toFixed(2)}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CommissionsPage;

