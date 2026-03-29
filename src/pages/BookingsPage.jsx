import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DestPill from "../components/ui/DestPill";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

/** Prefer display name; many accounts only have email in `profiles`. */
function customerDisplayName(profile) {
  const p = profile;
  const name = p?.full_name != null && String(p.full_name).trim() !== "" ? String(p.full_name).trim() : null;
  if (name) return name;
  const em = p?.email != null && String(p.email).trim() !== "" ? String(p.email).trim() : null;
  if (em) return em.split("@")[0] || em;
  return "Unknown";
}

function customerAvatarLabel(displayName) {
  if (!displayName || displayName === "Unknown") return "??";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

const rowFromBooking = (b) => {
  const userName = customerDisplayName(b?.profiles);
  return {
    id: b.id,
    destination: b?.experiences?.location || "—",
    user: userName,
    avatar: customerAvatarLabel(userName),
    date: b.travel_date ? new Date(b.travel_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—",
    amount: Number(b.total_amount) || 0,
    commission: Math.round((Number(b.total_amount) || 0) * 0.1),
    status: b.status || "pending",
    trip: b?.experiences?.title || "—",
    booking_id: b.id,
  };
};

const rowFromActivityBooking = (b) => {
  const userName = customerDisplayName(b?.profiles);
  const title = b?.activities?.title || "—";
  const destination = b?.activities?.location || "—";
  return {
    id: b.id,
    destination,
    user: userName,
    avatar: customerAvatarLabel(userName),
    date: b.travel_date ? new Date(b.travel_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—",
    amount: Number(b.total_amount) || 0,
    commission: 0,
    status: b.status || "pending",
    trip: title,
    booking_id: b.id,
  };
};

const rowFromPackageBooking = (b) => {
  const userName = customerDisplayName(b?.profiles);
  const title = b?.packages?.title || "—";
  const destination = Array.isArray(b?.packages?.cities) ? b.packages.cities.join(" • ") : "—";
  return {
    id: b.id,
    destination,
    user: userName,
    avatar: customerAvatarLabel(userName),
    date: b.start_date ? new Date(b.start_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—",
    amount: Number(b.total_amount) || 0,
    commission: 0,
    status: b.status || "pending",
    trip: title,
    booking_id: b.id,
  };
};

function BookingsPage({ toast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [viewTarget, setViewTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("experiences"); // experiences | activities | packages

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (type === "activities") {
        const { bookings: rows } = await adminApi.activities.bookings({ limit: 200, offset: 0 });
        setBookings((rows || []).map(rowFromActivityBooking));
      } else if (type === "packages") {
        const { bookings: rows } = await adminApi.packages.bookings({ limit: 200, offset: 0 });
        setBookings((rows || []).map(rowFromPackageBooking));
      } else {
        const { bookings: rows } = await adminApi.bookings.list({ limit: 200, offset: 0 });
        setBookings((rows || []).map(rowFromBooking));
      }
    } catch (e) {
      setError(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (filter === "all" || b.status === filter) &&
          (b.user.toLowerCase().includes(search.toLowerCase()) ||
            b.id.toLowerCase().includes(search.toLowerCase()))
      ),
    [bookings, filter, search]
  );

  const updateStatus = async (id, status) => {
    try {
      if (type === "experiences") {
        const updated = await adminApi.bookings.update(id, { status });
        setBookings((prev) => prev.map((b) => (b.id === id ? rowFromBooking(updated) : b)));
        toast?.(`Booking ${status}`, "success");
      } else {
        toast?.("Status updates for this booking type are not implemented yet.", "error");
      }
    } catch (e) {
      toast?.(e?.message || "Failed to update booking", "error");
    }
  };

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="syne text-2xl font-semibold text-slate-800">Bookings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage and review all travel bookings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          ["experiences", "Experiences"],
          ["activities", "Activities"],
          ["packages", "Packages"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              type === k ? "bg-slate-800 text-white" : "text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
        <Button variant="ghost" size="xs" className="ml-auto" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Total", "slate", counts.all],
          ["Confirmed", "emerald", counts.confirmed],
          ["Pending", "amber", counts.pending],
          ["Cancelled", "red", counts.cancelled],
        ].map(([l, c, v]) => (
          <div
            key={l}
            className="rounded-2xl px-4 py-3"
            style={{
              background:
                c === "slate"
                  ? "#f8fafc"
                  : c === "emerald"
                    ? "#ecfdf5"
                    : c === "amber"
                      ? "#fffbeb"
                      : "#fef2f2",
            }}
          >
            <p className="text-xs text-slate-400">{l}</p>
            <p
              className="syne text-xl font-semibold mt-1"
              style={{
                color:
                  c === "slate"
                    ? "#1e293b"
                    : c === "emerald"
                      ? "#065f46"
                      : c === "amber"
                        ? "#92400e"
                        : "#991b1b",
              }}
            >
              {v}
            </p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon
              d={ICONS.search}
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-300 outline-none focus:ring-2 focus:ring-blue-50"
            />
          </div>
          {["all", "confirmed", "pending", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
              type="button"
            >
              {f} <span className="ml-1 opacity-60">{counts[f]}</span>
            </button>
          ))}
          <Button variant="ghost" icon="export" size="xs" className="ml-auto">
            Export
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
                key: "id",
                label: "ID",
                render: (v) => (
                  <span className="font-mono text-xs font-semibold text-slate-500">{v}</span>
                ),
              },
              { key: "destination", label: "Route", render: (v) => <DestPill route={v} /> },
              {
                key: "user",
                label: "Customer",
                render: (v, r) => (
                  <div className="flex items-center gap-2">
                    <Avatar initials={r.avatar} />
                    <span className="font-medium">{v}</span>
                  </div>
                ),
              },
              { key: "date", label: "Date", render: (v) => <span className="text-xs text-slate-400">{v}</span> },
              {
                key: "amount",
                label: "Amount",
                render: (v) => (
                  <span className="font-bold text-slate-800">${v.toLocaleString()}</span>
                ),
              },
              {
                key: "commission",
                label: "Commission",
                render: (v) => <span className="text-emerald-600 font-semibold">${v}</span>,
              },
              { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
            ]}
            data={filtered}
            actions={(row) => (
              <>
                <Button variant="ghost" size="xs" icon="eye" onClick={() => setViewTarget(row)}>
                  View
                </Button>
                {row.status === "pending" && (
                  <button
                    onClick={() => updateStatus(row.id, "confirmed")}
                    className="px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    type="button"
                  >
                    Confirm
                  </button>
                )}
                {row.status === "pending" && (
                  <button
                    onClick={() => updateStatus(row.id, "cancelled")}
                    className="px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          />
        )}
      </Card>

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Booking Details"
        size="md"
        footer={
          <Button variant="ghost" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Booking ID", viewTarget.id],
                ["Status", null],
                ["Customer", viewTarget.user],
                ["Trip", viewTarget.trip || "—"],
                ["Date", viewTarget.date],
                ["Amount", `$${viewTarget.amount?.toLocaleString()}`],
                ["Commission", `$${viewTarget.commission}`],
                ["Route", viewTarget.destination],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{l}</p>
                  {l === "Status" ? (
                    <Badge status={viewTarget.status} />
                  ) : (
                    <p className="text-sm font-semibold text-slate-700">{v}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

export default BookingsPage;

