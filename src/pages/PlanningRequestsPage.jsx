import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import { Input, Select, Textarea } from "../components/ui/FormControls";
import { adminApi } from "../lib/api";
import { ErrorState, LoadingSkeleton } from "../components/ui/AdminStates";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STATUS = ["new", "contacted", "in_progress", "quoted", "confirmed", "cancelled"];

const badgeTone = (s) => {
  switch (s) {
    case "new": return "blue";
    case "contacted": return "violet";
    case "in_progress": return "amber";
    case "quoted": return "indigo";
    case "confirmed": return "emerald";
    case "cancelled": return "red";
    default: return "slate";
  }
};

const workflowTone = (w) => {
  switch (w) {
    case "DRAFT": return "slate";
    case "SENT": return "blue";
    case "VALIDATED": return "violet";
    case "BOOKED": return "emerald";
    case "CANCELLED": return "red";
    default: return "slate";
  }
};

function ItineraryBuilderModal({ request, onSave, onClose, aiSuggestion }) {
  const [days, setDays] = useState(request?.itinerary_items || []);
  const [margin, setMargin] = useState(Number(request?.margin_percent || 15));

  useEffect(() => {
    if (aiSuggestion?.days?.length) {
      setDays(
        aiSuggestion.days.map((d, i) => ({
          ...d,
          day: d.day ?? i + 1,
          activities: d.activities || [],
          services: d.services || [],
        }))
      );
    } else {
      const items = request?.itinerary_items;
      if (Array.isArray(items) && items.length) {
        setDays(items);
      } else {
        setDays([{ day: 1, title: "Day 1", activities: [], services: [] }]);
      }
    }
    setMargin(Number(request?.margin_percent || 15));
  }, [request?.id, aiSuggestion]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === "DAY") {
      setDays((prev) => {
        const reordered = Array.from(prev);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        return reordered.map((d, i) => ({ ...d, day: i + 1 }));
      });
      return;
    }

    const srcId = source.droppableId;
    const destId = destination.droppableId;
    if (!srcId.startsWith("activities-") || !destId.startsWith("activities-")) return;

    const srcDay = parseInt(srcId.replace("activities-", ""), 10);
    const destDay = parseInt(destId.replace("activities-", ""), 10);
    if (Number.isNaN(srcDay) || Number.isNaN(destDay)) return;

    setDays((prev) => {
      const newDays = [...prev];
      if (srcDay === destDay) {
        const activities = Array.from(newDays[srcDay].activities || []);
        const [moved] = activities.splice(source.index, 1);
        activities.splice(destination.index, 0, moved);
        newDays[srcDay] = { ...newDays[srcDay], activities };
      } else {
        const srcActs = [...(newDays[srcDay].activities || [])];
        const [moved] = srcActs.splice(source.index, 1);
        newDays[srcDay] = { ...newDays[srcDay], activities: srcActs };
        const destActs = [...(newDays[destDay].activities || [])];
        destActs.splice(destination.index, 0, moved);
        newDays[destDay] = { ...newDays[destDay], activities: destActs };
      }
      return newDays;
    });
  };

  const addDay = () =>
    setDays((prev) => [
      ...prev,
      { day: prev.length + 1, title: `Day ${prev.length + 1}`, activities: [], services: [] },
    ]);

  const removeDay = (i) =>
    setDays((prev) =>
      prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 }))
    );

  const servicesCost = days.reduce(
    (sum, day) =>
      sum +
      (day.services || []).reduce((s, sv) => s + (Number(sv.price) || 0), 0),
    0
  );
  const finalPrice = servicesCost * (1 + margin / 100);

  const handleSave = async (sendToClient = false) => {
    await onSave({
      itinerary_items: days,
      margin_percent: margin,
      services_cost: servicesCost,
      final_price: finalPrice,
      workflow_status: sendToClient ? "SENT" : "DRAFT",
      ...(sendToClient ? { sent_at: new Date().toISOString() } : {}),
    });
  };

  const overlay = (
    <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-stretch justify-center bg-black/60 p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl mx-auto my-auto max-h-[min(100dvh-1rem,900px)] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="syne font-semibold text-slate-800">Itinerary Builder</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {request.full_name} · {request.group_size} pax · {request.start_date} → {request.end_date}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 rounded-xl px-4 py-2 text-sm">
              Services: <strong>€{servicesCost.toFixed(0)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Margin</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm font-bold text-blue-700">
              Total: €{finalPrice.toFixed(0)}
            </div>
          </div>
        </div>

        {aiSuggestion && (
          <div
            className="mx-6 mb-0 mt-3 px-4 py-2 rounded-xl text-sm flex flex-wrap items-center gap-2"
            style={{
              background: "rgba(99,102,241,.08)",
              border: "1px solid rgba(99,102,241,.2)",
              color: "#6366f1",
            }}
          >
            <span>
              ✨ AI suggested this itinerary using{" "}
              {aiSuggestion.catalogue_items?.length || 0} catalogue matches.
            </span>
            <span style={{ opacity: 0.75 }}>Review and edit before sending.</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="days" type="DAY">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {days.map((day, i) => (
                    <Draggable key={`day-${i}`} draggableId={`day-${i}`} index={i}>
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden"
                        >
                          <div
                            {...prov.dragHandleProps}
                            className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 cursor-grab"
                          >
                            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                              {day.day}
                            </span>
                            <input
                              value={day.title}
                              onChange={(e) => {
                                const nd = [...days];
                                nd[i].title = e.target.value;
                                setDays(nd);
                              }}
                              className="flex-1 text-sm font-semibold bg-transparent border-none outline-none"
                            />
                            <button onClick={() => removeDay(i)} className="text-red-400 hover:text-red-600 text-xs">
                              Remove
                            </button>
                          </div>
                          <Droppable droppableId={`activities-${i}`}>
                            {(ap) => (
                              <div
                                ref={ap.innerRef}
                                {...ap.droppableProps}
                                className="p-3 space-y-2 min-h-[48px]"
                              >
                                {(day.activities || []).map((act, ai) => (
                                  <Draggable key={`act-${i}-${ai}`} draggableId={`act-${i}-${ai}`} index={ai}>
                                    {(drag) => (
                                      <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        {...drag.dragHandleProps}
                                        className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100 text-sm cursor-grab"
                                      >
                                        <span className="flex-1">{act}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const nd = [...days];
                                            nd[i].activities.splice(ai, 1);
                                            setDays(nd);
                                          }}
                                          className="text-red-300 hover:text-red-500 text-xs cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {ap.placeholder}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const act = window.prompt("Add activity:");
                                    if (!act) return;
                                    const nd = [...days];
                                    nd[i].activities = [...(nd[i].activities || []), act];
                                    setDays(nd);
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-700 px-3 py-1"
                                >
                                  + Add activity
                                </button>
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <button
            onClick={addDay}
            className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            + Add Day
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Save Draft
            </button>
            <button onClick={() => handleSave(true)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold">
              Send to Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default function PlanningRequestsPage({ toast }) {
  const INIT_PLANNING = useMemo(() => ([
    { id:"PR-001", full_name:"Alice Martin", email:"alice@gmail.com", start_date:"2026-05-01", end_date:"2026-05-10", group_size:2, group_type:"Couple", budget_range:"€1200-2500", cities:["Marrakech","Fès"], status:"new", created_at:"2026-03-20" },
    { id:"PR-002", full_name:"James Okonkwo", email:"james@company.com", start_date:"2026-06-15", end_date:"2026-06-22", group_size:12, group_type:"Corporate", budget_range:"€2500+", cities:["Marrakech","Sahara"], status:"contacted", created_at:"2026-03-19" },
    { id:"PR-003", full_name:"Sophie Leblanc", email:"sophie@mail.fr", start_date:"2026-04-20", end_date:"2026-04-27", group_size:4, group_type:"Family", budget_range:"€500-1200", cities:["Marrakech","Essaouira"], status:"quoted", quoted_price:3200, created_at:"2026-03-18" },
  ]), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // view
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ status: "new", quoted_price: "", admin_notes: "" });
  const [confirmId, setConfirmId] = useState(null);
  const [builderTarget, setBuilderTarget] = useState(null);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleAISuggest = async (request) => {
    setAiLoading(request.id);
    try {
      const { suggestion } = await adminApi.ai.suggestItinerary(request.id);
      if (suggestion?.error) throw new Error(suggestion.error);
      setAiSuggestion(suggestion);
      setBuilderTarget(request);
      toast?.(
        `AI suggested ${suggestion.days?.length || 0} days — review and edit`,
        "success"
      );
    } catch (e) {
      toast?.(e?.message || "AI suggestion failed", "error");
    } finally {
      setAiLoading(null);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.packages.planningRequests();
      setRows(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load planning requests");
      setRows(INIT_PLANNING);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const by = Object.fromEntries(STATUS.map((s) => [s, 0]));
    for (const r of rows) by[r.status || "new"] = (by[r.status || "new"] || 0) + 1;
    return {
      new: by.new || 0,
      in_progress: by.in_progress || 0,
      quoted: by.quoted || 0,
      confirmed: by.confirmed || 0,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => (r.status || "new") === filter);
  }, [rows, filter]);

  const openView = (r) => {
    setTarget(r);
    setForm({
      status: r.status || "new",
      quoted_price: r.quoted_price ?? "",
      admin_notes: r.admin_notes || "",
    });
    setModal("view");
  };

  const save = async () => {
    if (!target?.id) return;
    try {
      const payload = {
        status: form.status,
        quoted_price: form.quoted_price === "" ? null : Number(form.quoted_price),
        admin_notes: form.admin_notes || null,
      };
      const updated = await adminApi.packages.updateRequest(target.id, payload);
      setRows((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      toast?.("Planning request updated", "success");
      setModal(null);
    } catch (e) {
      toast?.(e?.message || "Failed to update request", "error");
    }
  };

  const del = async (id) => {
    toast?.("Delete is not implemented server-side for planning requests", "error");
    setConfirmId(null);
  };

  const saveBuilder = async (payload) => {
    if (!builderTarget?.id) return;
    try {
      const updated = await adminApi.packages.updateRequest(builderTarget.id, payload);
      setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast?.("Itinerary saved", "success");
      setBuilderTarget(null);
    } catch (e) {
      toast?.(e?.message || "Failed to save itinerary", "error");
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="syne text-2xl font-semibold text-slate-800">Planning Requests</h1>
        <p className="text-xs text-slate-400 mt-1">Read + status management for custom trip requests.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["New Requests", stats.new, "#eff6ff"],
          ["In Progress", stats.in_progress, "#fffbeb"],
          ["Quoted", stats.quoted, "#eef2ff"],
          ["Confirmed", stats.confirmed, "#ecfdf5"],
        ].map(([l, v, bg]) => (
          <div key={l} className="rounded-2xl px-4 py-3" style={{ background: bg }}>
            <p className="text-xs text-slate-400">{l}</p>
            <p className="syne text-xl font-semibold mt-1 text-slate-800">{v}</p>
          </div>
        ))}
      </div>

      <Card p="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {["all", ...STATUS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === s ? "bg-slate-800 text-white" : "text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
              type="button"
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <Table
            columns={[
              { key: "id", label: "ID", render: (v) => <span className="font-mono text-xs font-semibold text-slate-500">{String(v).slice(0, 8)}</span> },
              { key: "full_name", label: "Customer", render: (_v, r) => (
                <div>
                  <p className="font-semibold text-slate-800">{r.full_name}</p>
                  <p className="text-xs text-slate-400">{r.email}</p>
                </div>
              )},
              { key: "dates", label: "Dates", render: (_v, r) => (
                <span className="text-xs text-slate-500">{r.start_date || "—"} → {r.end_date || "—"}</span>
              )},
              { key: "group", label: "Group", render: (_v, r) => <span className="text-xs text-slate-500">{r.group_size || 1} · {r.group_type || "—"}</span> },
              { key: "budget_range", label: "Budget", render: (v) => <span className="text-xs text-slate-500">{v || "—"}</span> },
              { key: "cities", label: "Cities", render: (v) => <span className="text-xs text-slate-500">{Array.isArray(v) ? v.join(", ") : "—"}</span> },
              { key: "status", label: "Status", render: (v) => <Badge tone={badgeTone(v)}>{v || "new"}</Badge> },
              {
                key: "workflow_status",
                label: "Workflow",
                render: (v) => (
                  <Badge tone={workflowTone(v || "DRAFT")}>{v || "DRAFT"}</Badge>
                ),
              },
              { key: "created_at", label: "Received", render: (v) => <span className="text-xs text-slate-400">{v ? new Date(v).toLocaleString() : "—"}</span> },
              {
                key: "actions",
                label: "",
                render: (_v, r) => (
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <Button size="xs" variant="ghost" icon="eye" onClick={() => openView(r)}>View</Button>
                    <button
                      type="button"
                      onClick={() => handleAISuggest(r)}
                      disabled={aiLoading === r.id}
                      className="px-2 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      style={{
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        color: "#fff",
                        border: "none",
                        cursor: aiLoading === r.id ? "wait" : "pointer",
                        opacity: aiLoading === r.id ? 0.6 : 1,
                      }}
                    >
                      {aiLoading === r.id ? "⏳ Thinking…" : "✨ Suggest"}
                    </button>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon="edit"
                      onClick={() => {
                        setAiSuggestion(null);
                        setBuilderTarget(r);
                      }}
                    >
                      Edit Itinerary
                    </Button>
                    <Button size="xs" variant="ghost" icon="trash" onClick={() => setConfirmId(r.id)}>Delete</Button>
                  </div>
                ),
              },
            ]}
            data={filtered}
          />
        )}
      </Card>

      <Modal
        open={modal === "view"}
        title="Planning request"
        onClose={() => setModal(null)}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Close</Button><Button onClick={save}>Save Changes</Button></>}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
              <p className="text-xs text-slate-400">Customer</p>
              <p className="font-semibold text-slate-800">{target?.full_name}</p>
              <p className="text-xs text-slate-500">{target?.email}</p>
              {target?.phone && <p className="text-xs text-slate-500 mt-1">{target.phone}</p>}
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
              <p className="text-xs text-slate-400">Trip</p>
              <p className="text-xs text-slate-600">{target?.start_date || "—"} → {target?.end_date || "—"}</p>
              <p className="text-xs text-slate-600 mt-1">{target?.group_size || 1} · {target?.group_type || "—"}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs text-slate-400">Details</p>
            <p className="text-xs text-slate-600 mt-2"><span className="font-semibold">Cities:</span> {Array.isArray(target?.cities) ? target.cities.join(", ") : "—"}</p>
            <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Interests:</span> {Array.isArray(target?.interests) ? target.interests.join(", ") : "—"}</p>
            <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Budget:</span> {target?.budget_range || "—"}</p>
            <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Accommodation:</span> {target?.accommodation_type || "—"}</p>
            {target?.special_requests && (
              <p className="text-xs text-slate-600 mt-2"><span className="font-semibold">Requests:</span> {target.special_requests}</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input label="Quoted price (€)" type="number" value={form.quoted_price} onChange={(e) => setForm((f) => ({ ...f, quoted_price: e.target.value }))} />
            </div>
            <Textarea label="Admin notes" rows={4} value={form.admin_notes} onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete request?"
        desc="Delete is disabled by default. Implement server delete if you need it."
        onClose={() => setConfirmId(null)}
        onConfirm={() => del(confirmId)}
      />

      {builderTarget && (
        <ItineraryBuilderModal
          key={builderTarget.id}
          request={builderTarget}
          aiSuggestion={aiSuggestion}
          onSave={saveBuilder}
          onClose={() => {
            setBuilderTarget(null);
            setAiSuggestion(null);
          }}
        />
      )}
    </div>
  );
}

