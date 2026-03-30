import { useCallback, useEffect, useMemo, useState } from "react";
import ExperienceCard from "../components/ui/ExperienceCard";
import Chip from "../components/ui/Chip";
import { Ico } from "../icons";
import { useExperiences } from "../../hooks/useExperiences";
import { useDebounce } from "../../hooks/useDebounce";
import { searchApi } from "../../lib/api";

const ALL_TAGS = ["All", "Adventure", "Desert", "Food", "Culture", "Hiking", "Nature", "Luxury", "Photo", "Surf"];
const SORT_OPTIONS = [
  { value: "rating",     label: "Top Rated" },
  { value: "price_asc",  label: "Price: Low" },
  { value: "price_desc", label: "Price: High" },
  { value: "newest",     label: "Newest" },
];

function mapSemanticRow(r) {
  const sim = r.similarity != null && Number.isFinite(Number(r.similarity))
    ? Math.round(Number(r.similarity) * 100)
    : null;
  return {
    id: r.item_id,
    title: r.title || "—",
    location: r.location || "—",
    description: "",
    price: Number(r.price) || 0,
    duration: r.metadata?.duration || "",
    route: r.city || "",
    maxGroup: r.metadata?.max_group ?? 8,
    tags: Array.isArray(r.tags) ? r.tags : [],
    gradient: r.gradient || "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
    rating: Number(r.metadata?.rating) || 0,
    reviews: Number(r.metadata?.review_count) || 0,
    image_url: null,
    semanticMatchPct: sim != null ? `${sim}%` : null,
  };
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sand)", border: "1px solid var(--light-clay)" }}>
      <div className="h-[220px]" style={{ background: "linear-gradient(90deg,var(--light-clay) 25%,var(--sand) 50%,var(--light-clay) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite" }} />
      <div className="p-4 space-y-2">
        <div className="h-3 rounded-full w-3/4" style={{ background: "var(--clay)" }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: "var(--clay)" }} />
      </div>
    </div>
  );
}

export default function ExplorePage({
  setPage,
  setSelectedExperience,
  initialSearch = "",
}) {
  const [activeTag, setActiveTag] = useState("All");
  const [sort, setSort] = useState("rating");
  const [search, setSearch] = useState(() => initialSearch);
  const debouncedSearch = useDebounce(search, 300);
  const semanticQuery = useDebounce(search, 500);

  const [searchMode, setSearchMode] = useState("filter");
  const [semanticResults, setSemanticResults] = useState([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const params = useMemo(() => ({
    sort,
    ...(activeTag !== "All" ? { tags: activeTag } : {}),
  }), [activeTag, sort]);

  const { experiences, loading, hasMore, loadMore, total } = useExperiences(params);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return experiences;
    return experiences.filter((e) =>
      e.title?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
    );
  }, [experiences, debouncedSearch]);

  useEffect(() => {
    const q = semanticQuery.trim();
    if (q.length < 3) {
      setSearchMode("filter");
      setSemanticResults([]);
      return;
    }

    let cancelled = false;
    setSemanticLoading(true);

    searchApi
      .semantic(q, { type: "experience", limit: "24", threshold: "0.5" })
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.results) ? res.results : [];
        setSemanticResults(rows);
        setSearchMode(rows.length ? "semantic" : "filter");
      })
      .catch(() => {
        if (!cancelled) {
          setSearchMode("filter");
          setSemanticResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSemanticLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [semanticQuery]);

  const semanticMapped = useMemo(
    () => semanticResults.map(mapSemanticRow),
    [semanticResults]
  );

  const displayList = useMemo(() => {
    const base = searchMode === "semantic" ? semanticMapped : filtered;
    if (activeTag === "All") return base;
    return base.filter(
      (e) =>
        Array.isArray(e.tags) &&
        e.tags.some((t) => String(t).trim().toLowerCase() === activeTag.toLowerCase())
    );
  }, [searchMode, semanticMapped, filtered, activeTag]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading…";
    if (searchMode === "semantic") {
      return `${displayList.length} match${displayList.length === 1 ? "" : "es"} (AI search)`;
    }
    return `${displayList.length} of ${total} experiences`;
  }, [loading, searchMode, displayList.length, total]);

  const handleTagChange = useCallback((tag) => {
    setActiveTag(tag);
  }, []);

  const showLoadMore = searchMode === "filter" && hasMore && !loading;

  return (
    <div className="page-enter pt-14 md:pt-0">
      <div className="px-5 md:px-8 lg:px-10 pt-6 pb-4">
        <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "var(--ink)" }}>
          Explore <em>Morocco</em>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--smoke)" }}>
          {countLabel}
        </p>
      </div>

      <div className="px-5 md:px-8 lg:px-10 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl search-glow"
          style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)" }}>
          <Ico.Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experiences or destinations…"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--ink)", fontFamily: "'DM Sans',sans-serif" }}
          />
          {semanticLoading ? (
            <span className="text-xs animate-pulse" style={{ color: "var(--terracotta)" }}>…</span>
          ) : null}
          {searchMode === "semantic" && semanticQuery.trim().length >= 3 ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap px-2 py-0.5 rounded-full" style={{ background: "rgba(212,168,83,.25)", color: "var(--ink)" }}>
              AI search
            </span>
          ) : null}
          {search ? (
            <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}>
              <Ico.X />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)" }}>
          <Ico.Filter />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent border-none outline-none text-sm cursor-pointer"
            style={{ color: "var(--ink)", fontFamily: "'DM Sans',sans-serif" }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-5 md:px-8 lg:px-10 mb-6">
        {ALL_TAGS.map((tag) => (
          <Chip key={tag} label={tag} active={activeTag === tag} onClick={() => handleTagChange(tag)} />
        ))}
      </div>

      <div className="px-5 md:px-8 lg:px-10 pb-24 lg:pb-10">
        {!loading && displayList.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--smoke)" }}>No experiences found</p>
            <p className="text-sm" style={{ color: "var(--clay)" }}>Try a different filter or search term</p>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-4">
              {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : displayList.map((exp) => (
                <ExperienceCard key={exp.id} exp={exp} onTap={() => { setSelectedExperience?.(exp); setPage("experience"); }} />
              ))}
            </div>
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
              {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : displayList.map((exp) => (
                <ExperienceCard key={exp.id} exp={exp} onTap={() => { setSelectedExperience?.(exp); setPage("experience"); }} />
              ))}
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : displayList.map((exp) => (
                <ExperienceCard key={exp.id} exp={exp} onTap={() => { setSelectedExperience?.(exp); setPage("experience"); }} />
              ))}
            </div>

            {showLoadMore ? (
              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={loadMore}
                  className="px-8 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", color: "var(--ink)", cursor: "pointer" }}
                >
                  Load more experiences
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
