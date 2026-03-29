import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx.toast;
}

const ICONS = {
  success: "✦",
  error:   "✕",
  info:    "◈",
  warning: "⚠",
};

function ToastStack({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} className="bubble-in"
          onClick={() => dismiss(t.id)}
          style={{
            pointerEvents: "auto",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderRadius: 16,
            background: "var(--parchment)",
            boxShadow: "0 8px 32px rgba(26,20,16,.18)",
            borderLeft: `3px solid ${t.type === "error" ? "var(--terracotta)" : t.type === "success" ? "var(--sage)" : "var(--gold)"}`,
            minWidth: 240,
            maxWidth: 380,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            fontFamily: "'DM Sans',sans-serif",
          }}>
          <span style={{ color: t.type === "error" ? "var(--terracotta)" : t.type === "success" ? "var(--sage)" : "var(--gold)", flexShrink: 0, fontSize: 14 }}>
            {ICONS[t.type] || ICONS.info}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
