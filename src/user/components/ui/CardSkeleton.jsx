export default function CardSkeleton({ height = 220 }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>
      <div className="shimmer" style={{ height, background: "linear-gradient(90deg,var(--light-clay) 25%,var(--sand) 50%,var(--light-clay) 75%)", backgroundSize: "200% 100%" }} />
      <div className="p-4 space-y-2">
        <div className="shimmer rounded-lg" style={{ height: 16, width: "70%", background: "var(--clay)" }} />
        <div className="shimmer rounded-lg" style={{ height: 12, width: "45%", background: "var(--clay)" }} />
        <div className="shimmer rounded-lg" style={{ height: 12, width: "55%", background: "var(--clay)" }} />
      </div>
    </div>
  );
}

