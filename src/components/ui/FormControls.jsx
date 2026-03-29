import { useState } from "react";
import Icon from "../Icon";
import { ICONS } from "../../config/nav";
import Button from "./Button";
import { POPULAR_EXPERIENCE_TAGS, normalizeExperienceTag } from "../../config/experienceTags";

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function Input({ label, required, className = "", ...props }) {
  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <input
        {...props}
        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </div>
  );
}

function Textarea({ label, required, rows = 3, className = "", ...props }) {
  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <textarea
        rows={rows}
        {...props}
        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
      />
    </div>
  );
}

function Select({ label, required, children, className = "", ...props }) {
  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <select
        {...props}
        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function tagKey(t) {
  return String(t).trim().toLowerCase();
}

function TagInput({
  value = [],
  onChange,
  popularTags = POPULAR_EXPERIENCE_TAGS,
  label = "Tags",
  hint = "Popular — click to add; you can still type a custom tag below.",
}) {
  const [input, setInput] = useState("");

  const hasTag = (raw) => {
    const n = normalizeExperienceTag(raw);
    if (!n) return false;
    const k = tagKey(n);
    return value.some((v) => tagKey(v) === k);
  };

  const addNormalized = (raw) => {
    const t = normalizeExperienceTag(raw);
    if (!t || hasTag(t)) return;
    onChange?.([...value, t]);
  };

  const add = () => {
    addNormalized(input);
    setInput("");
  };

  const remove = (tag) => {
    const k = tagKey(tag);
    onChange?.(value.filter((t) => tagKey(t) !== k));
  };

  return (
    <div>
      <Label>{label}</Label>
      {hint ? <p className="text-[11px] text-slate-400 mb-1.5">{hint}</p> : null}
      {(popularTags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {popularTags.map((p) => {
            const active = hasTag(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => (active ? remove(p) : addNormalized(p))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  active
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {active ? "✓ " : ""}
                {p}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tagKey(tag) + tag}
            className="tag-chip inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
          >
            {tag}
            <button
              onClick={() => remove(tag)}
              className="hover:text-red-500"
              type="button"
              aria-label={`Remove ${tag}`}
            >
              <Icon d={ICONS.x} size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Custom tag, then Enter or Add"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <Button onClick={add} variant="ghost" size="xs">
          Add
        </Button>
      </div>
    </div>
  );
}

export { Label, Input, Textarea, Select, TagInput };

