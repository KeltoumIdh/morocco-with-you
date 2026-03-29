function Card({ children, className = "", lift = false, p = "p-5" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${
        lift ? "card-lift" : ""
      } ${p} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;

