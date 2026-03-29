import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Select } from "../components/ui/FormControls";
import KpiCard from "../components/ui/KpiCard";
import { SPK } from "../data/mock";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

const rowFromProfile = (p) => {
  const name = p.full_name || "Traveler";
  return {
    id: p.id,
    name,
    email: p.email || "",
    location: p.location || "—",
    bookings: Number(p.booking_count) || 0,
    spent: Number(p.total_spent) || 0,
    joined: p.created_at ? new Date(p.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—",
    role: p.role || "user",
    avatar: name.slice(0, 2).toUpperCase(),
  };
};

function UsersPage({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminApi.users.list();
      setUsers((rows || []).map(rowFromProfile));
    } catch (e) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const handleEditSave = async () => {
    try {
      const updated = await adminApi.users.update(editForm.id, {
        full_name: editForm.name,
        location: editForm.location,
        role: editForm.role,
      });
      setUsers((prev) => prev.map((u) => (u.id === editForm.id ? rowFromProfile(updated) : u)));
      toast?.("User updated", "success");
      setEditTarget(null);
    } catch (e) {
      toast?.(e?.message || "Failed to update user", "error");
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="syne text-2xl font-semibold text-slate-800">Users</h1>
        <p className="text-xs text-slate-400 mt-1">Manage platform users and their activity.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total Users"
          value={users.length.toLocaleString()}
          sub="All profiles"
          trendUp
          icon="users"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          spark={SPK.users}
          sparkColor="#3b82f6"
        />
        {[
          ["Admins", users.filter((u) => u.role === "admin").length.toLocaleString(), "role = admin", "bg-emerald-50", "text-emerald-700"],
          ["Bookings", users.reduce((s, u) => s + (Number(u.bookings) || 0), 0).toLocaleString(), "confirmed bookings", "bg-slate-50", "text-slate-600"],
          ["Total Spent", "$" + users.reduce((s, u) => s + (Number(u.spent) || 0), 0).toLocaleString(), "confirmed revenue", "bg-amber-50", "text-amber-700"],
        ].map(([l, v, s, bg, c]) => (
          <div key={l} className={`${bg} rounded-2xl px-4 py-3`}>
            <p className="text-xs text-slate-400">{l}</p>
            <p className={`syne text-xl font-semibold mt-1 ${c}`}>{v}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon
              d={ICONS.search}
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-300 outline-none"
            />
          </div>
          <Button variant="ghost" icon="export" size="xs">
            Export CSV
          </Button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Table
            columns={[
              {
                key: "name",
                label: "User",
                render: (v, r) => (
                  <div className="flex items-center gap-3">
                    <Avatar initials={r.avatar} size="lg" />
                    <div>
                      <p className="font-semibold text-slate-800">{v}</p>
                      <p className="text-xs text-slate-400">{r.email || "—"}</p>
                    </div>
                  </div>
                ),
              },
              { key: "location", label: "Location" },
              { key: "bookings", label: "Bookings", render: (v) => <span className="font-bold">{v}</span> },
              {
                key: "spent",
                label: "Total Spent",
                render: (v) => <span className="font-bold text-slate-800">${Number(v || 0).toLocaleString()}</span>,
              },
              { key: "joined", label: "Joined", render: (v) => <span className="text-xs text-slate-400">{v}</span> },
              {
                key: "role",
                label: "Role",
                render: (v) => (
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                      v === "admin"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {v}
                  </span>
                ),
              },
            ]}
            data={filtered}
            actions={(row) => (
              <>
                <Button variant="ghost" size="xs" icon="eye" onClick={() => setViewTarget(row)}>
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  icon="edit"
                  onClick={() => {
                    setEditForm({ ...row });
                    setEditTarget(row);
                  }}
                >
                  Edit
                </Button>
              </>
            )}
          />
        )}
      </Card>

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="User Profile"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            <Button
              variant="blue"
              icon="edit"
              onClick={() => {
                setEditForm({ ...viewTarget });
                setEditTarget(viewTarget);
                setViewTarget(null);
              }}
            >
              Edit User
            </Button>
          </>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <Avatar initials={viewTarget.avatar} size="xl" />
              <div>
                <p className="syne font-semibold text-slate-800 text-lg">{viewTarget.name}</p>
                <p className="text-sm text-slate-500">{viewTarget.email}</p>
                <div className="mt-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Role: <span className="text-slate-800">{viewTarget.role}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Location", viewTarget.location],
                ["Joined", viewTarget.joined],
                ["Bookings", viewTarget.bookings],
                ["Total Spent", `$${viewTarget.spent?.toLocaleString()}`],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit User"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button variant="blue" onClick={handleEditSave}>
              Save Changes
            </Button>
          </>
        }
      >
        {editForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" value={editForm.email} disabled />
              <Select
                label="Role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UsersPage;

