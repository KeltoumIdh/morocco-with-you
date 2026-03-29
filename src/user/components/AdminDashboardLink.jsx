import { useAuth } from "../../context/AuthContext";
import { Ico } from "../icons";
import { adminDashboardOpensInNewTab, getAdminDashboardUrl } from "../lib/adminDashboardUrl";

/**
 * Shown only when profile.role === 'admin' (see AuthContext isAdmin).
 * data-testid for E2E: user-admin-dashboard-link
 */
export default function AdminDashboardLink({ variant = "inline" }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

  const href = getAdminDashboardUrl();
  const newTab = adminDashboardOpensInNewTab();
  const rel = newTab ? "noopener noreferrer" : undefined;
  const target = newTab ? "_blank" : undefined;

  const baseStyle = {
    textDecoration: "none",
    fontWeight: 600,
    fontSize: variant === "sidebar" ? 13 : 12,
    color: "var(--terracotta)",
    border: "1px solid rgba(192,101,74,.35)",
    borderRadius: 12,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(192,101,74,.06)",
  };

  const pad =
    variant === "sidebar"
      ? { padding: "10px 14px", width: "100%", justifyContent: "center" }
      : variant === "button"
        ? { padding: "12px 18px", width: "100%", justifyContent: "center", fontSize: 14 }
        : { padding: "6px 12px" };

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      data-testid="user-admin-dashboard-link"
      className="admin-dashboard-link"
      style={{ ...baseStyle, ...pad }}
    >
      <span style={{ display: "flex", color: "var(--terracotta)", flexShrink: 0 }} aria-hidden>
        <Ico.Map />
      </span>
      Admin dashboard
      {newTab && (
        <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 500 }}>(new tab)</span>
      )}
    </a>
  );
}
