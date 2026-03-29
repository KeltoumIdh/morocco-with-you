import { useCallback, useEffect, useRef, useState } from "react";
import { experiencesApi } from "../lib/api";
import { EXPERIENCES as FALLBACK } from "../user/data/experiences";
import { useRealtimeExperiences } from "./useRealtime";

export function useExperiences(params = {}) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [hasMore, setHasMore]         = useState(false);
  const [total, setTotal]             = useState(0);
  const offsetRef = useRef(0);
  const LIMIT = 12;

  const mapRow = useCallback((e) => {
    // Normalize API shape (snake_case) to UI shape (camelCase)
    const priceNum =
      typeof e?.price === "number"
        ? e.price
        : Number(String(e?.price ?? "").replace(/[^\d.]/g, ""));

    return {
      id: e?.id,
      title: e?.title || "",
      location: e?.location || "",
      description: e?.description || "",
      price: Number.isFinite(priceNum) ? priceNum : 0,
      duration: e?.duration || "",
      route: e?.route || "",
      maxGroup: e?.max_group ?? e?.maxGroup ?? 8,
      tags: Array.isArray(e?.tags) ? e.tags : [],
      gradient: e?.gradient || "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
      rating: Number(e?.rating ?? e?.avg_rating ?? 0) || 0,
      reviews: Number(e?.review_count ?? e?.reviews ?? 0) || 0,
      is_active: e?.is_active !== false,
      featured: !!e?.featured,
      created_at: e?.created_at,
      updated_at: e?.updated_at,
      image_url: e?.image_url || null,
    };
  }, []);

  const fetch = useCallback(async (reset = true) => {
    setLoading(true);
    setError(null);
    try {
      const offset = reset ? 0 : offsetRef.current;
      const res = await experiencesApi.list({ ...params, limit: LIMIT, offset });
      const list = (res.experiences || []).map(mapRow);
      setExperiences((prev) => (reset ? list : [...prev, ...list]));
      setTotal(res.total ?? list.length);
      setHasMore(list.length === LIMIT);
      offsetRef.current = offset + list.length;
    } catch {
      // Graceful fallback to static data when server is offline
      const fb = (FALLBACK || []).map((e) => ({
        ...e,
        price: Number(String(e.price || "").replace(/[^\d.]/g, "")) || 0,
      }));
      setExperiences(fb);
      setTotal(fb.length);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(true); }, [fetch]);

  // Realtime sync (admin create/update/delete reflects instantly)
  useRealtimeExperiences((payload) => {
    const event = payload?.eventType;
    const rowNew = payload?.new ? mapRow(payload.new) : null;
    const rowOld = payload?.old ? mapRow(payload.old) : null;

    // Apply tag filter locally to avoid showing items that don't match
    const wantedTag = params?.tags ? String(params.tags) : null;
    const tagOk = (row) => {
      if (!wantedTag) return true;
      if (!Array.isArray(row?.tags)) return false;
      const w = wantedTag.trim().toLowerCase();
      return row.tags.some((t) => String(t).trim().toLowerCase() === w);
    };

    if (event === "DELETE") {
      const id = payload?.old?.id;
      if (!id) return;
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      return;
    }

    if (!rowNew?.id) return;
    if (rowNew.is_active === false) {
      setExperiences((prev) => prev.filter((e) => e.id !== rowNew.id));
      return;
    }

    if (event === "INSERT") {
      if (!tagOk(rowNew)) return;
      setExperiences((prev) => (prev.some((e) => e.id === rowNew.id) ? prev : [rowNew, ...prev]));
      return;
    }

    if (event === "UPDATE") {
      // If it no longer matches current filter, remove it
      if (!tagOk(rowNew)) {
        setExperiences((prev) => prev.filter((e) => e.id !== rowNew.id));
        return;
      }
      setExperiences((prev) => prev.map((e) => (e.id === rowNew.id ? { ...e, ...rowNew } : e)));
      return;
    }

    // Fallback: treat as update
    if (rowOld?.id) {
      setExperiences((prev) => prev.map((e) => (e.id === rowNew.id ? { ...e, ...rowNew } : e)));
    }
  });

  const loadMore = () => fetch(false);

  return { experiences, setExperiences, loading, error, hasMore, total, reload: () => fetch(true), loadMore };
}
