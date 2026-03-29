import { useEffect, useMemo, useState } from "react";
import { activitiesApi } from "../../lib/api";
import { Ico } from "../icons";
import Chip from "../components/ui/Chip";
import CardSkeleton from "../components/ui/CardSkeleton";
import ActivityCard from "../components/ui/ActivityCard";
import { useDebounce } from "../../hooks/useDebounce";

const CATEGORIES = ["All", "Adventure", "Cultural", "Sport", "Relaxation", "Food", "Nature", "Family"];
const CITIES = ["All", "Marrakech", "Fès", "Casablanca", "Essaouira", "Chefchaouen", "Agadir", "Rabat", "Merzouga"];

export default function ActivitiesPage({ setPage, setSelectedActivity }) {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", city: "", search: "" });
  const debouncedSearch = useDebounce(filters.search, 300);

  const params = useMemo(() => ({
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: 60,
    offset: 0,
    sort: "rating",
  }), [filters.category, filters.city, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    activitiesApi.list(params)
      .then((res) => {
        if (!mounted) return;
        setActivities(res.activities || []);
        setTotal(res.total ?? (res.activities?.length || 0));
      })
      .catch(() => {
        if (!mounted) return;
        setActivities([]);
        setTotal(0);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [params]);

  const activeCat = filters.category || "All";
  const activeCity = filters.city || "All";

  return (
    <div className="page-enter pt-14 md:pt-0">
      <div className="px-5 md:px-8 lg:px-10 pt-6 pb-4">
        <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "var(--ink)" }}>
          Activities
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--smoke)" }}>
          {loading ? "Loading…" : `${activities.length} of ${total} activities`}
        </p>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mb-4">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl search-glow"
          style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)" }}>
          <Ico.Search />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search activities…"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--ink)", fontFamily: "'DM Sans',sans-serif" }}
          />
          {filters.search && (
            <button onClick={() => setFilters((f) => ({ ...f, search: "" }))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}>
              <Ico.X />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-3">
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={activeCat === c}
            onClick={() => setFilters((f) => ({ ...f, category: c === "All" ? "" : c }))}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-6">
        {CITIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={activeCity === c}
            onClick={() => setFilters((f) => ({ ...f, city: c === "All" ? "" : c }))}
          />
        ))}
      </div>

      <div className="px-5 md:px-8 lg:px-10 pb-24 lg:pb-10">
        {!loading && activities.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--smoke)" }}>🏄 No activities found for this filter</p>
            <p className="text-sm" style={{ color: "var(--clay)" }}>Try a different city or category</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-4">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onTap={() => { setSelectedActivity?.(a); setPage("activity"); }}
                    />
                  ))}
            </div>
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onTap={() => { setSelectedActivity?.(a); setPage("activity"); }}
                    />
                  ))}
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {loading
                ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onTap={() => { setSelectedActivity?.(a); setPage("activity"); }}
                    />
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

