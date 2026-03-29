/** Default in-app admin route (same Vite app as customer shell). */
export const ADMIN_DASHBOARD_DEFAULT_PATH = "/admin/dashboard";

/**
 * @returns {string} Absolute URL or same-origin path. Uses VITE_ADMIN_URL when set (e.g. separate admin host in prod).
 */
export function getAdminDashboardUrl() {
  const v = import.meta.env.VITE_ADMIN_URL;
  if (typeof v === "string" && v.trim()) return v.trim();
  return ADMIN_DASHBOARD_DEFAULT_PATH;
}

/** When true, open admin in a new tab (useful if VITE_ADMIN_URL is another origin). */
export function adminDashboardOpensInNewTab() {
  const v = import.meta.env.VITE_ADMIN_OPEN_NEW_TAB;
  return v === "1" || String(v).toLowerCase() === "true";
}
