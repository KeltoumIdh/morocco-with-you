import { useEffect, useState } from "react";
import ExperienceCard from "./ui/ExperienceCard";
import { Ico } from "../icons";
import { useAuth } from "../../context/AuthContext";
import { useExperiences } from "../../hooks/useExperiences";
import { recommendationsApi } from "../../lib/api";

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 rounded-2xl overflow-hidden" style={{ width: 220, background: "var(--sand)", border: "1px solid var(--light-clay)" }}>
      <div className="h-[160px] shimmer" style={{ background: "linear-gradient(90deg,var(--light-clay) 25%,var(--sand) 50%,var(--light-clay) 75%)", backgroundSize: "200% 100%" }} />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded-full shimmer w-3/4" style={{ background: "var(--clay)" }} />
        <div className="h-3 rounded-full shimmer w-1/2" style={{ background: "var(--clay)" }} />
      </div>
    </div>
  );
}

function recommendationToExp(r) {
  return {
    id: r.item_id,
    title: r.title || "—",
    location: r.location || r.city || "—",
    price: Number(r.price) || 0,
    gradient: r.gradient || "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
    tags: r.tags || [],
    rating: r.metadata?.rating ?? 0,
    reviews: r.metadata?.review_count ?? 0,
    duration: r.metadata?.duration ?? "",
    maxGroup: r.metadata?.max_group ?? 8,
    image_url: null,
    _itemType: r.item_type,
  };
}

export default function RecommendationsSection({ setPage, setSelectedExperience }) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { experiences, loading } = useExperiences({ sort: "rating", limit: 8 });
  const [apiRecs, setApiRecs] = useState([]);
  const [recSource, setRecSource] = useState("");
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setApiRecs([]);
      setRecSource("");
      return;
    }
    let cancelled = false;
    setLoadingRecs(true);
    recommendationsApi
      .get(8)
      .then((res) => {
        if (!cancelled) {
          setApiRecs(res.recommendations || []);
          setRecSource(res.source || "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiRecs([]);
          setRecSource("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const usePersonalised = isAuthenticated && apiRecs.length >= 2;
  const recommended = usePersonalised
    ? apiRecs.map(recommendationToExp)
    : experiences.slice(0, 6);

  const listLoading = loading || (isAuthenticated && loadingRecs);

  const subtitle = usePersonalised
    ? recSource === "vector" || recSource === "cache"
      ? "Based on your saves and bookings"
      : recSource === "featured"
        ? "Featured picks from our catalogue"
        : "Curated for you"
    : "Highest-rated experiences right now";

  if (!listLoading && recommended.length === 0) return null;

  const openRec = (exp) => {
    setSelectedExperience?.(exp);
    setPage(exp._itemType === "experience" ? "experience" : "explore");
  };

  return (
    <section className="px-5 md:px-8 lg:px-14 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
            {usePersonalised ? (
              <span className="inline-flex items-center gap-2">
                <span style={{ color: "var(--gold)" }}>✦</span>
                <span>AI-powered</span>
              </span>
            ) : (
              "✦ Trending"
            )}
          </p>
          <h2 className="font-display" style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 400, color: "var(--ink)" }}>
            {isAuthenticated ? <>Picked <em>For You</em></> : <>Popular <em>This Week</em></>}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--smoke)" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {usePersonalised && (recSource === "vector" || recSource === "cache") ? (
            <span
              style={{
                fontSize: 11,
                color: "var(--gold)",
                background: "rgba(212,168,83,.1)",
                padding: "4px 10px",
                borderRadius: 100,
                fontWeight: 500,
              }}
            >
              ✨ Based on your history
            </span>
          ) : null}
          <button
            onClick={() => setPage("explore")}
            className="hidden sm:flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--terracotta)", background: "none", border: "none", cursor: "pointer" }}
          >
            View all <Ico.Arrow />
          </button>
        </div>
      </div>

      <div className="md:hidden flex gap-4 overflow-x-auto pb-3 snap-x -mx-5 px-5">
        {listLoading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : recommended.map((exp) => (
              <div key={exp.id} className="flex-shrink-0 snap-s" style={{ width: 220 }}>
                <ExperienceCard exp={exp} compact onTap={() => openRec(exp)} />
              </div>
            ))}
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5">
        {listLoading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "var(--sand)", border: "1px solid var(--light-clay)" }}>
                <div className="h-[220px] shimmer" style={{ background: "linear-gradient(90deg,var(--light-clay) 25%,var(--sand) 50%,var(--light-clay) 75%)", backgroundSize: "200% 100%" }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded-full shimmer w-3/4" style={{ background: "var(--clay)" }} />
                  <div className="h-3 rounded-full shimmer w-1/2" style={{ background: "var(--clay)" }} />
                </div>
              </div>
            ))
          : recommended.map((exp) => (
              <ExperienceCard key={exp.id} exp={exp} onTap={() => openRec(exp)} />
            ))}
      </div>
    </section>
  );
}
