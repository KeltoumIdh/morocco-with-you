import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Label, Select, TagInput, Textarea } from "../components/ui/FormControls";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";

const emptyDay = (n) => ({ day: n, title: "", activities: [] });

const emptyTrip = () => ({
  title: "",
  subtitle: "",
  destination: "",
  start_date: "",
  end_date: "",
  max_capacity: 16,
  price_per_person: "",
  difficulty: "easy",
  description: "",
  includes: [],
  excludes: [],
  tags: [],
  guide_name: "",
  guide_bio: "",
  status: "open",
  featured: false,
  gradient: "",
  image_urls: [],
  program: [emptyDay(1)],
});

const toForm = (r) => ({
  ...emptyTrip(),
  ...r,
  program: Array.isArray(r.program) && r.program.length ? r.program : [emptyDay(1)],
  includes: Array.isArray(r.includes) ? r.includes : [],
  excludes: Array.isArray(r.excludes) ? r.excludes : [],
  tags: Array.isArray(r.tags) ? r.tags : [],
  image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
  price_per_person: r.price_per_person ?? "",
  max_capacity: r.max_capacity ?? 16,
});

const toPayload = (f) => ({
  title: f.title,
  subtitle: f.subtitle || null,
  destination: f.destination,
  start_date: f.start_date,
  end_date: f.end_date,
  max_capacity: Number(f.max_capacity) || 16,
  price_per_person: Number(f.price_per_person),
  difficulty: f.difficulty || "easy",
  description: f.description || null,
  includes: f.includes || [],
  excludes: f.excludes || [],
  tags: f.tags || [],
  guide_name: f.guide_name || null,
  guide_bio: f.guide_bio || null,
  status: f.status || "open",
  featured: !!f.featured,
  gradient: f.gradient || null,
  image_urls: f.image_urls || [],
  program: (f.program || []).map((d, i) => ({
    day: Number(d.day) || i + 1,
    title: d.title || `Day ${i + 1}`,
    activities: Array.isArray(d.activities) ? d.activities : [],
  })),
});

function ProgramBuilder({ value, onChange }) {
  const updateDay = (idx, patch) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Program (day-by-day)</Label>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => onChange([...(value || []), emptyDay((value?.length || 0) + 1)])}
        >
          Add Day
        </Button>
      </div>
      {(value || []).map((d, idx) => (
        <div key={idx} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Day"
              type="number"
              value={d.day}
              onChange={(e) => updateDay(idx, { day: Number(e.target.value) })}
            />
            <div className="col-span-3">
              <Input
                label="Title"
                value={d.title}
                onChange={(e) => updateDay(idx, { title: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-2">
            <TagInput
              label="Activities (this day)"
              hint="One bullet per line — type and press Enter or Add."
              popularTags={[]}
              value={Array.isArray(d.activities) ? d.activities : []}
              onChange={(activities) => updateDay(idx, { activities })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GroupTripsAdminPage({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // add|edit|view
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(emptyTrip());
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.groupTrips.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load group trips");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => r.status === "open").length;
    const full = rows.filter((r) => r.status === "full").length;
    const avg = total
      ? Math.round(rows.reduce((s, r) => s + Number(r.price_per_person || 0), 0) / total)
      : 0;
    return { total, open, full, avg };
  }, [rows]);

  const save = async () => {
    if (!form.title || !form.destination || !form.start_date || !form.end_date || !form.price_per_person) {
      toast?.("Please fill required fields", "error");
      return;
    }
    try {
      const payload = toPayload(form);
      if (modal === "add") {
        const created = await adminApi.groupTrips.create(payload);
        setRows((prev) => [created, ...prev]);
        toast?.("Group trip created", "success");
      } else {
        const updated = await adminApi.groupTrips.update(target.id, payload);
        setRows((prev) => prev.map((r) => (r.id === target.id ? { ...r, ...updated } : r)));
        toast?.("Group trip updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Save failed", "error");
    }
  };

  const remove = async (id) => {
    try {
      await adminApi.groupTrips.delete(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast?.("Group trip cancelled", "success");
    } catch (e) {
      toast?.(e?.message || "Delete failed", "error");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Group Trips</h1>
          <p className="text-xs text-slate-400 mt-1">Create and manage curated group journeys.</p>
        </div>
        <Button
          variant="blue"
          icon="plus"
          size="sm"
          onClick={() => {
            setForm(emptyTrip());
            setTarget(null);
            setModal("add");
          }}
        >
          Add Group Trip
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, bg: "bg-slate-50", color: "text-slate-800" },
          { label: "Open", value: stats.open, bg: "bg-emerald-50", color: "text-emerald-700" },
          { label: "Full", value: stats.full, bg: "bg-amber-50", color: "text-amber-700" },
          { label: "Avg Price", value: `€${stats.avg}`, bg: "bg-sky-50", color: "text-sky-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`syne text-xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
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
              { key: "title", label: "Title" },
              { key: "destination", label: "Destination" },
              {
                key: "dates",
                label: "Dates",
                render: (_v, r) =>
                  `${r.start_date || "—"} → ${r.end_date || "—"}`,
              },
              {
                key: "capacity",
                label: "Capacity/Enrolled",
                render: (_v, r) =>
                  `${r.max_capacity || 0} / ${r.enrolled_count || 0}`,
              },
              {
                key: "price_per_person",
                label: "Price",
                render: (v) => `€${Number(v || 0).toFixed(0)}`,
              },
              {
                key: "status",
                label: "Status",
                render: (v) => (
                  <Badge tone={v === "open" ? "emerald" : v === "full" ? "amber" : "slate"}>
                    {v}
                  </Badge>
                ),
              },
              {
                key: "featured",
                label: "Featured",
                render: (v) => <Badge tone={v ? "indigo" : "slate"}>{v ? "Yes" : "No"}</Badge>,
              },
              {
                key: "actions",
                label: "",
                render: (_v, r) => (
                  <div className="flex justify-end gap-2">
                    <Button size="xs" variant="ghost" icon="eye" onClick={() => { setTarget(r); setModal("view"); }}>
                      View
                    </Button>
                    <Button size="xs" variant="ghost" icon="edit" onClick={() => { setTarget(r); setForm(toForm(r)); setModal("edit"); }}>
                      Edit
                    </Button>
                    <Button size="xs" variant="ghost" icon="trash" onClick={() => setConfirmId(r.id)}>
                      Delete
                    </Button>
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
        title={modal === "add" ? "New Group Trip" : "Edit Group Trip"}
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Destination" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            <Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {["easy", "moderate", "hard"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <Input label="Max capacity" type="number" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: Number(e.target.value) })} />
            <Input label="Price/person" type="number" value={form.price_per_person} onChange={(e) => setForm({ ...form, price_per_person: e.target.value })} />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TagInput
            label="What's included"
            hint="List inclusions (meals, transfers, guides, etc.). Type each line and press Enter or Add."
            popularTags={[]}
            value={form.includes}
            onChange={(v) => setForm({ ...form, includes: v })}
          />
          <TagInput
            label="What's not included"
            hint="Optional exclusions (flights, visas, personal expenses, etc.)."
            popularTags={[]}
            value={form.excludes}
            onChange={(v) => setForm({ ...form, excludes: v })}
          />
          <TagInput
            label="Trip tags"
            hint="Discovery filters — click a suggestion or add your own."
            value={form.tags}
            onChange={(v) => setForm({ ...form, tags: v })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Guide name" value={form.guide_name} onChange={(e) => setForm({ ...form, guide_name: e.target.value })} />
            <Input label="Gradient" value={form.gradient} onChange={(e) => setForm({ ...form, gradient: e.target.value })} />
          </div>
          <Textarea label="Guide bio" rows={2} value={form.guide_bio} onChange={(e) => setForm({ ...form, guide_bio: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {["draft", "open", "full", "cancelled", "completed"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <div>
            <p className="block text-xs font-semibold text-slate-600 mb-1.5">Featured</p>
            <button
              type="button"
              onClick={() => setForm({ ...form, featured: !form.featured })}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.featured ? "bg-blue-500" : "bg-slate-200"}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.featured ? "translate-x-4" : ""}`} />
            </button>
          </div>
          <ProgramBuilder value={form.program} onChange={(program) => setForm({ ...form, program })} />
        </div>
      </Modal>

      <Modal
        open={modal === "view"}
        title="Group Trip details"
        onClose={() => setModal(null)}
        footer={<Button variant="ghost" onClick={() => setModal(null)}>Close</Button>}
      >
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
          {JSON.stringify(target, null, 2)}
        </pre>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Cancel this group trip?"
        desc="This sets status to cancelled."
        onClose={() => setConfirmId(null)}
        onConfirm={() => remove(confirmId)}
      />
    </div>
  );
}

