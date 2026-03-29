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

const emptyAcc = () => ({
  id: "",
  name: "",
  type: "Riad",
  location: "",
  city: "",
  stars: "",
  price_from: "",
  price_to: "",
  description: "",
  amenities: [],
  tags: [],
  phone: "",
  website: "",
  booking_url: "",
  total_rooms: "",
  gradient: "",
  image_urlsText: "",
  is_active: true,
  featured: false,
});

function AccommodationForm({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Name" required value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
        <Select label="Type" required value={data.type} onChange={(e) => onChange({ ...data, type: e.target.value })}>
          {["Riad","Hotel","Guesthouse","Villa","Auberge","Camping","Apartment","Dar"].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Location" required value={data.location} onChange={(e) => onChange({ ...data, location: e.target.value })} />
        <Input label="City" value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select label="Stars" value={data.stars} onChange={(e) => onChange({ ...data, stars: e.target.value })}>
          <option value="">—</option>
          {[1,2,3,4,5].map((s) => <option key={s} value={s}>{`${s} ★`}</option>)}
        </Select>
        <Input label="Price from" type="number" value={data.price_from} onChange={(e) => onChange({ ...data, price_from: e.target.value })} />
        <Input label="Price to" type="number" value={data.price_to} onChange={(e) => onChange({ ...data, price_to: e.target.value })} />
      </div>
      <Textarea label="Description" rows={4} value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <TagInput value={data.amenities} onChange={(amenities) => onChange({ ...data, amenities })} />
      <TagInput value={data.tags} onChange={(tags) => onChange({ ...data, tags })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} />
        <Input label="Website" value={data.website} onChange={(e) => onChange({ ...data, website: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Booking URL" value={data.booking_url} onChange={(e) => onChange({ ...data, booking_url: e.target.value })} />
        <Input label="Total rooms" type="number" value={data.total_rooms} onChange={(e) => onChange({ ...data, total_rooms: e.target.value })} />
      </div>
      <Input label="Gradient (CSS)" value={data.gradient} onChange={(e) => onChange({ ...data, gradient: e.target.value })} />
      <Input label="Image URLs (comma-separated)" value={data.image_urlsText} onChange={(e) => onChange({ ...data, image_urlsText: e.target.value })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="block text-xs font-semibold text-slate-600 mb-1.5">Active</p>
          <button
            type="button"
            onClick={() => onChange({ ...data, is_active: !data.is_active })}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${data.is_active ? "bg-blue-500" : "bg-slate-200"}`}
          >
            <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${data.is_active ? "translate-x-4" : ""}`} />
          </button>
        </div>
        <div>
          <p className="block text-xs font-semibold text-slate-600 mb-1.5">Featured</p>
          <button
            type="button"
            onClick={() => onChange({ ...data, featured: !data.featured })}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${data.featured ? "bg-blue-500" : "bg-slate-200"}`}
          >
            <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${data.featured ? "translate-x-4" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

const toForm = (a) => ({
  ...emptyAcc(),
  id: a.id,
  name: a.name || "",
  type: a.type || "Riad",
  location: a.location || "",
  city: a.city || "",
  stars: a.stars ?? "",
  price_from: a.price_from ?? "",
  price_to: a.price_to ?? "",
  description: a.description || "",
  amenities: Array.isArray(a.amenities) ? a.amenities : [],
  tags: Array.isArray(a.tags) ? a.tags : [],
  phone: a.phone || "",
  website: a.website || "",
  booking_url: a.booking_url || "",
  total_rooms: a.total_rooms ?? "",
  gradient: a.gradient || "",
  image_urlsText: Array.isArray(a.image_urls) ? a.image_urls.join(", ") : "",
  is_active: a.is_active !== false,
  featured: !!a.featured,
});

const toPayload = (f) => ({
  name: f.name,
  type: f.type,
  location: f.location,
  city: f.city || null,
  stars: f.stars === "" ? null : Number(f.stars),
  price_from: f.price_from === "" ? null : Number(f.price_from),
  price_to: f.price_to === "" ? null : Number(f.price_to),
  description: f.description || null,
  amenities: Array.isArray(f.amenities) ? f.amenities : [],
  tags: Array.isArray(f.tags) ? f.tags : [],
  phone: f.phone || null,
  website: f.website || null,
  booking_url: f.booking_url || null,
  total_rooms: f.total_rooms === "" ? null : Number(f.total_rooms),
  gradient: f.gradient || null,
  image_urls: String(f.image_urlsText || "").split(",").map((s) => s.trim()).filter(Boolean),
  is_active: !!f.is_active,
  featured: !!f.featured,
});

export default function AccommodationsAdminPage({ toast }) {
  const INIT_ACCOMMODATIONS = useMemo(() => ([
    { id:"HT-001", name:"Riad Yasmine", type:"Riad", city:"Marrakech", stars:5, price_from:120, price_to:280, is_active:true, featured:true },
    { id:"HT-002", name:"El Fenn", type:"Riad", city:"Marrakech", stars:5, price_from:250, price_to:600, is_active:true, featured:true },
    { id:"HT-003", name:"Hotel Palais Amani", type:"Hotel", city:"Fès", stars:5, price_from:180, price_to:400, is_active:true, featured:false },
    { id:"HT-004", name:"Dar Anika", type:"Riad", city:"Marrakech", stars:4, price_from:90, price_to:160, is_active:true, featured:false },
  ]), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyAcc());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.accommodations.list();
      setRows(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load accommodations");
      setRows(INIT_ACCOMMODATIONS);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const riads = rows.filter((r) => r.type === "Riad").length;
    const hotels = rows.filter((r) => r.type === "Hotel").length;
    return { total, active, riads, hotels };
  }, [rows]);

  const openAdd = () => { setForm(emptyAcc()); setTarget(null); setModal("add"); };
  const openEdit = (r) => { setTarget(r); setForm(toForm(r)); setModal("edit"); };
  const openView = (r) => { setTarget(r); setModal("view"); };

  const save = async () => {
    if (!form.name || !form.location || !form.type) {
      toast?.("Please fill name, type and location", "error");
      return;
    }
    try {
      if (modal === "add") {
        const created = await adminApi.accommodations.create(toPayload(form));
        setRows((p) => [created, ...p]);
        toast?.("Accommodation created", "success");
      } else {
        const updated = await adminApi.accommodations.update(target.id, toPayload(form));
        setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        toast?.("Accommodation updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save", "error");
    }
  };

  const toggleActive = async (r) => {
    try {
      const updated = await adminApi.accommodations.update(r.id, { is_active: !r.is_active });
      setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      toast?.("Updated status", "success");
    } catch (e) {
      toast?.(e?.message || "Failed", "error");
    }
  };

  const del = async (id) => {
    try {
      await adminApi.accommodations.delete(id);
      setRows((p) => p.filter((x) => x.id !== id));
      toast?.("Accommodation deleted", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Hébergement</h1>
          <p className="text-xs text-slate-400 mt-1">Manage accommodations inventory.</p>
        </div>
        <Button icon="plus" onClick={openAdd}>New</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Total", stats.total, "#f8fafc"],
          ["Active", stats.active, "#ecfdf5"],
          ["Riads", stats.riads, "#eff6ff"],
          ["Hotels", stats.hotels, "#fff7ed"],
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
              { key: "name", label: "Name", render: (v) => <span className="font-semibold text-slate-800">{v}</span> },
              { key: "type", label: "Type", render: (v) => <Badge tone="indigo">{v || "—"}</Badge> },
              { key: "city", label: "City", render: (v) => <span className="text-xs text-slate-500">{v || "—"}</span> },
              { key: "stars", label: "Stars", render: (v) => <span className="text-xs text-slate-600">{v ? `${v} ★` : "—"}</span> },
              { key: "price_from", label: "Price range", render: (_v, r) => <span className="text-xs text-slate-600">{r.price_from != null ? `€${r.price_from}` : "—"} {r.price_to != null ? `– €${r.price_to}` : ""}</span> },
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
        title={modal === "add" ? "New accommodation" : "Edit accommodation"}
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}
      >
        <AccommodationForm data={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal === "view"}
        title="Accommodation details"
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Close</Button><Button onClick={() => { setForm(toForm(target)); setModal("edit"); }}>Edit</Button></>}
      >
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
          {JSON.stringify(target, null, 2)}
        </pre>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete accommodation?"
        desc="This will soft-delete the record (set inactive)."
        onClose={() => setConfirmId(null)}
        onConfirm={() => del(confirmId)}
      />
    </div>
  );
}

