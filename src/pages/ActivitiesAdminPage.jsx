import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Icon from "../components/Icon";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Select, TagInput, Textarea } from "../components/ui/FormControls";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";
import { ICONS } from "../config/nav";

const emptyActivity = () => ({
  id: "",
  title: "",
  location: "",
  city: "",
  category: "Adventure",
  price: "",
  price_type: "per_person",
  duration: "",
  max_group: 20,
  min_age: 0,
  description: "",
  tags: [],
  includedText: "",
  gradient: "",
  image_urlsText: "",
  is_active: true,
  featured: false,
});

function ActivityForm({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Title" required value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
        <Input label="Location" required value={data.location} onChange={(e) => onChange({ ...data, location: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="City" value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })} />
        <Select label="Category" required value={data.category} onChange={(e) => onChange({ ...data, category: e.target.value })}>
          {["Adventure", "Cultural", "Sport", "Relaxation", "Food", "Nature", "Family", "Photography"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Price" type="number" value={data.price} onChange={(e) => onChange({ ...data, price: e.target.value })} />
        <Select label="Price type" value={data.price_type} onChange={(e) => onChange({ ...data, price_type: e.target.value })}>
          {["per_person", "per_group", "free", "on_request"].map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Duration" value={data.duration} onChange={(e) => onChange({ ...data, duration: e.target.value })} />
        <Input label="Max group" type="number" value={data.max_group} onChange={(e) => onChange({ ...data, max_group: e.target.value })} />
        <Input label="Min age" type="number" value={data.min_age} onChange={(e) => onChange({ ...data, min_age: e.target.value })} />
      </div>
      <Textarea label="Description" rows={4} value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <TagInput value={data.tags} onChange={(tags) => onChange({ ...data, tags })} />
      <Textarea
        label="Included (one per line)"
        rows={4}
        value={data.includedText}
        onChange={(e) => onChange({ ...data, includedText: e.target.value })}
      />
      <Input label="Gradient (CSS)" value={data.gradient} onChange={(e) => onChange({ ...data, gradient: e.target.value })} />
      <Input
        label="Image URLs (comma-separated)"
        value={data.image_urlsText}
        onChange={(e) => onChange({ ...data, image_urlsText: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-slate-600 mb-1.5">Active</p>
          <button
            type="button"
            onClick={() => onChange({ ...data, is_active: !data.is_active })}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${
              data.is_active ? "bg-blue-500" : "bg-slate-200"
            }`}
          >
            <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${data.is_active ? "translate-x-4" : ""}`} />
          </button>
        </div>
        <div>
          <p className="block text-xs font-semibold text-slate-600 mb-1.5">Featured</p>
          <button
            type="button"
            onClick={() => onChange({ ...data, featured: !data.featured })}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${
              data.featured ? "bg-blue-500" : "bg-slate-200"
            }`}
          >
            <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${data.featured ? "translate-x-4" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

const toForm = (a) => ({
  ...emptyActivity(),
  id: a.id,
  title: a.title || "",
  location: a.location || "",
  city: a.city || "",
  category: a.category || "Adventure",
  price: a.price ?? "",
  price_type: a.price_type || "per_person",
  duration: a.duration || "",
  max_group: a.max_group ?? 20,
  min_age: a.min_age ?? 0,
  description: a.description || "",
  tags: Array.isArray(a.tags) ? a.tags : [],
  includedText: Array.isArray(a.included) ? a.included.join("\n") : "",
  gradient: a.gradient || "",
  image_urlsText: Array.isArray(a.image_urls) ? a.image_urls.join(", ") : "",
  is_active: a.is_active !== false,
  featured: !!a.featured,
});

const toPayload = (f) => ({
  title: f.title,
  location: f.location,
  city: f.city || null,
  category: f.category,
  price: f.price === "" ? null : Number(f.price),
  price_type: f.price_type,
  duration: f.duration || null,
  max_group: f.max_group === "" ? null : Number(f.max_group),
  min_age: f.min_age === "" ? null : Number(f.min_age),
  description: f.description || null,
  tags: Array.isArray(f.tags) ? f.tags : [],
  included: String(f.includedText || "").split("\n").map((s) => s.trim()).filter(Boolean),
  gradient: f.gradient || null,
  image_urls: String(f.image_urlsText || "").split(",").map((s) => s.trim()).filter(Boolean),
  is_active: !!f.is_active,
  featured: !!f.featured,
});

export default function ActivitiesAdminPage({ toast }) {
  const INIT_ACTIVITIES = useMemo(() => ([
    { id:"AC-001", title:"Quad Biking in the Palmeraie", location:"Marrakech", category:"Adventure", price:45, price_type:"per_person", duration:"2 hours", is_active:true, featured:true, gradient:"linear-gradient(145deg,#c8a06e,#8B5E3C,#2C1F12)" },
    { id:"AC-002", title:"Medina Food Walk", location:"Marrakech", category:"Food", price:55, price_type:"per_person", duration:"3 hours", is_active:true, featured:true, gradient:"linear-gradient(145deg,#C0654A,#8B3A2A,#1A1410)" },
    { id:"AC-003", title:"Surf Lessons Essaouira", location:"Essaouira", category:"Sport", price:70, price_type:"per_person", duration:"Half day", is_active:true, featured:false, gradient:"linear-gradient(145deg,#6B8CAE,#3D5A73,#1A2C38)" },
    { id:"AC-004", title:"Atlas Mountain Trek", location:"Imlil", category:"Nature", price:85, price_type:"per_person", duration:"Full day", is_active:true, featured:true, gradient:"linear-gradient(145deg,#7A8C6E,#4A5C3E,#2C3828)" },
  ]), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // add | edit | view
  const [form, setForm] = useState(emptyActivity());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.activities.list();
      setRows(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load activities");
      setRows(INIT_ACTIVITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const featured = rows.filter((r) => r.featured).length;
    return { total, active, featured };
  }, [rows]);

  const openAdd = () => { setForm(emptyActivity()); setTarget(null); setModal("add"); };
  const openEdit = (r) => { setTarget(r); setForm(toForm(r)); setModal("edit"); };
  const openView = (r) => { setTarget(r); setModal("view"); };

  const save = async () => {
    if (!form.title || !form.location || !form.category) {
      toast?.("Please fill title, location, and category", "error");
      return;
    }
    try {
      if (modal === "add") {
        const created = await adminApi.activities.create(toPayload(form));
        setRows((p) => [created, ...p]);
        toast?.("Activity created", "success");
      } else {
        const updated = await adminApi.activities.update(target.id, toPayload(form));
        setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        toast?.("Activity updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save activity", "error");
    }
  };

  const toggleActive = async (r) => {
    try {
      const updated = await adminApi.activities.update(r.id, { is_active: !r.is_active });
      setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      toast?.(`Activity ${updated.is_active ? "activated" : "disabled"}`, "success");
    } catch (e) {
      toast?.(e?.message || "Failed to update", "error");
    }
  };

  const del = async (id) => {
    try {
      await adminApi.activities.delete(id);
      setRows((p) => p.filter((x) => x.id !== id));
      toast?.("Activity deleted", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Activities</h1>
          <p className="text-xs text-slate-400 mt-1">Manage activity catalog and visibility.</p>
        </div>
        <Button icon="plus" onClick={openAdd}>New Activity</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          ["Total Activities", stats.total, "bg-slate-50"],
          ["Active", stats.active, "bg-emerald-50"],
          ["Featured", stats.featured, "bg-amber-50"],
        ].map(([l, v, bg]) => (
          <div key={l} className={`rounded-2xl px-4 py-3 ${bg}`}>
            <p className="text-xs text-slate-400">{l}</p>
            <p className="syne text-xl font-semibold mt-1 text-slate-800">{v}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Table
            columns={[
              { key: "title", label: "Title", render: (_v, r) => (
                <div>
                  <p className="font-semibold text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.location}</p>
                </div>
              )},
              { key: "category", label: "Category", render: (v) => <Badge tone="indigo">{v || "—"}</Badge> },
              { key: "price", label: "Price", render: (_v, r) => (
                <div className="text-sm">
                  <span className="font-semibold">{r.price_type === "free" ? "Free" : r.price_type === "on_request" ? "On Request" : r.price ?? "—"}</span>
                  <span className="text-xs text-slate-400 ml-2">{r.price_type}</span>
                </div>
              )},
              { key: "duration", label: "Duration", render: (v) => <span className="text-xs text-slate-500">{v || "—"}</span> },
              { key: "is_active", label: "Status", render: (v) => <Badge tone={v ? "emerald" : "slate"}>{v ? "active" : "inactive"}</Badge> },
              { key: "featured", label: "Featured", render: (v) => (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: v ? "#f59e0b" : "#94a3b8" }}>
                  <Icon d={ICONS.star} size={12} /> {v ? "Yes" : "No"}
                </span>
              )},
              {
                key: "actions",
                label: "",
                render: (_v, r) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button size="xs" variant="ghost" icon="eye" onClick={() => openView(r)}>View</Button>
                    <Button size="xs" variant="ghost" icon="edit" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="xs" variant="ghost" icon="zap" onClick={() => toggleActive(r)}>
                      {r.is_active ? "Disable" : "Activate"}
                    </Button>
                    <Button size="xs" variant="ghost" icon="trash" onClick={() => setConfirmId(r.id)}>Delete</Button>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </Card>

      <Modal
        open={modal === "add" || modal === "edit"}
        title={modal === "add" ? "New Activity" : "Edit Activity"}
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <ActivityForm data={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal === "view"}
        title="Activity details"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Close</Button>
            <Button onClick={() => { setForm(toForm(target)); setModal("edit"); }}>Edit</Button>
          </>
        }
      >
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
          {JSON.stringify(target, null, 2)}
        </pre>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete activity?"
        desc="This will soft-delete the activity (set inactive)."
        onClose={() => setConfirmId(null)}
        onConfirm={() => del(confirmId)}
      />
    </div>
  );
}

