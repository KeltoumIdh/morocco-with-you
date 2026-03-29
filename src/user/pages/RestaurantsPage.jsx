import { useEffect, useMemo, useState } from "react";
import { restaurantsApi } from "../../lib/api";
import { Ico } from "../icons";
import Chip from "../components/ui/Chip";
import CardSkeleton from "../components/ui/CardSkeleton";
import RestaurantCard from "../components/ui/RestaurantCard";
import { useDebounce } from "../../hooks/useDebounce";

const PRICE = ["All", "€", "€€", "€€€", "€€€€"];
const CITIES = ["All", "Marrakech", "Fès", "Casablanca", "Essaouira", "Chefchaouen", "Agadir", "Rabat"];
const CUISINES = ["All", "Moroccan", "Seafood", "International", "Vegetarian", "Fusion"];

export default function RestaurantsPage({ setPage, setSelectedRestaurant }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: "", cuisine: "", price_range: "", search: "" });
  const debouncedSearch = useDebounce(filters.search, 300);

  const params = useMemo(() => ({
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.cuisine ? { cuisine: filters.cuisine } : {}),
    ...(filters.price_range ? { price_range: filters.price_range } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: 60,
    offset: 0,
  }), [filters.city, filters.cuisine, filters.price_range, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    restaurantsApi.list(params)
      .then((res) => {
        if (!mounted) return;
        setItems(res.restaurants || []);
        setTotal(res.total ?? (res.restaurants?.length || 0));
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [params]);

  const activeCity = filters.city || "All";
  const activeCuisine = filters.cuisine || "All";
  const activePrice = filters.price_range || "All";

  return (
    <div className="page-enter pt-14 md:pt-0">
      <div className="px-5 md:px-8 lg:px-10 pt-6 pb-4">
        <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "var(--ink)" }}>
          Restaurants
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--smoke)" }}>
          {loading ? "Loading…" : `${items.length} of ${total} restaurants`}
        </p>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mb-4">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl search-glow"
          style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)" }}>
          <Ico.Search />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search restaurants…"
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
        {CITIES.map((c) => (
          <Chip key={c} label={c} active={activeCity === c} onClick={() => setFilters((f) => ({ ...f, city: c === "All" ? "" : c }))} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-3">
        {CUISINES.map((c) => (
          <Chip key={c} label={c} active={activeCuisine === c} onClick={() => setFilters((f) => ({ ...f, cuisine: c === "All" ? "" : c }))} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-6">
        {PRICE.map((p) => (
          <Chip key={p} label={p === "All" ? "Any price" : p} active={activePrice === p} onClick={() => setFilters((f) => ({ ...f, price_range: p === "All" ? "" : p }))} />
        ))}
      </div>

      <div className="px-5 md:px-8 lg:px-10 pb-24 lg:pb-10">
        {!loading && items.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--smoke)" }}>🍽 No restaurants found</p>
            <p className="text-sm" style={{ color: "var(--clay)" }}>Try a different filter or search term</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-4">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : items.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onTap={() => { setSelectedRestaurant?.(r); setPage("restaurant"); }} />
                  ))}
            </div>
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
              {loading
                ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : items.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onTap={() => { setSelectedRestaurant?.(r); setPage("restaurant"); }} />
                  ))}
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {loading
                ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
                : items.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} onTap={() => { setSelectedRestaurant?.(r); setPage("restaurant"); }} />
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

