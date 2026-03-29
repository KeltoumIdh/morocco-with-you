import { Ico } from "../../icons";

export default function BookingCard({ booking }) {
  const statusColor = booking.status === "Upcoming" ? "var(--sage)" : "var(--terracotta)";

  return (
    <div className="card-lift rounded-2xl overflow-hidden" style={{ background: "var(--parchment)", boxShadow: "0 4px 20px rgba(26,20,16,.08)" }}>
      <div className="h-20 relative" style={{ background: booking.gradient }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right,rgba(26,20,16,.6),transparent)" }} />
        <div className="absolute top-3 left-4 right-4 flex justify-between items-start">
          <div>
            <h4 className="font-display text-white" style={{ fontSize: 15, fontWeight: 500 }}>{booking.title}</h4>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginTop: 1 }}>{booking.location}</p>
          </div>
          <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: statusColor, letterSpacing: ".04em" }}>
            {booking.status}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex gap-4" style={{ color: "var(--smoke)" }}>
          <div className="flex items-center gap-1"><Ico.Cal /><span style={{ fontSize: 12 }}>{booking.date}</span></div>
          <div className="flex items-center gap-1"><Ico.Users /><span style={{ fontSize: 12 }}>{booking.guests} guests</span></div>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--terracotta)" }}>{booking.total}</span>
      </div>
    </div>
  );
}
