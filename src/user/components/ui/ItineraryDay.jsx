import { useState } from "react";
import { Ico } from "../../icons";
import { googleMapsUrlForItineraryItem } from "../../utils/itineraryHelpers";

function EditableItem({ item, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState({ ...item });

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft({ ...item }); setEditing(false); };

  if (editing) {
    return (
      <div className="rounded-2xl p-4" style={{ background: "rgba(192,101,74,.05)", border: "1.5px solid var(--terracotta)" }}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="label-xs">Time</label>
            <input value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              className="form-input mt-1" style={{ fontSize: 12 }} />
          </div>
          <div>
            <label className="label-xs">Duration</label>
            <input value={draft.duration} onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
              className="form-input mt-1" style={{ fontSize: 12 }} />
          </div>
        </div>
        <div className="mb-2">
          <label className="label-xs">Activity</label>
          <input value={draft.activity} onChange={(e) => setDraft((d) => ({ ...d, activity: e.target.value }))}
            className="form-input mt-1" />
        </div>
        <div className="mb-2">
          <label className="label-xs">Note</label>
          <textarea value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            rows={2} className="form-input mt-1" style={{ resize: "none", fontSize: 12 }} />
        </div>
        <div className="mb-3">
          <label className="label-xs">Location</label>
          <input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            className="form-input mt-1" style={{ fontSize: 12 }} />
        </div>
        <div className="flex gap-2">
          <button onClick={save}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer" }}>
            Save
          </button>
          <button onClick={cancel}
            className="px-4 py-2 rounded-xl text-xs"
            style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const spotMapsUrl = googleMapsUrlForItineraryItem(item);

  return (
    <div className="rounded-2xl p-4 group relative" style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)", boxShadow: "0 2px 12px rgba(26,20,16,.05)" }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--terracotta)", letterSpacing: ".1em" }}>{item.time}</span>
          <h4 className="font-display mt-0.5" style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{item.activity}</h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--smoke)" }}>
            <Ico.Clock />{item.duration}
          </span>
          <button onClick={() => setEditing(true)} title="Edit this activity"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--light-clay)", border: "none", cursor: "pointer", color: "var(--smoke)" }}>
            <Ico.Edit />
          </button>
        </div>
      </div>
      {item.note && <p className="text-sm leading-relaxed" style={{ color: "var(--smoke)" }}>{item.note}</p>}
      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--gold)" }}>
          <Ico.Pin />
          <span className="text-xs" style={{ color: "var(--smoke)" }}>{item.location || "Morocco"}</span>
        </div>
        {spotMapsUrl && (
          <a
            href={spotMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "var(--light-clay)", color: "var(--terracotta)" }}
            onClick={(e) => e.stopPropagation()}
          >
            Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

export default function ItineraryDay({ day, items, onUpdateItem }) {
  const [localItems, setLocalItems] = useState(items);

  const handleSave = (index, updated) => {
    const next = localItems.map((it, i) => (i === index ? updated : it));
    setLocalItems(next);
    onUpdateItem?.(day, next);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,var(--gold),var(--terracotta))" }}>
          {day}
        </div>
        <h3 className="font-display text-lg" style={{ color: "var(--ink)", fontWeight: 500 }}>
          Day <em>{day}</em>
        </h3>
      </div>

      <div className="relative pl-6">
        <div className="tl-line draw-line absolute left-0 top-0 bottom-0" style={{ height: 0 }} />
        {localItems.map((item, i) => (
          <div key={i} className="relative mb-4 last:mb-0">
            <div className="absolute -left-[25px] top-3 w-3 h-3 rounded-full border-2 flex-shrink-0"
              style={{ background: i === 0 ? "var(--terracotta)" : "var(--gold)", borderColor: i === 0 ? "var(--terracotta)" : "var(--gold)" }} />
            <EditableItem item={item} onSave={(updated) => handleSave(i, updated)} />
          </div>
        ))}
      </div>
    </div>
  );
}
