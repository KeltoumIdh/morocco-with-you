import { useState } from "react";
import { Ico } from "../icons";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

const EVENT_TYPES = ["Corporate retreat", "Wedding", "Birthday", "Anniversary", "Private tour", "Other"];
const BUDGET_RANGES = ["Under €2,000", "€2,000 – €5,000", "€5,000 – €10,000", "€10,000 – €20,000", "€20,000+"];

const EMPTY = {
  event_type: "",
  group_size: "",
  date_from: "",
  date_to: "",
  budget_range: "",
  requirements: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
};

export default function EventRequestPage({ setPage }) {
  const toast = useToast();
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSub]  = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.event_type || !form.contact_email || !form.contact_name) {
      toast("Please fill in all required fields", "warning");
      return;
    }
    setSub(true);
    try {
      await api.post("/events/request", {
        ...form,
        group_size: Number(form.group_size) || 0,
        preferred_dates: form.date_from && form.date_to ? `[${form.date_from},${form.date_to}]` : null,
      });
      setSuccess(true);
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSub(false);
    }
  };

  if (success) {
    return (
      <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10 px-5 md:px-8 lg:px-10 flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto mb-6"
            style={{ background: "linear-gradient(135deg,var(--sage),#4a7c59)" }}>
            <Ico.Check />
          </div>
          <h1 className="font-display mb-3" style={{ fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>
            Request <em>Received!</em>
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--smoke)" }}>
            Thank you, <strong>{form.contact_name}</strong>. Our team will contact you at <strong>{form.contact_email}</strong> within 24 hours to discuss your custom Morocco experience.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setPage("home")}
              className="px-6 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer" }}>
              Back to Home
            </button>
            <button onClick={() => { setForm(EMPTY); setSuccess(false); }}
              className="px-6 py-3 rounded-2xl text-sm font-medium"
              style={{ background: "var(--light-clay)", color: "var(--ink)", border: "none", cursor: "pointer" }}>
              New Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pt-14 md:pt-0 pb-24 lg:pb-10">

      {/* Header */}
      <div className="px-5 md:px-8 lg:px-14 py-8 border-b" style={{ borderColor: "var(--light-clay)" }}>
        <button onClick={() => setPage("groups")} className="flex items-center gap-2 text-sm mb-4"
          style={{ color: "var(--smoke)", background: "none", border: "none", cursor: "pointer" }}>
          <Ico.Arrow d="left" /> Back to Group Trips
        </button>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>Bespoke Experience</p>
        <h1 className="font-display" style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 400, color: "var(--ink)" }}>
          Request a <em>Custom Event</em>
        </h1>
        <p className="text-sm mt-2 max-w-xl" style={{ color: "var(--smoke)" }}>
          Tell us about your dream Morocco experience. We'll craft a fully personalised proposal within 24 hours.
        </p>
      </div>

      <div className="px-5 md:px-8 lg:px-14 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Event type */}
          <div>
            <label className="label-xs">Event Type *</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EVENT_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => set("event_type", t)}
                  className="chip"
                  style={{ background: form.event_type === t ? "var(--ink)" : "transparent", color: form.event_type === t ? "var(--parchment)" : "var(--smoke)", borderColor: form.event_type === t ? "var(--ink)" : "var(--clay)", cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Group size + dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-xs">Group Size</label>
              <input type="number" min="2" max="500" value={form.group_size} onChange={(e) => set("group_size", e.target.value)}
                placeholder="e.g. 20" className="form-input mt-1.5" />
            </div>
            <div>
              <label className="label-xs">From Date</label>
              <input type="date" value={form.date_from} onChange={(e) => set("date_from", e.target.value)} className="form-input mt-1.5" />
            </div>
            <div>
              <label className="label-xs">To Date</label>
              <input type="date" value={form.date_to} onChange={(e) => set("date_to", e.target.value)} className="form-input mt-1.5" />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="label-xs">Budget Range</label>
            <select value={form.budget_range} onChange={(e) => set("budget_range", e.target.value)} className="form-input mt-1.5">
              <option value="">Select budget range</option>
              {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          {/* Requirements */}
          <div>
            <label className="label-xs">Special Requirements</label>
            <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={4}
              placeholder="Tell us about dietary needs, accessibility requirements, specific activities, themes, or anything else that matters to you…"
              className="form-input mt-1.5" style={{ resize: "none" }} />
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display mb-4" style={{ fontSize: 20, fontWeight: 400, color: "var(--ink)" }}>Contact <em>Details</em></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-xs">Full Name *</label>
                <input type="text" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)}
                  placeholder="Your name" required className="form-input mt-1.5" />
              </div>
              <div>
                <label className="label-xs">Email *</label>
                <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)}
                  placeholder="you@example.com" required className="form-input mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <label className="label-xs">Phone (optional)</label>
                <input type="tel" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)}
                  placeholder="+1 234 567 8900" className="form-input mt-1.5" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)", opacity: submitting ? .8 : 1 }}>
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending your request…</>
              : "Send Event Request"
            }
          </button>

          <p className="text-center text-xs" style={{ color: "var(--clay)" }}>
            We'll contact you within 24 hours · No commitment required
          </p>
        </form>
      </div>
    </div>
  );
}
