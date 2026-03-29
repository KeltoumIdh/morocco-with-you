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

const emptyRestaurant = () => ({
  id: "",
  name: "",
  cuisine: "",
  location: "",
  city: "",
  price_range: "€€",
  description: "",
  phone: "",
  website: "",
  has_terrace: false,
  has_wifi: false,
  reservations: false,
  tags: [],
  gradient: "",
  image_urlsText: "",
  opening_hoursText: "",
  is_active: true,
  featured: false,
});

function RestaurantForm({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Name" required value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
        <Input label="Cuisine" value={data.cuisine} onChange={(e) => onChange({ ...data, cuisine: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Location" required value={data.location} onChange={(e) => onChange({ ...data, location: e.target.value })} />
        <Input label="City" value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })} />
      </div>
      <Select label="Price range" required value={data.price_range} onChange={(e) => onChange({ ...data, price_range: e.target.value })}>
        {["€", "€€", "€€€", "€€€€"].map((p) => <option key={p} value={p}>{p}</option>)}
      </Select>
      <Textarea label="Description" rows={4} value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} />
        <Input label="Website" value={data.website} onChange={(e) => onChange({ ...data, website: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={!!data.has_terrace} onChange={(e) => onChange({ ...data, has_terrace: e.target.checked })} />
          <span className="text-sm text-slate-700">Has Terrace</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={!!data.has_wifi} onChange={(e) => onChange({ ...data, has_wifi: e.target.checked })} />
          <span className="text-sm text-slate-700">Has WiFi</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={!!data.reservations} onChange={(e) => onChange({ ...data, reservations: e.target.checked })} />
          <span className="text-sm text-slate-700">Takes Reservations</span>
        </div>
      </div>
      <TagInput value={data.tags} onChange={(tags) => onChange({ ...data, tags })} />
      <Input label="Gradient" value={data.gradient} onChange={(e) => onChange({ ...data, gradient: e.target.value })} />
      <Input label="Image URLs (comma-separated)" value={data.image_urlsText} onChange={(e) => onChange({ ...data, image_urlsText: e.target.value })} />
      <Textarea
        label="Opening hours (JSON)"
        rows={4}
        placeholder='{"Mon-Fri":"12:00-23:00","Sat-Sun":"11:00-00:00"}'
        value={data.opening_hoursText}
        onChange={(e) => onChange({ ...data, opening_hoursText: e.target.value })}
      />
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

const toForm = (r) => ({
  ...emptyRestaurant(),
  id: r.id,
  name: r.name || "",
  cuisine: r.cuisine || "",
  location: r.location || "",
  city: r.city || "",
  price_range: r.price_range || "€€",
  description: r.description || "",
  phone: r.phone || "",
  website: r.website || "",
  has_terrace: !!r.has_terrace,
  has_wifi: !!r.has_wifi,
  reservations: !!r.reservations,
  tags: Array.isArray(r.tags) ? r.tags : [],
  gradient: r.gradient || "",
  image_urlsText: Array.isArray(r.image_urls) ? r.image_urls.join(", ") : "",
  opening_hoursText: r.opening_hours ? JSON.stringify(r.opening_hours, null, 2) : "",
  is_active: r.is_active !== false,
  featured: !!r.featured,
});

const toPayload = (f) => {
  let opening_hours = null;
  const raw = String(f.opening_hoursText || "").trim();
  if (raw) {
    try { opening_hours = JSON.parse(raw); } catch { opening_hours = raw; }
  }
  return {
    name: f.name,
    cuisine: f.cuisine || null,
    location: f.location,
    city: f.city || null,
    price_range: f.price_range,
    description: f.description || null,
    phone: f.phone || null,
    website: f.website || null,
    has_terrace: !!f.has_terrace,
    has_wifi: !!f.has_wifi,
    reservations: !!f.reservations,
    tags: Array.isArray(f.tags) ? f.tags : [],
    gradient: f.gradient || null,
    image_urls: String(f.image_urlsText || "").split(",").map((s) => s.trim()).filter(Boolean),
    opening_hours: opening_hours || {},
    is_active: !!f.is_active,
    featured: !!f.featured,
  };
};

export default function RestaurantsAdminPage({ toast }) {
  const INIT_RESTAURANTS = useMemo(() => ([
    { id:"RS-001", name:"Nomad", cuisine:"Contemporary Moroccan", city:"Marrakech", price_range:"€€€", has_terrace:true, reservations:true, is_active:true, featured:true },
    { id:"RS-002", name:"Le Jardin", cuisine:"Moroccan Garden", city:"Marrakech", price_range:"€€€", has_terrace:true, reservations:true, is_active:true, featured:true },
    { id:"RS-003", name:"Clock Cafe Fes", cuisine:"International", city:"Fès", price_range:"€€", has_terrace:true, reservations:false, is_active:true, featured:false },
    { id:"RS-004", name:"Dar Moha", cuisine:"Fine Moroccan", city:"Marrakech", price_range:"€€€€", has_terrace:true, reservations:true, is_active:true, featured:true },
  ]), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyRestaurant());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.restaurants.list();
      setRows(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load restaurants");
      setRows(INIT_RESTAURANTS);
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

  const openAdd = () => { setForm(emptyRestaurant()); setTarget(null); setModal("add"); };
  const openEdit = (r) => { setTarget(r); setForm(toForm(r)); setModal("edit"); };
  const openView = (r) => { setTarget(r); setModal("view"); };

  const save = async () => {
    if (!form.name || !form.location || !form.price_range) {
      toast?.("Please fill name, location, and price range", "error");
      return;
    }
    try {
      if (modal === "add") {
        const created = await adminApi.restaurants.create(toPayload(form));
        setRows((p) => [created, ...p]);
        toast?.("Restaurant created", "success");
      } else {
        const updated = await adminApi.restaurants.update(target.id, toPayload(form));
        setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        toast?.("Restaurant updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save", "error");
    }
  };

  const toggleActive = async (r) => {
    try {
      const updated = await adminApi.restaurants.update(r.id, { is_active: !r.is_active });
      setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      toast?.("Updated status", "success");
    } catch (e) {
      toast?.(e?.message || "Failed", "error");
    }
  };

  const del = async (id) => {
    try {
      await adminApi.restaurants.delete(id);
      setRows((p) => p.filter((x) => x.id !== id));
      toast?.("Restaurant deleted", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Restaurants</h1>
          <p className="text-xs text-slate-400 mt-1">Manage restaurants listing.</p>
        </div>
        <Button icon="plus" onClick={openAdd}>New</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Total", "slate", stats.total],
          ["Active", "emerald", stats.active],
          ["Featured", "amber", stats.featured],
          ["Reservations", "indigo", rows.filter((r) => r.reservations).length],
        ].map(([l, c, v]) => (
          <div key={l} className="rounded-2xl px-4 py-3" style={{ background: c === "emerald" ? "#ecfdf5" : c === "amber" ? "#fffbeb" : c === "indigo" ? "#eef2ff" : "#f8fafc" }}>
            <p className="text-xs text-slate-400">{l}</p>
            <p className="syne text-xl font-semibold mt-1 text-slate-800">{v}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <Table
            columns={[
              { key: "name", label: "Name", render: (v) => <span className="font-semibold text-slate-800">{v}</span> },
              { key: "cuisine", label: "Cuisine", render: (v) => <span className="text-xs text-slate-500">{v || "—"}</span> },
              { key: "city", label: "City", render: (v) => <span className="text-xs text-slate-500">{v || "—"}</span> },
              { key: "price_range", label: "Price", render: (v) => <span className="font-semibold text-slate-700">{v || "—"}</span> },
              { key: "reservations", label: "Res", render: (v) => <Badge tone={v ? "emerald" : "slate"}>{v ? "yes" : "no"}</Badge> },
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
        title={modal === "add" ? "New restaurant" : "Edit restaurant"}
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}
      >
        <RestaurantForm data={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal === "view"}
        title="Restaurant details"
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Close</Button><Button onClick={() => { setForm(toForm(target)); setModal("edit"); }}>Edit</Button></>}
      >
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
          {JSON.stringify(target, null, 2)}
        </pre>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete restaurant?"
        desc="This will soft-delete the record (set inactive)."
        onClose={() => setConfirmId(null)}
        onConfirm={() => del(confirmId)}
      />
    </div>
  );
}

