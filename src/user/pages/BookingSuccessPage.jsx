import { useEffect, useState } from "react";
import { paymentsApi } from "../../lib/api";

export default function BookingSuccessPage({ setPage }) {
  const [booking, setBooking] = useState(null);
  const [err, setErr] = useState(null);
  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setErr("Missing session");
      return;
    }
    const poll = setInterval(async () => {
      try {
        const data = await paymentsApi.statusBySession(sessionId);
        if (data.payment_status === "paid") {
          setBooking(data);
          clearInterval(poll);
        }
      } catch {
        /* keep polling until timeout */
      }
    }, 1500);
    const t = setTimeout(() => clearInterval(poll), 20000);
    return () => {
      clearInterval(poll);
      clearTimeout(t);
    };
  }, [sessionId]);

  if (err) {
    return (
      <div className="page-enter flex flex-col items-center justify-center px-5" style={{ minHeight: "70vh", textAlign: "center" }}>
        <p className="text-sm" style={{ color: "var(--smoke)" }}>{err}</p>
        <button
          type="button"
          onClick={() => setPage("booking")}
          className="mt-4 px-6 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: "var(--terracotta)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Back to bookings
        </button>
      </div>
    );
  }

  return (
    <div
      className="page-enter flex flex-col items-center justify-center"
      style={{ minHeight: "80vh", padding: "40px 20px", textAlign: "center" }}
    >
      {booking ? (
        <>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              marginBottom: 20,
              background: "linear-gradient(135deg,var(--sage),var(--gold))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "scaleIn .4s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 400, color: "var(--ink)", marginBottom: 8 }}>
            Booking <em>Confirmed</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--smoke)", marginBottom: 6 }}>
            Reference: <strong>{String(booking.id || "").slice(0, 8).toUpperCase()}</strong>
          </p>
          <p style={{ fontSize: 14, color: "var(--smoke)", marginBottom: 28 }}>
            Total paid: <strong>€{Number(booking.total_amount || 0).toFixed(2)}</strong>
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({}, "", "/");
              setPage("profile");
            }}
            style={{
              padding: "14px 28px",
              borderRadius: 14,
              background: "var(--terracotta)",
              color: "#fff",
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View My Bookings
          </button>
        </>
      ) : (
        <div>
          <div
            className="animate-spin w-10 h-10 border-2 rounded-full mx-auto mb-4"
            style={{ borderColor: "var(--clay)", borderTopColor: "var(--terracotta)" }}
          />
          <p style={{ color: "var(--smoke)", fontSize: 14 }}>Confirming your payment…</p>
        </div>
      )}
    </div>
  );
}
