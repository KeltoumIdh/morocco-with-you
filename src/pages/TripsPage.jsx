import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { ICONS } from "../config/nav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Label, Select, TagInput, Textarea } from "../components/ui/FormControls";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";
import { normalizeExperienceTagsList } from "../config/experienceTags";

const emptyTrip = () => ({
  id: "",
  title: "",
  destination: "",
  duration: "",
  route: "",
  price: "",
  status: "draft",
  image: "",
  description: "",
  tags: [],
  featured: false,
});

function TripForm({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Trip Title"
          required
          placeholder="e.g. Sahara Immersion"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
        <Input
          label="Destination"
          required
          placeholder="e.g. Merzouga, Morocco"
          value={data.destination}
          onChange={(e) => onChange({ ...data, destination: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Duration"
          required
          placeholder="e.g. Full day, 4 hours, 2 days"
          value={data.duration}
          onChange={(e) => onChange({ ...data, duration: e.target.value })}
        />
        <Input
          label="Price (EUR)"
          required
          type="number"
          placeholder="e.g. 130"
          value={data.price}
          onChange={(e) => onChange({ ...data, price: e.target.value })}
        />
      </div>
      <Input
        label="Route (optional)"
        placeholder="e.g. Marrakech → Agafay (shown on the experience page, not as duration)"
        value={data.route}
        onChange={(e) => onChange({ ...data, route: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Status"
          value={data.status}
          onChange={(e) => onChange({ ...data, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
        <div>
          <Label>Featured Trip</Label>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => onChange({ ...data, featured: !data.featured })}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                data.featured ? "bg-blue-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${
                  data.featured ? "translate-x-4" : ""
                }`}
              />
            </button>
            <span className="text-sm text-slate-600">
              {data.featured ? "Featured on homepage" : "Not featured"}
            </span>
          </div>
        </div>
      </div>
      <Input
        label="Cover Image URL"
        placeholder="https://..."
        value={data.image}
        onChange={(e) => onChange({ ...data, image: e.target.value })}
      />
      {data.image && (
        <div className="w-full h-32 rounded-xl overflow-hidden">
          <img
            src={data.image}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      <Textarea
        label="Short Description"
        required
        rows={3}
        placeholder="Describe the experience..."
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
      />
      <TagInput value={data.tags} onChange={(tags) => onChange({ ...data, tags })} />
    </div>
  );
}

const expToTrip = (e) => ({
  id: e.id,
  title: e.title || "",
  destination: e.location || "",
  duration: e.duration || "",
  route: e.route || "",
  price: e.price ?? "",
  status: e.is_active ? "published" : "draft",
  image: e.image_url || "",
  description: e.description || "",
  tags: normalizeExperienceTagsList(Array.isArray(e.tags) ? e.tags : []),
  featured: !!e.featured,
  gradient: e.gradient || "",
});

const tripToExpPayload = (t) => {
  const img =
    t.image != null && String(t.image).trim() !== "" ? String(t.image).trim() : null;
  const routeStr = t.route != null && String(t.route).trim() !== "" ? String(t.route).trim() : null;
  return {
    title: t.title,
    location: t.destination,
    description: t.description,
    price: Number(t.price),
    duration: t.duration != null && String(t.duration).trim() !== "" ? String(t.duration).trim() : null,
    route: routeStr,
    tags: normalizeExperienceTagsList(Array.isArray(t.tags) ? t.tags : []),
    featured: !!t.featured,
    is_active: t.status === "published",
    gradient: t.gradient || undefined,
    image_url: img,
  };
};

function TripsPage({ toast }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [form, setForm] = useState(emptyTrip());
  const [target, setTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table"); // 'table' | 'grid'

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminApi.experiences.list();
      setTrips((rows || []).map(expToTrip));
    } catch (e) {
      setError(e?.message || "Failed to load experiences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setForm(emptyTrip());
    setModal("add");
  };

  const openEdit = (trip) => {
    setForm({ ...trip });
    setTarget(trip);
    setModal("edit");
  };

  const openView = (trip) => {
    setTarget(trip);
    setModal("view");
  };

  const handleSave = async () => {
    if (!form.title || !form.destination || !form.duration || !form.price) {
      toast?.("Please fill title, destination, duration, and price", "error");
      return;
    }

    try {
      if (modal === "add") {
        const created = await adminApi.experiences.create(tripToExpPayload(form));
        setTrips((prev) => [expToTrip(created), ...prev]);
        toast?.("Experience created successfully", "success");
      } else {
        const updated = await adminApi.experiences.update(target.id, tripToExpPayload(form));
        setTrips((prev) => prev.map((t) => (t.id === target.id ? expToTrip(updated) : t)));
        toast?.("Experience updated", "success");
      }
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save trip", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.experiences.delete(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast?.("Experience deleted", "success");
    } catch (e) {
      toast?.(e?.message || "Failed to delete trip", "error");
    }
  };

  const toggleStatus = async (trip) => {
    try {
      const updated = await adminApi.experiences.update(trip.id, {
        is_active: trip.status !== "published",
      });
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? expToTrip(updated) : t)));
      toast?.(
        `Experience ${trip.status === "published" ? "unpublished" : "published"}`,
        "success"
      );
    } catch (e) {
      toast?.(e?.message || "Failed to update trip status", "error");
    }
  };

  const filtered = useMemo(
    () =>
      trips.filter(
        (t) =>
          (filterStatus === "all" || t.status === filterStatus) &&
          (t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.destination.toLowerCase().includes(search.toLowerCase()))
      ),
    [trips, filterStatus, search]
  );

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="syne text-2xl font-semibold text-slate-800">Trips</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage all travel products on the platform.
          </p>
        </div>
        <Button variant="blue" icon="plus" size="sm" onClick={openAdd}>
          Add Trip
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Trips",
            value: trips.length,
            bg: "bg-slate-50",
            color: "text-slate-800",
          },
          {
            label: "Published",
            value: trips.filter((t) => t.status === "published").length,
            bg: "bg-sky-50",
            color: "text-sky-700",
          },
          {
            label: "Drafts",
            value: trips.filter((t) => t.status === "draft").length,
            bg: "bg-amber-50",
            color: "text-amber-700",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`syne text-xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon
              d={ICONS.search}
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none"
            />
          </div>

          <div className="flex gap-1">
            {["all", "published", "draft"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  filterStatus === f
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1 border border-slate-200 rounded-xl p-1">
            {["table", "grid"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`p-1.5 rounded-lg transition-colors ${
                  view === v
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-100"
                }`}
                type="button"
              >
                <Icon d={ICONS[v === "table" ? "book" : "image"]} size={13} />
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : view === "table" ? (
          <Table
            columns={[
              {
                key: "image",
                label: "",
                render: (v, r) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                      {v ? (
                        <img src={v} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon d={ICONS.image} size={16} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                      <p className="text-xs text-slate-400">{r.destination}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "duration",
                label: "Duration",
                render: (v, r) => (
                  <div className="text-xs">
                    <p className="font-medium text-slate-700">{v || "—"}</p>
                    {r.route ? (
                      <p className="text-slate-400 mt-0.5 truncate max-w-[160px]" title={r.route}>
                        {r.route}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "price",
                label: "Price",
                render: (v) => <span className="font-bold text-slate-800">€{v}</span>,
              },
              {
                key: "tags",
                label: "Tags",
                render: (v) => (
                  <div className="flex gap-1">
                    {(v || []).slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                key: "featured",
                label: "Featured",
                render: (v) =>
                  v ? (
                    <span className="text-xs text-amber-600 font-semibold">★ Yes</span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  ),
              },
              { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
            ]}
            data={filtered}
            actions={(row) => (
              <>
                <Button variant="ghost" size="xs" icon="eye" onClick={() => openView(row)}>
                  View
                </Button>
                <Button variant="ghost" size="xs" icon="edit" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <button
                  onClick={() => toggleStatus(row)}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  type="button"
                >
                  {row.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => setConfirmId(row.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  type="button"
                  aria-label="Delete"
                >
                  <Icon d={ICONS.trash} size={13} />
                </button>
              </>
            )}
            emptyMsg="No trips found. Try adjusting your filters."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((trip) => (
              <div
                key={trip.id}
                className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-36 bg-slate-100 relative overflow-hidden">
                  {trip.image ? (
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon d={ICONS.image} size={28} className="text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge status={trip.status} />
                  </div>
                  {trip.featured && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                      ★ Featured
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-800 text-sm mb-1">{trip.title}</p>
                  <p className="text-xs text-slate-400 mb-2">{trip.destination}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{trip.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="syne font-semibold text-blue-600">€{trip.price}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(trip)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                        type="button"
                      >
                        <Icon d={ICONS.edit} size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmId(trip.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                        type="button"
                      >
                        <Icon d={ICONS.trash} size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-12 text-center text-slate-400 text-sm">
                No trips found.
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add New Trip" : "Edit Trip"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="blue" onClick={handleSave}>
              {modal === "add" ? "Create Trip" : "Save Changes"}
            </Button>
          </>
        }
      >
        <TripForm data={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title="Trip Details"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Close
            </Button>
            <Button
              variant="blue"
              icon="edit"
              onClick={() => {
                setForm({ ...target });
                setModal("edit");
              }}
            >
              Edit Trip
            </Button>
          </>
        }
      >
        {target && (
          <div className="space-y-4">
            {target.image && (
              <div className="w-full h-48 rounded-2xl overflow-hidden">
                <img src={target.image} alt={target.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="syne text-xl font-semibold text-slate-800">{target.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{target.destination}</p>
              </div>
              <div className="flex gap-2">
                <Badge status={target.status} />
                {target.featured && <Badge status="featured" label="Featured" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="font-semibold text-slate-700 mt-0.5">{target.duration || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Price</p>
                <p className="syne font-semibold text-blue-600 mt-0.5">€{target.price}</p>
              </div>
            </div>
            {target.route ? (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Route</p>
                <p className="font-semibold text-slate-700 mt-0.5">{target.route}</p>
              </div>
            ) : null}
            <p className="text-sm text-slate-600 leading-relaxed">{target.description}</p>
            <div className="flex flex-wrap gap-2">
              {(target.tags || []).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Delete Trip?"
        message="This will permanently remove the trip and all associated data. This cannot be undone."
      />
    </div>
  );
}

export default TripsPage;

