import { useEffect, useMemo, useState } from "react";
import { groupTripsApi } from "../../lib/api";

function GroupTripCard({ trip, onJoin }) {
  const [spots, setSpots] = useState(Number(trip.spots_available ?? 0));
  const isOpen = trip.status === "open";

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updated = await groupTripsApi.get(trip.id);
        setSpots(Number(updated.spots_available ?? 0));
      } catch {
        // keep stale value silently
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [trip.id]);

  const days = Math.max(
    1,
    Math.round(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  return (
    <article
      className="rounded-2xl overflow-hidden card-lift"
      style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}
    >
      <div
        className="h-[240px] p-4 flex items-start justify-between"
        style={{
          background:
            trip.gradient ||
            "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
        }}
      >
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            color: "#fff",
            background: isOpen ? "rgba(74,124,89,.9)" : "rgba(153,27,27,.9)",
          }}
        >
          {isOpen ? `OPEN — ${Math.max(0, spots)} spots left` : "FULL"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>
          {trip.title}
        </h3>
        <p className="text-sm mt-1" style={{ color: "var(--smoke)" }}>
          {trip.destination}
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--smoke)" }}>
          {new Date(trip.start_date).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          →{" "}
          {new Date(trip.end_date).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          ({days} days)
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-semibold" style={{ color: "var(--terracotta)" }}>
            €{Number(trip.price_per_person || 0).toFixed(0)}/person
          </p>
          <button
            type="button"
            onClick={() => onJoin(trip)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              color: "#fff",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
              opacity: isOpen ? 1 : 0.6,
            }}
            disabled={!isOpen}
          >
            Join This Trip →
          </button>
        </div>
      </div>
    </article>
  );
}

export default function GroupTripsPage({ setPage, setSelectedGroupTrip }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [destination, setDestination] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await groupTripsApi.list();
        if (mounted) setRows(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const destinations = useMemo(
    () => Array.from(new Set(rows.map((r) => r.destination).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (destination && r.destination !== destination) return false;
      return true;
    });
  }, [rows, statusFilter, destination]);

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10 px-5 md:px-8 lg:px-10">
      <section
        className="pattern-bg rounded-3xl p-8 md:p-10 overflow-hidden"
        style={{ marginTop: 10 }}
      >
        <h1
          className="font-display text-white"
          style={{ fontSize: "clamp(34px,6vw,62px)", fontWeight: 400 }}
        >
          Travel <em>Together</em>
        </h1>
        <p className="mt-3 max-w-2xl" style={{ color: "rgba(255,255,255,.72)" }}>
          Join a curated group journey — meet fellow travellers, share costs,
          discover Morocco together.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          {["👥 Max 16 people", "🌟 Expert guide", "💰 Best value"].map((t) => (
            <span
              key={t}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                color: "var(--gold)",
                border: "1px solid rgba(212,168,83,.4)",
                background: "rgba(250,246,238,.08)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2 items-center">
        {[
          ["open", "Open"],
          ["full", "Full"],
          ["all", "All dates"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setStatusFilter(k)}
            className="chip"
            style={{
              background: statusFilter === k ? "var(--ink)" : "transparent",
              color: statusFilter === k ? "var(--parchment)" : "var(--smoke)",
              borderColor: statusFilter === k ? "var(--ink)" : "var(--clay)",
            }}
          >
            {label}
          </button>
        ))}
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            border: "1px solid var(--clay)",
            background: "var(--parchment)",
            color: "var(--ink)",
          }}
        >
          <option value="">By destination</option>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[360px] rounded-2xl shimmer"
                style={{ background: "var(--sand)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}
          >
            <p className="font-display text-2xl" style={{ color: "var(--ink)" }}>
              No group trips found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((trip) => (
              <GroupTripCard
                key={trip.id}
                trip={trip}
                onJoin={(t) => {
                  setSelectedGroupTrip?.(t);
                  setPage("group-trip");
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
