import { useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "../Icon";
import { ICONS } from "../../config/nav";

function Modal({ open, onClose, title, children, size = "md", footer }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    full: "max-w-5xl",
  };

  const node = (
    <div
      className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 min-h-[100dvh]"
      style={{
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`modal-panel w-full ${widths[size]} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[min(90dvh,900px)] sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="syne font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <Icon d={ICONS.x} size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

export default Modal;

