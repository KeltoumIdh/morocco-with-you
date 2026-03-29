import { useState } from "react";
import { Ico, MoroccoMotif } from "../icons";
import { useItinerary } from "../../hooks/useItinerary";

const DURATIONS = ["3–4 days", "5–7 days", "8–10 days", "2 weeks+"];
const GROUPS    = ["Solo", "Couple", "Small group (3–5)", "Family", "Large group (6+)", "Corporate"];
const BUDGETS   = ["Budget (< €500)", "Mid-range (€500–1,200)", "Premium (€1,200–2,500)", "Luxury (€2,500+)"];
const INTERESTS = ["Desert & Sahara", "Medinas & Culture", "Food & Cuisine", "Hiking & Nature", "Photography", "Luxury Riads", "Surf & Coast", "Nightlife", "Architecture", "Spiritual"];
const STEPS     = ["Duration", "Group", "Budget", "Interests"];

export default function AIPage({ setPage, setGeneratedItinerary }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ duration: "", group: "", budget: "", interests: [] });
  const { generate, generating, error } = useItinerary();

  const toggleInterest = (i) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i],
    }));

  const canNext = () => {
    if (step === 0) return !!form.duration;
    if (step === 1) return !!form.group;
    if (step === 2) return !!form.budget;
    if (step === 3) return form.interests.length > 0;
    return false;
  };

  const handleGenerate = async () => {
    try {
      const itinerary = await generate({
        duration:  form.duration,
        group:     form.group,
        budget:    form.budget,
        interests: form.interests,
      });
      // Pass the full itinerary object (content holds the day-by-day plan)
      setGeneratedItinerary(itinerary);
      setPage("itinerary");
    } catch {
      // error shown inline via hook
    }
  };

  const progress = (step / (STEPS.length - 1)) * 100;

  const ctaLabel = generating
    ? "AI is crafting your journey…"
    : step < STEPS.length - 1
      ? "Continue"
      : "Generate Itinerary";

  const ctaIcon = generating
    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
    : step < STEPS.length - 1
      ? <Ico.Arrow />
      : <Ico.Sparkle />;

  const canSubmit = canNext() && !generating;

  return (
    <div className="page-enter min-h-screen">
      {/* Mobile */}
      <div className="lg:hidden pt-14 px-5 pb-24">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>
            <StepTitle step={step} />
          </h1>
          <div className="step-track mt-4"><div className="step-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <StepContent step={step} form={form} setForm={setForm} toggleInterest={toggleInterest} />
        {error && <p className="text-sm mt-3" style={{ color: "var(--terracotta)" }}>{error}</p>}
        <button disabled={!canSubmit}
          onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : handleGenerate()}
          className="w-full mt-8 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: canSubmit ? "linear-gradient(135deg,var(--terracotta),var(--deep))" : "var(--light-clay)", color: canSubmit ? "#fff" : "var(--smoke)", border: "none", cursor: canSubmit ? "pointer" : "not-allowed", boxShadow: canSubmit ? "0 8px 28px rgba(192,101,74,.3)" : "none" }}>
          {ctaIcon} {ctaLabel}
        </button>
      </div>

      {/* Desktop 2-panel */}
      <div className="hidden lg:grid grid-cols-5 min-h-screen">
        <div className="col-span-2 pattern-bg relative flex flex-col justify-between p-12 overflow-hidden">
          <MoroccoMotif />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(212,168,83,.2)" }}>
              <Ico.Sparkle />
            </div>
            <h2 className="font-display text-white mb-3" style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.1 }}>AI Trip <em>Planner</em></h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>
              Answer 4 quick questions and we'll generate your perfect Morocco itinerary — day by day, experience by experience.
            </p>
          </div>
          <div className="relative z-10 space-y-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: i <= step ? "var(--terracotta)" : "rgba(255,255,255,.1)", color: i <= step ? "#fff" : "rgba(255,255,255,.3)" }}>
                  {i < step ? <Ico.Check /> : i + 1}
                </div>
                <span style={{ fontSize: 13, color: i === step ? "#fff" : "rgba(255,255,255,.4)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 flex flex-col justify-center px-16 py-12" style={{ background: "var(--parchment)" }}>
          <div className="max-w-lg mx-auto w-full">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
              Step {step + 1} — {STEPS[step]}
            </p>
            <h2 className="font-display mb-8" style={{ fontSize: 32, fontWeight: 400, color: "var(--ink)" }}>
              <StepTitle step={step} />
            </h2>
            <StepContent step={step} form={form} setForm={setForm} toggleInterest={toggleInterest} />
            {error && <p className="text-sm mt-3" style={{ color: "var(--terracotta)" }}>{error}</p>}
            <button disabled={!canSubmit}
              onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : handleGenerate()}
              className="mt-10 w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: canSubmit ? "linear-gradient(135deg,var(--terracotta),var(--deep))" : "var(--light-clay)", color: canSubmit ? "#fff" : "var(--smoke)", border: "none", cursor: canSubmit ? "pointer" : "not-allowed", boxShadow: canSubmit ? "0 8px 28px rgba(192,101,74,.3)" : "none" }}>
              {ctaIcon} {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ step }) {
  const titles = [
    <>How long is your <em>trip?</em></>,
    <>Who are you <em>travelling with?</em></>,
    <>What's your <em>budget?</em></>,
    <>What are your <em>interests?</em></>,
  ];
  return titles[step] || null;
}

function StepContent({ step, form, setForm, toggleInterest }) {
  const radioStyle = (active) => ({
    background: active ? "rgba(192,101,74,.08)" : "var(--parchment)",
    border: active ? "1.5px solid var(--terracotta)" : "1.5px solid var(--clay)",
    color: active ? "var(--terracotta)" : "var(--ink)",
    cursor: "pointer",
  });

  if (step === 0) return (
    <div className="space-y-3">
      {DURATIONS.map((d) => (
        <button key={d} onClick={() => setForm((f) => ({ ...f, duration: d }))}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
          style={radioStyle(form.duration === d)}>
          <span className="font-medium">{d}</span>
          {form.duration === d && <Ico.Check />}
        </button>
      ))}
    </div>
  );

  if (step === 1) return (
    <div className="grid grid-cols-2 gap-3">
      {GROUPS.map((g) => (
        <button key={g} onClick={() => setForm((f) => ({ ...f, group: g }))}
          className="px-4 py-4 rounded-2xl text-sm font-medium transition-all"
          style={radioStyle(form.group === g)}>
          {g}
        </button>
      ))}
    </div>
  );

  if (step === 2) return (
    <div className="space-y-3">
      {BUDGETS.map((b) => (
        <button key={b} onClick={() => setForm((f) => ({ ...f, budget: b }))}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
          style={radioStyle(form.budget === b)}>
          <span className="font-medium">{b}</span>
          {form.budget === b && <Ico.Check />}
        </button>
      ))}
    </div>
  );

  if (step === 3) return (
    <div className="flex flex-wrap gap-2">
      {INTERESTS.map((i) => (
        <button key={i} onClick={() => toggleInterest(i)}
          className={`chip ${form.interests.includes(i) ? "chip-active" : "chip-inactive"}`}>
          {i}
        </button>
      ))}
    </div>
  );

  return null;
}
