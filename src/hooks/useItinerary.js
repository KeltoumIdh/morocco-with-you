import { useCallback, useEffect, useState } from "react";
import { itinerariesApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useItinerary() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [itineraries, setItineraries] = useState([]);
  const [current, setCurrent]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState(null);

  const fetchItineraries = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await itinerariesApi.list();
      setItineraries(res.itineraries || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchItineraries(); }, [fetchItineraries]);

  const generate = useCallback(async ({ duration, group, budget, interests }) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await itinerariesApi.generate({ duration, group, budget, interests });
      const itinerary = res.itinerary;
      setCurrent(itinerary);
      setItineraries((prev) => [itinerary, ...prev]);
      return itinerary;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setGenerating(false);
    }
  }, []);

  const toggleSave = useCallback(async (id) => {
    try {
      const res = await itinerariesApi.save(id);
      setItineraries((prev) =>
        prev.map((it) => it.id === id ? { ...it, is_saved: res.itinerary.is_saved } : it)
      );
      if (current?.id === id) setCurrent((c) => ({ ...c, is_saved: res.itinerary.is_saved }));
    } catch (e) {
      setError(e.message);
    }
  }, [current]);

  const deleteItinerary = useCallback(async (id) => {
    try {
      await itinerariesApi.delete(id);
      setItineraries((prev) => prev.filter((it) => it.id !== id));
      if (current?.id === id) setCurrent(null);
    } catch (e) {
      setError(e.message);
    }
  }, [current]);

  return {
    itineraries, current, setCurrent,
    loading, generating, error,
    generate, toggleSave, deleteItinerary,
    reload: fetchItineraries,
  };
}
