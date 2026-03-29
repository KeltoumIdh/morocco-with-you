import { useState } from "react";
import { Ico } from "../icons";
import { itinerariesApi } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

const DESTINATIONS = ["All Morocco", "Marrakech", "Fès", "Sahara", "Coast"];
const DURATIONS    = ["Weekend", "1 Week", "2 Weeks"];
const VIBES        = ["Adventure", "Culture", "Relaxation", "Foodie", "Mixed"];

export default function QuickTripWidget({ setPage, setGeneratedItinerary }) {
  const toast = useToast();
  const [dest,     setDest]     = useState("All Morocco");
  const [duration, setDuration] = useState("1 Week");
  const [vibe,     setVibe]     = useState("Mixed");
  const [loading,  setLoading]  = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await itinerariesApi.generate({
        duration,
        group:     "Solo",
        budget:    "Mid-range",
        interests: [vibe, dest === "All Morocco" ? "Morocco" : dest],
      });
      setGeneratedItinerary(result.itinerary || result);
      setPage("itinerary");
    } catch {
      toast("Could not generate itinerary. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-5 md:mx-8 lg:mx-14 mb-10 rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#2C1F12 0%,#4a2c1a 60%,#8B5E3C 100%)", border: "1px solid rgba(212,168,83,.2)" }}>
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--gold)", letterSpacing: ".15em" }}>Instant AI</p>
            <h2 className="font-display text-white" style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 400 }}>
              Build My Trip in <em>30 Seconds</em>
            </h2>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
            style={{ background: "rgba(212,168,83,.2)", flexShrink: 0 }}>
            <Ico.Sparkle />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Selector label="Destination" value={dest} options={DESTINATIONS} onChange={setDest} />
          <Selector label="Duration"    value={duration} options={DURATIONS} onChange={setDuration} />
          <Selector label="Vibe"        value={vibe} options={VIBES} onChange={setVibe} />
        </div>

        <button onClick={handleGenerate} disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm"
          style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.4)", opacity: loading ? .8 : 1 }}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> AI is crafting your journey…</>
            : <><Ico.Sparkle /> Generate Instant Itinerary →</>
          }
        </button>
      </div>
    </div>
  );
}

function Selector({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(212,168,83,.7)", letterSpacing: ".1em" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium"
        style={{ background: "rgba(250,246,238,.1)", border: "1.5px solid rgba(212,168,83,.25)", color: "#fff", fontFamily: "'DM Sans',sans-serif", outline: "none", cursor: "pointer" }}>
        {options.map((o) => <option key={o} value={o} style={{ background: "#2C1F12", color: "#fff" }}>{o}</option>)}
      </select>
    </div>
  );
}
