export default function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? "chip-active" : "chip-inactive"}`}
    >
      {label}
    </button>
  );
}
