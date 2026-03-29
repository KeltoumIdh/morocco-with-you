import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupTripsApi } from "../../lib/api";

export default function GroupTripDetailPage({ trip: seedTrip, setPage }) {
  const toast = useToast();
  const { user } = useAuth();
  const [trip, setTrip] = useState(seedTrip || null);
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(!seedTrip);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!seedTrip?.id) return;
    let mounted = true;
    const refresh = async () => {
      try {
        const data = await groupTripsApi.get(seedTrip.id);
        if (mounted) setTrip(data);
      } catch {
        // keep seed data
      } finally {
        if (mounted) setLoading(false);
      }
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [seedTrip?.id]);

  const spotsFilled = useMemo(() => {
    if (!trip) return 0;
    return Math.max(0, Number(trip.enrolled_count || 0));
  }, [trip]);

  const spotsPercent = useMemo(() => {
    if (!trip?.max_capacity) return 0;
    return Math.min(100, Math.round((spotsFilled / Number(trip.max_capacity)) * 100));
  }, [spotsFilled, trip?.max_capacity]);

  if (loading) {
    return <div className="page-enter pt-20 px-5"><div className="h-[400px] rounded-2xl shimmer" /></div>;
  }
  if (!trip) {
    return (
      <div className="page-enter pt-20 px-5 text-center">
        <p>Group trip not found.</p>
        <button className="chip mt-4" onClick={() => setPage("groups")}>Back</button>
      </div>
    );
  }

  const program = Array.isArray(trip.program) ? trip.program : [];

  const joinAndPay = async () => {
    if (!user) {
      setPage("login");
      return;
    }
    setJoining(true);
    try {
      const data = await groupTripsApi.join(trip.id, {
        guests,
        special_requests: specialRequests || undefined,
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast("Could not start payment.", "error");
    } catch (e) {
      toast(e?.message || "Failed to join trip", "error");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10 px-5 md:px-8 lg:px-10">
      <section className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--clay)" }}>
        <div
          className="h-[280px]"
          style={{
            background:
              trip.gradient ||
              "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
          }}
        />
        <div className="p-6 md:p-8" style={{ background: "var(--sand)" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,42px)", color: "var(--ink)" }}>
            {trip.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--smoke)" }}>{trip.destination}</p>
          <p className="text-sm mt-3" style={{ color: "var(--smoke)" }}>
            {spotsFilled}/{trip.max_capacity} spots filled
          </p>
          <div className="h-2 rounded-full mt-2" style={{ background: "var(--light-clay)" }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${spotsPercent}%`,
                background: "linear-gradient(135deg,var(--sage),var(--terracotta))",
              }}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
            <h2 className="font-display text-2xl mb-3">Program</h2>
            {program.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--smoke)" }}>Program will be shared soon.</p>
            ) : (
              <div className="space-y-4">
                {program.map((d, idx) => (
                  <div key={idx} className="rounded-xl p-4" style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>
                      Day {d.day || idx + 1}
                    </p>
                    <p className="font-semibold mt-1">{d.title || "Program item"}</p>
                    <ul className="mt-2 text-sm" style={{ color: "var(--smoke)" }}>
                      {(Array.isArray(d.activities) ? d.activities : []).map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
              <h3 className="font-semibold mb-2">Includes</h3>
              {(trip.includes || []).map((x, i) => <p key={i} className="text-sm" style={{ color: "var(--smoke)" }}>• {x}</p>)}
            </div>
            <div className="rounded-2xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
              <h3 className="font-semibold mb-2">Excludes</h3>
              {(trip.excludes || []).map((x, i) => <p key={i} className="text-sm" style={{ color: "var(--smoke)" }}>• {x}</p>)}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
            <h3 className="font-semibold">{trip.guide_name || "Guide info"}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--smoke)" }}>{trip.guide_bio || "Guide details coming soon."}</p>
          </div>
        </div>

        <aside className="rounded-2xl p-5 h-fit" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
          <p className="text-sm" style={{ color: "var(--smoke)" }}>Price</p>
          <p className="font-display text-3xl" style={{ color: "var(--terracotta)" }}>
            €{Number(trip.price_per_person || 0).toFixed(0)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--smoke)" }}>/person</p>

          <label className="block text-xs font-semibold mt-4 mb-1">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid var(--clay)", background: "var(--parchment)" }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>

          <label className="block text-xs font-semibold mt-4 mb-1">Special requests</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid var(--clay)", background: "var(--parchment)", resize: "none" }}
          />

          <button
            type="button"
            onClick={joinAndPay}
            disabled={joining || trip.status !== "open"}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-sm"
            style={{
              border: "none",
              color: "#fff",
              cursor: joining ? "not-allowed" : "pointer",
              opacity: joining ? 0.85 : 1,
              background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
            }}
          >
            {joining ? "Redirecting..." : "Join & Pay"}
          </button>
        </aside>
      </section>
    </div>
  );
}

