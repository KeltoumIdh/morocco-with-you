import { useEffect, useMemo, useState } from "react";
import { accommodationsApi } from "../../lib/api";
import { Ico } from "../icons";
import Chip from "../components/ui/Chip";
import CardSkeleton from "../components/ui/CardSkeleton";
import AccommodationCard from "../components/ui/AccommodationCard";
import { useDebounce } from "../../hooks/useDebounce";

const TYPES = ["All", "Riad", "Hotel", "Guesthouse", "Villa", "Auberge", "Dar", "Apartment"];
const STARS = ["All", "1", "2", "3", "4", "5"];
const CITIES = ["All", "Marrakech", "Fès", "Casablanca", "Essaouira", "Chefchaouen", "Agadir", "Rabat"];

export default function AccommodationsPage({ setPage, setSelectedAccommodation }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", city: "", stars: "", search: "" });
  const debouncedSearch = useDebounce(filters.search, 300);

  const params = useMemo(() => ({
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.stars ? { stars: filters.stars } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: 60,
    offset: 0,
  }), [filters.type, filters.city, filters.stars, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    accommodationsApi.list(params)
      .then((res) => {
        if (!mounted) return;
        setItems(res.accommodations || []);
        setTotal(res.total ?? (res.accommodations?.length || 0));
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [params]);

  const activeType = filters.type || "All";
  const activeCity = filters.city || "All";
  const activeStars = filters.stars || "All";

  return (
    <div className="page-enter pt-14 md:pt-0">
      <div className="px-5 md:px-8 lg:px-10 pt-6 pb-4">
        <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "var(--ink)" }}>
          Hébergement
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--smoke)" }}>
          {loading ? "Loading…" : `${items.length} of ${total} accommodations`}
        </p>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mb-4">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl search-glow"
          style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)" }}>
          <Ico.Search />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search riads, hotels…"
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
        {TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            active={activeType === t}
            onClick={() => setFilters((f) => ({ ...f, type: t === "All" ? "" : t }))}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-3">
        {CITIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={activeCity === c}
            onClick={() => setFilters((f) => ({ ...f, city: c === "All" ? "" : c }))}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-6">
        {STARS.map((s) => (
          <Chip
            key={s}
            label={s === "All" ? "All stars" : `${s}★`}
            active={activeStars === s}
            onClick={() => setFilters((f) => ({ ...f, stars: s === "All" ? "" : s }))}
          />
        ))}
      </div>

      <div className="px-5 md:px-8 lg:px-10 pb-24 lg:pb-10">
        {!loading && items.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--smoke)" }}>🏡 No accommodations available</p>
            <p className="text-sm" style={{ color: "var(--clay)" }}>Try different filters</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-4">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : items.map((a) => (
                    <AccommodationCard
                      key={a.id}
                      accommodation={a}
                      onTap={() => { setSelectedAccommodation?.(a); setPage("accommodation"); }}
                    />
                  ))}
            </div>
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : items.map((a) => (
                    <AccommodationCard
                      key={a.id}
                      accommodation={a}
                      onTap={() => { setSelectedAccommodation?.(a); setPage("accommodation"); }}
                    />
                  ))}
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {loading
                ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : items.map((a) => (
                    <AccommodationCard
                      key={a.id}
                      accommodation={a}
                      onTap={() => { setSelectedAccommodation?.(a); setPage("accommodation"); }}
                    />
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

