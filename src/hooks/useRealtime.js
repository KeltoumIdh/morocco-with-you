import { useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export function useRealtimeBookings(userId, onUpdate) {
  useEffect(() => {
    if (!userId || typeof onUpdate !== "function") return;

    const channel = supabase
      .channel("bookings:" + userId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onUpdate(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
}

export function useRealtimeExperiences(onUpdate) {
  useEffect(() => {
    if (typeof onUpdate !== "function") return;

    const channel = supabase
      .channel("experiences:public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "experiences" },
        (payload) => onUpdate(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}

