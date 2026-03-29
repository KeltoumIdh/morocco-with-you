import { useCallback, useEffect, useState } from "react";
import { bookingsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useBookings() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.list();
      setBookings(res.bookings || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const createBooking = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.create(payload);
      setBookings((prev) => [res.booking, ...prev]);
      return res.booking;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (id) => {
    try {
      const res = await bookingsApi.cancel(id);
      setBookings((prev) => prev.map((b) => b.id === id ? res.booking : b));
      return res.booking;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  return { bookings, setBookings, loading, error, createBooking, cancelBooking, reload: fetchBookings };
}
