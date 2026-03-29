import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Select, TagInput, Textarea } from "../components/ui/FormControls";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

const emptyPkg = () => ({
  id: "",
  title: "",
  subtitle: "",
  duration_days: 5,
  cities: [],
  price_from: "",
  max_group: 16,
  difficulty: "easy",
  description: "",
  highlightsText: "",
  includedText: "",
  not_includedText: "",
  itineraryText: "",
  tags: [],
  gradient: "",
  image_urlsText: "",
  is_active: true,
  featured: false,
});

function PackageForm({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Title" required value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
        <Input label="Subtitle" value={data.subtitle} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Duration days" required type="number" value={data.duration_days} onChange={(e) => onChange({ ...data, duration_days: e.target.value })} />
        <Input label="Price from" required type="number" value={data.price_from} onChange={(e) => onChange({ ...data, price_from: e.target.value })} />
        <Input label="Max group" type="number" value={data.max_group} onChange={(e) => onChange({ ...data, max_group: e.target.value })} />
      </div>
      <Select label="Difficulty" value={data.difficulty} onChange={(e) => onChange({ ...data, difficulty: e.target.value })}>
        {["easy","moderate","challenging"].map((d) => <option key={d} value={d}>{d}</option>)}
      </Select>
      <Textarea label="Description" rows={4} value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <TagInput value={data.cities} onChange={(cities) => onChange({ ...data, cities })} />
      <Textarea label="Highlights (one per line)" rows={4} value={data.highlightsText} onChange={(e) => onChange({ ...data, highlightsText: e.target.value })} />
      <Textarea label="Included (one per line)" rows={4} value={data.includedText} onChange={(e) => onChange({ ...data, includedText: e.target.value })} />
      <Textarea label="Not included (one per line)" rows={4} value={data.not_includedText} onChange={(e) => onChange({ ...data, not_includedText: e.target.value })} />
      <Textarea
        label="Itinerary (JSON)"
        rows={5}
        placeholder='[{"day":1,"title":"Arrival","activities":["Check in","Medina walk"]}]'
        value={data.itineraryText}
        onChange={(e) => onChange({ ...data, itineraryText: e.target.value })}
      />
      <TagInput value={data.tags} onChange={(tags) => onChange({ ...data, tags })} />
      <Input label="Gradient" value={data.gradient} onChange={(e) => onChange({ ...data, gradient: e.target.value })} />
      <Input label="Image URLs (comma-separated)" value={data.image_urlsText} onChange={(e) => onChange({ ...data, image_urlsText: e.target.value })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={!!data.is_active} onChange={(e) => onChange({ ...data, is_active: e.target.checked })} />
          <span className="text-sm text-slate-700">Active</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={!!data.featured} onChange={(e) => onChange({ ...data, featured: e.target.checked })} />
          <span className="text-sm text-slate-700">Featured</span>
        </div>
      </div>
    </div>
  );
}

const lines = (t) => String(t || "").split("\n").map((s) => s.trim()).filter(Boolean);

const toForm = (p) => ({
  ...emptyPkg(),
  id: p.id,
  title: p.title || "",
  subtitle: p.subtitle || "",
  duration_days: p.duration_days ?? 5,
  cities: Array.isArray(p.cities) ? p.cities : [],
  price_from: p.price_from ?? "",
  max_group: p.max_group ?? 16,
  difficulty: p.difficulty || "easy",
  description: p.description || "",
  highlightsText: Array.isArray(p.highlights) ? p.highlights.join("\n") : "",
  includedText: Array.isArray(p.included) ? p.included.join("\n") : "",
  not_includedText: Array.isArray(p.not_included) ? p.not_included.join("\n") : "",
  itineraryText: p.itinerary ? JSON.stringify(p.itinerary, null, 2) : "",
  tags: Array.isArray(p.tags) ? p.tags : [],
  gradient: p.gradient || "",
  image_urlsText: Array.isArray(p.image_urls) ? p.image_urls.join(", ") : "",
  is_active: p.is_active !== false,
  featured: !!p.featured,
});

const toPayload = (f) => {
  let itinerary = [];
  const raw = String(f.itineraryText || "").trim();
  if (raw) {
    try { itinerary = JSON.parse(raw); } catch { itinerary = []; }
  }
  return {
    title: f.title,
    subtitle: f.subtitle || null,
    duration_days: Number(f.duration_days),
    cities: Array.isArray(f.cities) ? f.cities : [],
    price_from: Number(f.price_from),
    max_group: f.max_group === "" ? null : Number(f.max_group),
    difficulty: f.difficulty,
    description: f.description || null,
    highlights: lines(f.highlightsText),
    included: lines(f.includedText),
    not_included: lines(f.not_includedText),
    itinerary,
    tags: Array.isArray(f.tags) ? f.tags : [],
    gradient: f.gradient || null,
    image_urls: String(f.image_urlsText || "").split(",").map((s) => s.trim()).filter(Boolean),
    is_active: !!f.is_active,
    featured: !!f.featured,
  };
};

export default function PackagesAdminPage({ toast }) {
  const INIT_PACKAGES = useMemo(() => ([
    { id:"PK-001", title:"Imperial Cities Explorer", cities:["Marrakech","Fès","Rabat"], duration_days:8, price_from:1240, difficulty:"easy", is_active:true, featured:true },
    { id:"PK-002", title:"Sahara to Atlantic", cities:["Marrakech","Merzouga","Essaouira"], duration_days:10, price_from:1580, difficulty:"moderate", is_active:true, featured:true },
    { id:"PK-003", title:"Morocco Family Adventure", cities:["Marrakech","Atlas","Essaouira"], duration_days:7, price_from:890, difficulty:"easy", is_active:true, featured:false },
  ]), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPkg());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.packages.list();
      setRows(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load packages");
      setRows(INIT_PACKAGES);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const avgDuration = total ? Math.round(rows.reduce((s, r) => s + Number(r.duration_days || 0), 0) / total) : 0;
    const avgPrice = total ? Math.round(rows.reduce((s, r) => s + Number(r.price_from || 0), 0) / total) : 0;
    return { total, active, avgDuration, avgPrice };
  }, [rows]);

  const openAdd = () => { setForm(emptyPkg()); setTarget(null); setModal("add"); };
  const openEdit = (r) => { setTarget(r); setForm(toForm(r)); setModal("edit"); };
  const openView = (r) => { setTarget(r); setModal("view"); };

  const save = async () => {
    if (!form.title || !form.duration_days || !form.price_from) {
      toast?.("Please fill title, duration_days and price_from", "error");
      return;
    }
    try {
      if (modal === "add") {
        const created = await adminApi.packages.create(toPayload(form));
        setRows((p) => [created, ...p]);
        toast?.("Package created", "success");
      } else {
        const updated = await adminApi.packages.update(target.id, toPayload(form));
        setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        toast?.("Package updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save", "error");
    }
  };

  const toggleActive = async (r) => {
    try {
      const updated = await adminApi.packages.update(r.id, { is_active: !r.is_active });
      setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      toast?.("Updated status", "success");
    } catch (e) {
      toast?.(e?.message || "Failed", "error");
    }
  };

  const del = async (id) => {
    try {
      await adminApi.packages.delete(id);
      setRows((p) => p.filter((x) => x.id !== id));
      toast?.("Package deleted", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Packages</h1>
          <p className="text-xs text-slate-400 mt-1">Manage travel planning packages.</p>
        </div>
        <Button icon="plus" onClick={openAdd}>New</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Total Packages", stats.total, "#f8fafc"],
          ["Active", stats.active, "#ecfdf5"],
          ["Avg Duration", stats.avgDuration, "#eff6ff"],
          ["Avg Price", stats.avgPrice ? `€${stats.avgPrice}` : "—", "#fffbeb"],
        ].map(([l, v, bg]) => (
          <div key={l} className="rounded-2xl px-4 py-3" style={{ background: bg }}>
            <p className="text-xs text-slate-400">{l}</p>
            <p className="syne text-xl font-semibold mt-1 text-slate-800">{v}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <Table
            columns={[
              { key: "title", label: "Title", render: (v) => <span className="font-semibold text-slate-800">{v}</span> },
              { key: "duration_days", label: "Duration", render: (v) => <Badge tone="indigo">{Number(v || 0)} days</Badge> },
              { key: "cities", label: "Cities", render: (v) => <span className="text-xs text-slate-500">{Array.isArray(v) ? v.slice(0, 3).join(", ") : "—"}</span> },
              { key: "price_from", label: "Price from", render: (v) => <span className="font-semibold text-slate-800">€{Number(v || 0).toFixed(0)}</span> },
              { key: "difficulty", label: "Difficulty", render: (v) => <Badge tone={v === "challenging" ? "red" : v === "moderate" ? "amber" : "emerald"}>{v}</Badge> },
              { key: "is_active", label: "Status", render: (v) => <Badge tone={v ? "emerald" : "slate"}>{v ? "active" : "inactive"}</Badge> },
              { key: "featured", label: "Featured", render: (v) => <Badge tone={v ? "amber" : "slate"}>{v ? "yes" : "no"}</Badge> },
              {
                key: "actions",
                label: "",
                render: (_v, r) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button size="xs" variant="ghost" icon="eye" onClick={() => openView(r)}>View</Button>
                    <Button size="xs" variant="ghost" icon="edit" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="xs" variant="ghost" icon="zap" onClick={() => toggleActive(r)}>{r.is_active ? "Disable" : "Activate"}</Button>
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
        title={modal === "add" ? "New package" : "Edit package"}
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}
      >
        <PackageForm data={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal === "view"}
        title="Package details"
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Close</Button><Button onClick={() => { setForm(toForm(target)); setModal("edit"); }}>Edit</Button></>}
      >
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
          {JSON.stringify(target, null, 2)}
        </pre>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete package?"
        desc="This will soft-delete the record (set inactive)."
        onClose={() => setConfirmId(null)}
        onConfirm={() => del(confirmId)}
      />
    </div>
  );
}

