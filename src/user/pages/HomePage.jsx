import { useState } from "react";
import ExperienceCard from "../components/ui/ExperienceCard";
import QuickTripWidget from "../components/QuickTripWidget";
import RecommendationsSection from "../components/RecommendationsSection";
import { Ico, MoroccoMotif } from "../icons";
import { useExperiences } from "../../hooks/useExperiences";

const DESTINATIONS = ["Marrakech", "Fès", "Sahara", "Chefchaouen", "Essaouira", "Atlas"];

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sand)", border: "1px solid var(--light-clay)" }}>
      <div className="h-[220px] shimmer" style={{ background: "linear-gradient(90deg,var(--light-clay) 25%,var(--sand) 50%,var(--light-clay) 75%)", backgroundSize: "200% 100%" }} />
      <div className="p-4 space-y-2">
        <div className="h-3 rounded-full shimmer w-3/4" style={{ background: "var(--clay)" }} />
        <div className="h-3 rounded-full shimmer w-1/2" style={{ background: "var(--clay)" }} />
      </div>
    </div>
  );
}

export default function HomePage({ setPage, setGeneratedItinerary, setSelectedExperience }) {
  const [search, setSearch] = useState("");
  const { experiences, loading } = useExperiences({ sort: "rating", limit: 6 });

  return (
    <div className="page-enter">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "72vh", background: "linear-gradient(160deg,#2C1F12 0%,#4a2c1a 40%,#8B5E3C 100%)" }}>
        <MoroccoMotif />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 50%,rgba(212,168,83,.12) 0%,transparent 70%)" }} />

        {/* Desktop floating card */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-72 rounded-3xl p-6 z-10"
          style={{ background: "rgba(250,246,238,.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(212,168,83,.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--gold)", letterSpacing: ".15em" }}>Trending now</p>
          {(loading ? [{}, {}, {}] : experiences.slice(0, 3)).map((exp, i) => (
            <div key={exp.id || i} className="flex items-center gap-3 mb-3 last:mb-0 cursor-pointer" onClick={() => setPage("explore")}>
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: exp.gradient || "var(--light-clay)" }} />
              <div>
                {loading
                  ? <div className="h-3 w-24 rounded-full" style={{ background: "rgba(255,255,255,.15)" }} />
                  : <>
                      <p className="text-sm font-medium text-white leading-tight">{exp.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>€{exp.price}</p>
                    </>
                }
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 px-5 md:px-10 lg:px-14 flex flex-col justify-center" style={{ minHeight: "72vh", paddingTop: 64, paddingBottom: 48 }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gold)", letterSpacing: ".18em" }}>Morocco With You</p>
          <h1 className="font-display text-white" style={{ fontSize: "clamp(40px,7vw,88px)", lineHeight: 1.0, fontWeight: 400, maxWidth: 680 }}>
            Discover Morocco Through <em>Extraordinary</em> Journeys
          </h1>
          <p className="mt-5 max-w-lg" style={{ fontSize: 16, color: "rgba(255,255,255,.7)", lineHeight: 1.65 }}>
            From Marrakech riads to Sahara sunsets — curated experiences, local experts, instant booking.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl search-glow rounded-2xl p-2"
            style={{ background: "rgba(250,246,238,.1)", border: "1.5px solid rgba(212,168,83,.25)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 flex-1 px-3">
              <Ico.Search />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setPage("explore")}
                placeholder="Where do you want to explore?"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: "#fff", fontFamily: "'DM Sans',sans-serif" }} />
            </div>
            <button onClick={() => setPage("explore")}
              className="px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)" }}>
              Explore
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {DESTINATIONS.map((d) => (
              <button key={d} onClick={() => setPage("explore")} className="chip"
                style={{ borderColor: "rgba(212,168,83,.35)", color: "rgba(255,255,255,.75)", background: "rgba(255,255,255,.07)" }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="py-4 overflow-hidden" style={{ background: "var(--deep)", borderBottom: "1px solid rgba(212,168,83,.15)" }}>
        <div className="marquee-track">
          {[...Array(2)].flatMap(() =>
            ["Marrakech", "Sahara Desert", "Fès Medina", "Atlas Mountains", "Chefchaouen", "Essaouira", "Agafay", "Ouarzazate"].map((t) => (
              <span key={t + Math.random()} className="mx-8 text-sm font-medium" style={{ color: "rgba(212,168,83,.6)", whiteSpace: "nowrap" }}>✦ {t}</span>
            ))
          )}
        </div>
      </div>

      {/* ── QUICK TRIP WIDGET ── */}
      <QuickTripWidget setPage={setPage} setGeneratedItinerary={setGeneratedItinerary} />

      {/* ── VERTICALS ── */}
      <section className="px-5 md:px-8 lg:px-14 pt-4 pb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>
              Discover more
            </p>
            <h2 className="font-display" style={{ fontSize: "clamp(24px,3.2vw,34px)", fontWeight: 400, color: "var(--ink)" }}>
              Our <em>Verticals</em>
            </h2>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0">
          {[
            { label: "Activities", emoji: "🏄", gradient: "linear-gradient(135deg,#7A8C6E,#2C3828)", page: "activities" },
            { label: "Hébergement", emoji: "🏡", gradient: "linear-gradient(135deg,#D4A853,#8B5E3C)", page: "accommodations" },
            { label: "Restaurants", emoji: "🍽", gradient: "linear-gradient(135deg,#C0654A,#1A1410)", page: "restaurants" },
            { label: "Plan My Trip", emoji: "🗺", gradient: "linear-gradient(135deg,#6B8CAE,#1A2C38)", page: "planning" },
          ].map((v) => (
            <button
              key={v.page}
              onClick={() => setPage(v.page)}
              className="card-lift flex-shrink-0 rounded-2xl overflow-hidden text-left"
              style={{
                width: 160,
                height: 100,
                background: v.gradient,
                border: "1px solid rgba(250,246,238,.18)",
                boxShadow: "0 10px 30px rgba(26,20,16,.10)",
                cursor: "pointer",
              }}
            >
              <div className="h-full w-full p-4 flex flex-col justify-between" style={{ color: "#fff" }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>{v.emoji}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display" style={{ fontSize: 18, fontWeight: 500 }}>{v.label}</span>
                  <span style={{ opacity: 0.85 }}><Ico.Arrow /></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FEATURED EXPERIENCES ── */}
      <section className="px-5 md:px-8 lg:px-14 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)", letterSpacing: ".12em" }}>Curated for you</p>
            <h2 className="font-display" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 400, color: "var(--ink)" }}>
              Featured <em>Experiences</em>
            </h2>
          </div>
          <button onClick={() => setPage("explore")} className="hidden sm:flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--terracotta)", background: "none", border: "none", cursor: "pointer" }}>
            View all <Ico.Arrow />
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-3 snap-x -mx-5 px-5">
          {loading
            ? Array(4).fill(0).map((_, i) => <div key={i} className="flex-shrink-0 w-48"><SkeletonCard /></div>)
            : experiences.map((exp) => <ExperienceCard key={exp.id} exp={exp} onTap={() => { setSelectedExperience?.(exp); setPage("experience"); }} compact />)
          }
        </div>
        {/* Tablet */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
          {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : experiences.slice(0, 4).map((exp) => <ExperienceCard key={exp.id} exp={exp} onTap={() => { setSelectedExperience?.(exp); setPage("experience"); }} />)}
        </div>
        {/* Desktop */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : experiences.map((exp) => <ExperienceCard key={exp.id} exp={exp} onTap={() => { setSelectedExperience?.(exp); setPage("experience"); }} />)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-5 md:px-8 lg:px-14 py-10 mb-4">
        <div className="rounded-3xl p-8 md:p-10 grid md:grid-cols-3 gap-6 md:gap-0"
          style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
          {[
            { icon: "✦", title: "Local Experts", desc: "Every experience is curated and led by certified local guides." },
            { icon: "◈", title: "Instant Booking", desc: "Confirm your experience in seconds, no back-and-forth." },
            { icon: "◇", title: "AI Trip Planner", desc: "Generate a full personalised itinerary in under a minute." },
          ].map((f, i) => (
            <div key={f.title} className="text-center px-4 md:px-8 relative">
              {i > 0 && <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px" style={{ background: "var(--clay)" }} />}
              <div className="text-2xl mb-3" style={{ color: "var(--gold)" }}>{f.icon}</div>
              <h3 className="font-display mb-2" style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--smoke)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECOMMENDATIONS ── */}
      <RecommendationsSection setPage={setPage} setSelectedExperience={setSelectedExperience} />

      {/* ── AI CTA ── */}
      <section className="px-5 md:px-8 lg:px-14 py-10 mb-20 lg:mb-8">
        <div className="pattern-bg relative rounded-3xl p-8 md:p-12 overflow-hidden text-center">
          <MoroccoMotif />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--gold)", letterSpacing: ".15em" }}>Powered by AI</p>
            <h2 className="font-display text-white mb-4" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 400 }}>
              Your perfect trip, <em>generated in seconds</em>
            </h2>
            <p className="max-w-lg mx-auto mb-6" style={{ fontSize: 15, color: "rgba(255,255,255,.6)", lineHeight: 1.65 }}>
              Tell us your dates, budget, and style. Our AI builds a day-by-day itinerary with the best local experiences.
            </p>
            <button onClick={() => setPage("ai")} className="ai-float inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm"
              style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)" }}>
              <Ico.Sparkle /> Plan My Trip with AI
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
