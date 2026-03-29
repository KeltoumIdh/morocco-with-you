import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

const STATUS_OPTIONS = ["new", "contacted", "closed", "cancelled"];

function rowFromApi(r) {
  const st = String(r.status || "new").toLowerCase();
  return {
    id: r.id,
    shortId: String(r.id).slice(0, 8),
    eventType: r.event_type || "—",
    groupSize: r.group_size != null ? r.group_size : "—",
    contact: r.contact_name || "—",
    email: r.contact_email || "",
    phone: r.contact_phone || "",
    dates: r.preferred_dates || "—",
    budget: r.budget_range || "—",
    requirements: r.requirements || "",
    status: STATUS_OPTIONS.includes(st) ? st : "new",
    created: r.created_at
      ? new Date(r.created_at).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  };
}

export default function EventRequestsPage({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [viewTarget, setViewTarget] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.eventRequests.list();
      setRows((Array.isArray(data) ? data : []).map(rowFromApi));
    } catch (e) {
      setError(e?.message || "Failed to load group requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patchStatus = async (id, status) => {
    try {
      const raw = await adminApi.eventRequests.update(id, { status });
      const next = rowFromApi(raw);
      setRows((prev) => prev.map((r) => (r.id === id ? next : r)));
      if (viewTarget?.id === id) setViewTarget(next);
      toast?.("Status updated", "success");
    } catch (e) {
      toast?.(e?.message || "Update failed", "error");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.eventType.toLowerCase().includes(q) ||
        r.contact.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.shortId.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => {
    const c = { all: rows.length, new: 0, contacted: 0, closed: 0, cancelled: 0 };
    rows.forEach((r) => {
      if (typeof c[r.status] === "number") c[r.status] += 1;
    });
    return c;
  }, [rows]);

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="syne text-2xl font-semibold text-slate-800">Group requests</h1>
        <p className="text-xs text-slate-400 mt-1">
          Custom trip inquiries from Group Trips → Request Custom Trip (
          <code className="text-[11px]">event_requests</code>)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { k: "all", label: "Total" },
          { k: "new", label: "New" },
          { k: "contacted", label: "Contacted" },
          { k: "closed", label: "Closed" },
        ].map(({ k, label }) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-2xl px-4 py-3 text-left transition-colors ${
              filter === k ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <p className="text-xs opacity-80">{label}</p>
            <p className="syne text-xl font-semibold mt-0.5">{counts[k] ?? 0}</p>
          </button>
        ))}
      </div>

      <Card p="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Icon
              d={ICONS.search}
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search type, name, email, id…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none"
            />
          </div>
          <Button variant="ghost" size="sm" icon="export" onClick={load}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Table
            columns={[
              {
                key: "shortId",
                label: "ID",
                render: (v) => <span className="font-mono text-xs font-semibold text-slate-500">{v}</span>,
              },
              { key: "created", label: "Received" },
              { key: "eventType", label: "Event type" },
              {
                key: "groupSize",
                label: "Group",
                render: (v) => <span className="font-semibold text-slate-800">{v}</span>,
              },
              {
                key: "contact",
                label: "Contact",
                render: (v, r) => (
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{v}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{r.email}</p>
                  </div>
                ),
              },
              { key: "budget", label: "Budget" },
              {
                key: "status",
                label: "Status",
                render: (v) => <Badge status={v} />,
              },
            ]}
            data={filtered}
            actions={(row) => (
              <>
                <Button variant="ghost" size="xs" icon="eye" onClick={() => setViewTarget(row)}>
                  View
                </Button>
                <select
                  aria-label="Set status"
                  value={row.status}
                  onChange={(e) => patchStatus(row.id, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </>
            )}
            emptyMsg="No group requests yet. They appear when guests submit the custom trip form."
          />
        )}
      </Card>

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Group request"
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={viewTarget.status} />
              <span className="text-xs text-slate-400">{viewTarget.created}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Request ID", viewTarget.id],
                ["Event type", viewTarget.eventType],
                ["Group size", viewTarget.groupSize],
                ["Preferred dates", viewTarget.dates],
                ["Budget", viewTarget.budget],
                ["Name", viewTarget.contact],
                ["Email", viewTarget.email || "—"],
                ["Phone", viewTarget.phone || "—"],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 break-all">{val}</p>
                </div>
              ))}
            </div>
            {viewTarget.requirements ? (
              <div>
                <p className="text-xs text-slate-400 mb-1">Requirements / notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap rounded-xl bg-slate-50 p-3">
                  {viewTarget.requirements}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Update status</p>
              <select
                value={viewTarget.status}
                onChange={(e) => patchStatus(viewTarget.id, e.target.value)}
                className="w-full sm:w-auto text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
