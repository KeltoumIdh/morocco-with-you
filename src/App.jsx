import { useCallback, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import TripsPage from "./pages/TripsPage";
import BookingsPage from "./pages/BookingsPage";
import UsersPage from "./pages/UsersPage";
import PostsPage from "./pages/PostsPage";
import ActivitiesAdminPage from "./pages/ActivitiesAdminPage";
import AccommodationsAdminPage from "./pages/AccommodationsAdminPage";
import RestaurantsAdminPage from "./pages/RestaurantsAdminPage";
import PackagesAdminPage from "./pages/PackagesAdminPage";
import PlanningRequestsPage from "./pages/PlanningRequestsPage";
import ProvidersAdminPage from "./pages/ProvidersAdminPage";
import AiLogsPage from "./pages/AiLogsPage";
import PromptManagementPage from "./pages/PromptManagementPage";
import CommissionsPage from "./pages/CommissionsPage";
import EventRequestsPage from "./pages/EventRequestsPage";
import GroupTripsAdminPage from "./pages/GroupTripsAdminPage";
import ToastStack from "./components/ui/ToastStack";
import UserApp from "./user/UserApp";
import { useAuth } from "./context/AuthContext";
import Icon from "./components/Icon";
import { ICONS } from "./config/nav";

function App() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const AdminGuard = ({ children }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!user) return <AdminLoginPage />;
    if (profile?.role !== "admin") {
      const roleLabel = profile?.role ?? "(profile not loaded — check API + login)";
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xl font-bold text-slate-800">Access denied</p>
            <p className="mt-2 text-sm text-slate-500">
              The admin dashboard only opens for users whose <code className="rounded bg-slate-100 px-1 text-xs">profiles.role</code> is{" "}
              <strong>admin</strong> in Supabase.
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-700">Signed in as:</span>{" "}
                {user?.email || "—"}
              </p>
              <p className="mt-1 break-all">
                <span className="font-semibold text-slate-700">User id (use in SQL if needed):</span>{" "}
                <code className="text-xs">{user?.id || "—"}</code>
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-700">Your role:</span> {roleLabel}
              </p>
            </div>
            <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              If <code className="text-[11px]">UPDATE … WHERE email = …</code> shows <strong>0 rows</strong>, your{" "}
              <code className="text-[11px]">profiles.email</code> is often empty while Auth still has your email. Use the{" "}
              <strong>join</strong> below, or promote by <strong>id</strong>.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Fix in Supabase (SQL editor)</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{`-- Reliable: match Auth email (works even if profiles.email is null)
UPDATE profiles p
SET role = 'admin'
FROM auth.users u
WHERE p.id = u.id
  AND u.email = 'your@email.com';

-- Or by id (copy from "User id" above)
UPDATE profiles
SET role = 'admin'
WHERE id = 'paste-uuid-here';`}
            </pre>
            <p className="mt-3 text-xs text-slate-500">
              Then refresh this page. Admin URL: <strong>/admin/dashboard</strong> (not <code className="rounded bg-slate-100 px-1">/dashboard</code> unless you use the redirect).
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white no-underline hover:bg-slate-800"
            >
              Back to site
            </Link>
          </div>
        </div>
      );
    }

    return children;
  };

  function AdminLoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
      setErr("");
      setLoading(true);
      try {
        await login(email, pass);
      } catch (e) {
        setErr(e?.message || "Login failed");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5">
            <Icon d={ICONS.globe} size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-1">TravelOps Admin</h1>
          <p className="text-sm text-slate-400 mb-6">Sign in with your admin account</p>
          {err && <p className="text-sm text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-xl">{err}</p>}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@email.com"
            type="email"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm mb-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            type="password"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<UserApp />} />
        <Route path="/booking/success" element={<UserApp />} />
        <Route path="/booking/cancel" element={<UserApp />} />
        {/* Common shorthand → admin overview */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminGuard>
              <MainLayout>
                <DashboardPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <AdminGuard>
              <MainLayout>
                <TripsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/providers"
          element={
            <AdminGuard>
              <MainLayout>
                <ProvidersAdminPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/activities"
          element={
            <AdminGuard>
              <MainLayout>
                <ActivitiesAdminPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/accommodations"
          element={
            <AdminGuard>
              <MainLayout>
                <AccommodationsAdminPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/restaurants"
          element={
            <AdminGuard>
              <MainLayout>
                <RestaurantsAdminPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <AdminGuard>
              <MainLayout>
                <PackagesAdminPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/planning"
          element={
            <AdminGuard>
              <MainLayout>
                <PlanningRequestsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <AdminGuard>
              <MainLayout>
                <BookingsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/group-trips"
          element={
            <AdminGuard>
              <MainLayout>
                <GroupTripsAdminPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/group-requests"
          element={
            <AdminGuard>
              <MainLayout>
                <EventRequestsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminGuard>
              <MainLayout>
                <UsersPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/posts"
          element={
            <AdminGuard>
              <MainLayout>
                <PostsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/ai-logs"
          element={
            <AdminGuard>
              <MainLayout>
                <AiLogsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/prompts"
          element={
            <AdminGuard>
              <MainLayout>
                <PromptManagementPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route
          path="/admin/commissions"
          element={
            <AdminGuard>
              <MainLayout>
                <CommissionsPage toast={toast} />
              </MainLayout>
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastStack toasts={toasts} />
    </>
  );
}

export default App;

