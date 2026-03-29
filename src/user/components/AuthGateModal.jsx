import { Ico } from "../icons";

export default function AuthGateModal({ onLogin, onRegister, onClose, message }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(26,20,16,.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-7 modal-panel"
        style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>

        {/* Close */}
        <div className="flex justify-end mb-1">
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}>
            <Ico.X />
          </button>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>
          <span style={{ color: "#fff", fontSize: 22 }}>✦</span>
        </div>

        <h2 className="font-display text-center mb-2" style={{ fontSize: 24, fontWeight: 400, color: "var(--ink)" }}>
          Sign in to <em>continue</em>
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "var(--smoke)" }}>
          {message || "Create a free account to book experiences, save favourites, and plan your Morocco journey."}
        </p>

        <div className="space-y-3">
          <button onClick={onLogin}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(192,101,74,.3)" }}>
            Sign In
          </button>
          <button onClick={onRegister}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "transparent", color: "var(--ink)", border: "1.5px solid var(--clay)", cursor: "pointer" }}>
            Create Free Account
          </button>
          <button onClick={onClose}
            className="w-full py-2.5 text-sm"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--smoke)" }}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
