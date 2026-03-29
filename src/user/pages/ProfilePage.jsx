import { useEffect, useRef, useState } from "react";
import { Ico } from "../icons";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../context/AuthContext";
import AdminDashboardLink from "../components/AdminDashboardLink";
import { useToast } from "../../context/ToastContext";
import { api, profileApi } from "../../lib/api";
import { useRealtimeBookings } from "../../hooks/useRealtime";

const BADGES = [
  { icon: "🌙", label: "Night Traveler", desc: "Sahara overnight" },
  { icon: "🏔️", label: "Atlas Hiker",    desc: "Mountain trek" },
  { icon: "🍜", label: "Food Explorer",  desc: "5 food tours" },
  { icon: "📸", label: "Photographer",   desc: "Blue city visit" },
];

const STAR_RATING = (n, setN) =>
  Array.from({ length: 5 }, (_, i) => (
    <button key={i} type="button" onClick={() => setN(i + 1)}
      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: i < n ? "var(--gold)" : "var(--clay)", padding: "0 2px" }}>
      ★
    </button>
  ));

function ReviewModal({ booking, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(5);
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ booking_id: booking.id, experience_id: booking.experience_id, rating, comment });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(26,20,16,.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-7 modal-panel"
        style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 400, color: "var(--ink)" }}>
            Leave a <em>Review</em>
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}>
            <Ico.X />
          </button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--smoke)" }}>
          How was your experience at <strong>{booking.title}</strong>?
        </p>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-4">
            {STAR_RATING(rating, setRating)}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
            placeholder="Share your experience with future travellers…"
            className="form-input w-full mb-4" style={{ resize: "none" }} />
          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .8 : 1 }}>
            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</> : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage({ setPage }) {
  const toast = useToast();
  const { user, logout, isAdmin } = useAuth();
  const { profile, stats, loading, updateProfile, reload } = useProfile();

  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [draft,      setDraft]      = useState({});
  const [uploading,  setUploading]  = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const fileRef = useRef(null);

  const displayName  = profile?.full_name  || user?.user_metadata?.full_name || "Traveler";
  const displayEmail = user?.email || "";
  const initials     = displayName.charAt(0).toUpperCase();
  const avatarUrl    = profile?.avatar_url || user?.user_metadata?.avatar_url;

  // Realtime: booking status updates → refresh stats + toast
  useRealtimeBookings(user?.id, (payload) => {
    if (payload?.eventType !== "UPDATE") return;
    const next = payload?.new;
    if (!next?.status) return;
    if (next.status === "confirmed") toast("Your booking has been confirmed ✓", "success");
    if (next.status === "cancelled") toast("Your booking was cancelled.", "warning");
    // refresh counts/spent
    reload?.();
  });

  const startEdit = () => {
    setDraft({ full_name: displayName, location: profile?.location || "", language: profile?.language || "en" });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateProfile(draft);
      setEditing(false);
      toast("Profile updated", "success");
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Image must be under 2 MB", "warning"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      await api.post("/profile/avatar", { base64, filename: file.name });
      await reload();
      toast("Avatar updated!", "success");
    } catch {
      toast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleReviewSubmit = async (payload) => {
    try {
      await profileApi.review(payload);
      toast("Review submitted — thank you!", "success");
    } catch {
      toast("Could not submit review. Please try again.", "error");
    }
  };

  const handleLogout = async () => {
    await logout();
    setPage("home");
  };

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10 px-5 md:px-8 lg:px-10">
      <div className="max-w-2xl mx-auto py-8">

        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center text-white text-3xl font-display font-medium"
              style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : (loading ? "…" : initials)
              }
            </div>
            <button onClick={handleAvatarClick} disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", cursor: "pointer" }}>
              {uploading
                ? <span className="w-3 h-3 border-2 border-terracotta/40 border-t-terracotta rounded-full animate-spin" />
                : <Ico.Upload />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {editing ? (
            <div className="w-full space-y-3 mb-4">
              <input value={draft.full_name || ""} onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl text-center font-display text-lg"
                style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", color: "var(--ink)", fontFamily: "'Cormorant Garamond',serif", outline: "none" }} />
              <input value={draft.location || ""} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="Your location"
                className="w-full px-4 py-3 rounded-xl text-sm text-center"
                style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", color: "var(--smoke)", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer" }}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-5 py-3 rounded-xl text-sm"
                  style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display mb-1" style={{ fontSize: 28, fontWeight: 500, color: "var(--ink)" }}>{displayName}</h1>
              <p className="text-sm mb-1" style={{ color: "var(--smoke)" }}>{displayEmail}</p>
              {profile?.location && <p className="text-sm flex items-center gap-1 justify-center" style={{ color: "var(--smoke)" }}><Ico.Pin />{profile.location}</p>}
              <button onClick={startEdit} className="mt-3 text-xs px-4 py-1.5 rounded-xl"
                style={{ background: "var(--light-clay)", color: "var(--smoke)", border: "none", cursor: "pointer" }}>
                Edit profile
              </button>
              {isAdmin && (
                <div className="mt-5 w-full max-w-xs mx-auto">
                  <AdminDashboardLink variant="button" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Bookings", value: stats.booking_count ?? 0 },
            { label: "Saved",    value: stats.saved_count ?? 0 },
            { label: "Reviews",  value: 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
              style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
              <p className="font-display" style={{ fontSize: 26, fontWeight: 500, color: "var(--terracotta)" }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--smoke)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="font-display mb-4" style={{ fontSize: 22, fontWeight: 400, color: "var(--ink)" }}>Travel <em>Badges</em></h2>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-3 rounded-2xl p-4"
                style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{b.label}</p>
                  <p className="text-xs" style={{ color: "var(--smoke)" }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-2 mb-6">
          {[
            { label: "My Bookings",        icon: <Ico.Cal />,     page: "booking" },
            { label: "Saved Experiences",  icon: <Ico.Heart />,   page: "explore" },
            { label: "My Itineraries",     icon: <Ico.Map />,     page: "itinerary" },
            { label: "AI Chat History",    icon: <Ico.Chat />,    page: "chat" },
          ].map((item) => (
            <button key={item.label} onClick={() => setPage(item.page)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all"
              style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)", cursor: "pointer" }}>
              <div className="flex items-center gap-3" style={{ color: "var(--ink)" }}>
                <span style={{ color: "var(--terracotta)" }}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <Ico.Arrow />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-4 rounded-2xl text-sm font-medium"
          style={{ background: "transparent", color: "var(--smoke)", border: "1.5px solid var(--clay)", cursor: "pointer" }}>
          Sign out
        </button>
      </div>

      {/* Review modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
