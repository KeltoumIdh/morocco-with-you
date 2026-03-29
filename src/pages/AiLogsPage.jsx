import { useCallback, useEffect, useState } from "react";
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
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

function Kpi({ label, value, icon, bg, color }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-start gap-3`}>
      <div
        className={`w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon d={ICONS[icon]} size={15} />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className={`syne text-2xl font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function csvEscape(s) {
  const t = String(s ?? "");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function fmt4(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(4);
}

export default function AiLogsPage({ toast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [featureStats, setFeatureStats] = useState({});
  const [recentLogs, setRecentLogs] = useState([]);
  const [promptModal, setPromptModal] = useState(null);

  const [evalRuns, setEvalRuns] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [compareRunA, setCompareRunA] = useState("");
  const [compareRunB, setCompareRunB] = useState("");
  const [comparison, setComparison] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.ai.metrics();
      setKpis(data.kpis || {});
      setFeatureStats(data.featureStats || {});
      setRecentLogs(data.recentLogs || []);
    } catch (e) {
      setError(e?.message || "Failed to load AI metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadEvalRuns = useCallback(async () => {
    setEvalLoading(true);
    setEvalError(null);
    try {
      const rows = await adminApi.ai.evalRuns();
      setEvalRuns(Array.isArray(rows) ? rows : []);
      setComparison(null);
    } catch (e) {
      setEvalError(e?.message || "Failed to load eval runs");
      setEvalRuns([]);
    } finally {
      setEvalLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvalRuns();
  }, [loadEvalRuns]);

  const startEval = async (mode) => {
    try {
      await adminApi.ai.evalRun({ mode, k: 5 });
      toast?.("Evaluation started — refresh in a few seconds", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to start eval", "error");
    }
  };

  const runCompare = async () => {
    if (!compareRunA || !compareRunB || compareRunA === compareRunB) {
      toast?.("Pick two different runs", "error");
      return;
    }
    setCompareBusy(true);
    setComparison(null);
    try {
      const data = await adminApi.ai.evalCompare(compareRunA, compareRunB);
      setComparison(data);
    } catch (e) {
      toast?.(e?.message || "Compare failed", "error");
    } finally {
      setCompareBusy(false);
    }
  };

  const featureRows = Object.entries(featureStats || {}).map(([feature, v]) => {
    const calls = v.calls || 0;
    const errs = v.errors || 0;
    const ok = Math.max(0, calls - errs);
    const rate = calls ? Math.round((ok / calls) * 1000) / 10 : 0;
    return { feature, calls, errors: errs, successRate: `${rate}%`, avgLatency: "—" };
  });

  const barData = Object.entries(featureStats || {}).map(([name, v]) => ({
    name,
    success: Math.max(0, (v.calls || 0) - (v.errors || 0)),
    errors: v.errors || 0,
  }));

  const exportCsv = () => {
    const rows = recentLogs || [];
    const header = [
      "created_at",
      "user",
      "feature",
      "model",
      "tokens",
      "status",
      "latency_ms",
      "prompt",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.created_at),
          csvEscape(r.profiles?.full_name || "—"),
          csvEscape(r.feature || "chat"),
          csvEscape(r.model),
          csvEscape(r.tokens_used),
          csvEscape(r.status),
          csvEscape(r.latency_ms),
          csvEscape(r.prompt),
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ai_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast?.("Exported CSV", "success");
  };

  const embedAll = async () => {
    try {
      await adminApi.ai.embedAll();
      toast?.("Re-embedding started in the background", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to start embed", "error");
    }
  };

  const tableRows = (recentLogs || []).map((l) => ({
    id: l.id,
    user: l?.profiles?.full_name || "—",
    feature: l.feature || "chat",
    model: l.model || "—",
    tokens: Number(l.tokens_used) || 0,
    status: l.status || "success",
    latency: l.latency_ms != null ? `${l.latency_ms} ms` : "—",
    time: l.created_at
      ? new Date(l.created_at).toLocaleString()
      : "—",
    _prompt: l.prompt || "",
  }));

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">AI Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">
            Observability for chat, itineraries, recommendations, and admin AI tools (Gemini-first stack).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCsv}>
            Export logs
          </Button>
          <Button size="sm" onClick={embedAll}>
            Re-embed all
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <Card>
            <SectionHeader
              title="KPIs"
              desc="Last 24h error rate uses today’s rolling window; cost uses logged or estimated USD"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Kpi
                label="Total AI calls"
                value={kpis?.totalCalls ?? 0}
                icon="zap"
                bg="bg-violet-50"
                color="text-violet-700"
              />
              <Kpi
                label="Today's cost (USD)"
                value={kpis?.todayCost ?? "0.0000"}
                icon="coin"
                bg="bg-amber-50"
                color="text-amber-800"
              />
              <Kpi
                label="Error rate 24h"
                value={`${kpis?.errorRate24h ?? "0.0"}%`}
                icon="alert"
                bg="bg-red-50"
                color="text-red-700"
              />
              <Kpi
                label="Avg latency (ms)"
                value={kpis?.avgLatency ?? 0}
                icon="compass"
                bg="bg-slate-50"
                color="text-slate-700"
              />
            </div>
          </Card>

          <Card p="p-5">
            <SectionHeader
              title="Feature breakdown (7 days)"
              desc="Calls and errors by feature tag stored in ai_logs"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table
                columns={[
                  { key: "feature", label: "Feature" },
                  { key: "calls", label: "Calls (7d)" },
                  { key: "errors", label: "Errors" },
                  { key: "successRate", label: "Success rate" },
                  { key: "avgLatency", label: "Avg latency" },
                ]}
                data={featureRows}
              />
            </div>
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" stackId="a" fill="#22c55e" name="Success" />
                  <Bar dataKey="errors" stackId="a" fill="#ef4444" name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card p="p-5">
            <SectionHeader
              title="Retrieval evaluation"
              desc="Precision@K, recall, MRR, NDCG vs eval_queries (run schema_eval_retrieval.sql in Supabase first)"
            />
            {evalLoading ? (
              <p className="text-sm text-slate-500 py-4">Loading eval runs…</p>
            ) : evalError ? (
              <p className="text-sm text-amber-700 py-2">{evalError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button size="sm" variant="ghost" onClick={loadEvalRuns}>
                Refresh eval runs
              </Button>
              <Button size="sm" onClick={() => startEval("vector")}>
                Run vector eval
              </Button>
              <Button size="sm" onClick={() => startEval("hybrid")}>
                Run hybrid eval
              </Button>
              <Button size="sm" variant="ghost" onClick={() => startEval("keyword")}>
                Run keyword eval
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Run A</label>
                <select
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 min-w-[200px] bg-white"
                  value={compareRunA}
                  onChange={(e) => setCompareRunA(e.target.value)}
                >
                  <option value="">—</option>
                  {evalRuns.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.run_name?.slice(0, 40)} ({r.search_mode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Run B</label>
                <select
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 min-w-[200px] bg-white"
                  value={compareRunB}
                  onChange={(e) => setCompareRunB(e.target.value)}
                >
                  <option value="">—</option>
                  {evalRuns.map((r) => (
                    <option key={`b-${r.id}`} value={r.id}>
                      {r.run_name?.slice(0, 40)} ({r.search_mode})
                    </option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={runCompare} disabled={compareBusy}>
                {compareBusy ? "Comparing…" : "Compare selected"}
              </Button>
            </div>
            {comparison?.winner ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                <span className="font-semibold">Higher NDCG: </span>
                {comparison.winner}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-emerald-800">
                  {comparison.delta &&
                    Object.entries(comparison.delta).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-emerald-700">{k}: </span>
                        {v}
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table
                columns={[
                  { key: "run_name", label: "Run" },
                  { key: "search_mode", label: "Mode" },
                  { key: "k", label: "K" },
                  {
                    key: "precision_at_k",
                    label: "P@K",
                    render: (v) => (
                      <span className="font-mono text-xs">{fmt4(v)}</span>
                    ),
                  },
                  {
                    key: "recall_at_k",
                    label: "R@K",
                    render: (v) => (
                      <span className="font-mono text-xs">{fmt4(v)}</span>
                    ),
                  },
                  {
                    key: "mrr",
                    label: "MRR",
                    render: (v) => (
                      <span className="font-mono text-xs">{fmt4(v)}</span>
                    ),
                  },
                  {
                    key: "ndcg",
                    label: "NDCG",
                    render: (v) => (
                      <span className="font-mono text-xs">{fmt4(v)}</span>
                    ),
                  },
                  {
                    key: "avg_latency_ms",
                    label: "Latency",
                    render: (v) => (v != null ? `${v} ms` : "—"),
                  },
                  {
                    key: "created_at",
                    label: "Date",
                    render: (v) =>
                      v ? new Date(v).toLocaleString() : "—",
                  },
                ]}
                data={evalRuns}
              />
            </div>
          </Card>

          <Card p="p-5">
            <SectionHeader title="Recent logs" desc="Latest 20 rows (join with profiles when available)" />
            <Table
              columns={[
                { key: "user", label: "User" },
                { key: "feature", label: "Feature" },
                { key: "model", label: "Model" },
                {
                  key: "tokens",
                  label: "Tokens",
                  render: (v) => (
                    <span className="font-mono text-xs text-violet-600 font-semibold">
                      {Number(v).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (v) => <Badge status={v} />,
                },
                { key: "latency", label: "Latency" },
                { key: "time", label: "Time" },
                {
                  key: "_prompt",
                  label: "",
                  render: (p) => (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPromptModal(p)}
                    >
                      View prompt
                    </Button>
                  ),
                },
              ]}
              data={tableRows}
            />
          </Card>
        </>
      )}

      <Modal
        open={promptModal != null}
        title="Prompt"
        onClose={() => setPromptModal(null)}
        footer={
          <Button variant="ghost" onClick={() => setPromptModal(null)}>
            Close
          </Button>
        }
      >
        <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
          {promptModal || "—"}
        </pre>
      </Modal>
    </div>
  );
}
