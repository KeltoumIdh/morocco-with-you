import { useCallback, useEffect, useState } from "react";
import { profileApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useProfile() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [profile, setProfile]   = useState(null);
  const [stats, setStats]       = useState({ booking_count: 0, saved_count: 0, total_spent: 0 });
  const [saved, setSaved]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, savedRes] = await Promise.all([
        profileApi.get(),
        profileApi.getSaved(),
      ]);
      setProfile(profileRes.profile);
      setStats(profileRes.stats || { booking_count: 0, saved_count: 0, total_spent: 0 });
      setSaved(savedRes.saved || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await profileApi.update(updates);
      setProfile(res.profile);
      return res.profile;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  const saveExperience = useCallback(async (experienceId) => {
    try {
      await profileApi.save(experienceId);
      setSaved((prev) => {
        const already = prev.find((e) => e.id === experienceId);
        return already ? prev : [{ id: experienceId }, ...prev];
      });
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const unsaveExperience = useCallback(async (experienceId) => {
    try {
      await profileApi.unsave(experienceId);
      setSaved((prev) => prev.filter((e) => e.id !== experienceId));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const isSaved = useCallback((id) => saved.some((e) => e.id === id), [saved]);

  return {
    profile, stats, saved, loading, error,
    updateProfile, saveExperience, unsaveExperience, isSaved,
    reload: fetchProfile,
  };
}
