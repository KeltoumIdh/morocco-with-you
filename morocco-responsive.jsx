export default function MoroccoHeroSection() {
  return (
    <section className="relative isolate min-h-[85vh] w-full overflow-hidden bg-[#f7f1e6]">
      <img
        src="https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=2200&q=80"
        alt="Golden dunes in the Moroccan desert at sunset"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      <div className="relative mx-auto flex min-h-[85vh] w-full max-w-7xl items-center px-5 py-16 sm:px-8 md:px-10">
        <div className="max-w-3xl text-white">
          <p className="mb-4 inline-flex rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-[0.2em] backdrop-blur">
            MOROCCO WITH YOU
          </p>

          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Discover Morocco Through
            <span className="block text-[#f0bb80]">Extraordinary Journeys</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm text-white/90 sm:text-base md:text-lg">
            From Marrakech riads to Sahara sunsets, design a trip that feels personal, effortless, and unforgettable.
          </p>

          <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-white/25 bg-white/15 p-3 backdrop-blur-md sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Where do you want to explore in Morocco?"
              className="w-full rounded-xl border border-transparent bg-white/95 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#c0654a] focus:outline-none"
            />
            <button className="rounded-xl bg-[#c0654a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#a8533d]">
              Plan My Trip
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-white/80 sm:text-sm">
            <span className="rounded-full border border-white/30 px-3 py-1">Luxury stays</span>
            <span className="rounded-full border border-white/30 px-3 py-1">Local experts</span>
            <span className="rounded-full border border-white/30 px-3 py-1">Instant booking</span>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --sand:       #F5EFE0;
    --terracotta: #C0654A;
    --gold:       #D4A853;
    --ink:        #1A1410;
    --parchment:  #FAF6EE;
    --clay:       #E8C4A0;
    --sage:       #7A8C6E;
    --smoke:      #8B7355;
    --deep:       #2C1F12;
    --light-clay: #F2E8D8;
    --white:      #FFFFFF;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--parchment);
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--light-clay); }
  ::-webkit-scrollbar-thumb { background: var(--clay); border-radius: 3px; }

  .font-display { font-family: 'Cormorant Garamond', serif; }

  /* Grain overlay */
  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    opacity: 0.25;
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes floatPulse {
    0%,100% { transform: translateY(0) scale(1); box-shadow: 0 8px 32px rgba(192,101,74,.35); }
    50%     { transform: translateY(-5px) scale(1.02); box-shadow: 0 18px 44px rgba(192,101,74,.45); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }
  @keyframes typingDot {
    0%,60%,100% { transform: translateY(0); opacity: .4; }
    30%         { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes drawLine {
    from { height: 0; }
    to   { height: 100%; }
  }
  @keyframes scrollBounce {
    0%,100% { transform: translateX(-50%) translateY(0); }
    50%     { transform: translateX(-50%) translateY(6px); }
  }
  @keyframes bubbleIn {
    from { opacity: 0; transform: scale(.85) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .page-enter     { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) forwards; }
  .fade-in        { animation: fadeIn .4s ease forwards; }
  .ai-float       { animation: floatPulse 3s ease-in-out infinite; }
  .bubble-in      { animation: bubbleIn .3s cubic-bezier(.34,1.56,.64,1) forwards; }
  .draw-line      { animation: drawLine .8s .3s ease forwards; }
  .scroll-bounce  { animation: scrollBounce 1.8s ease-in-out infinite; }

  .typing-dot:nth-child(1) { animation: typingDot 1.2s 0s   infinite; }
  .typing-dot:nth-child(2) { animation: typingDot 1.2s .2s  infinite; }
  .typing-dot:nth-child(3) { animation: typingDot 1.2s .4s  infinite; }

  /* Stagger */
  .stagger > * { opacity: 0; }
  .stagger > *:nth-child(1) { animation: fadeUp .5s .05s cubic-bezier(.16,1,.3,1) forwards; }
  .stagger > *:nth-child(2) { animation: fadeUp .5s .12s cubic-bezier(.16,1,.3,1) forwards; }
  .stagger > *:nth-child(3) { animation: fadeUp .5s .19s cubic-bezier(.16,1,.3,1) forwards; }
  .stagger > *:nth-child(4) { animation: fadeUp .5s .26s cubic-bezier(.16,1,.3,1) forwards; }
  .stagger > *:nth-child(5) { animation: fadeUp .5s .33s cubic-bezier(.16,1,.3,1) forwards; }
  .stagger > *:nth-child(6) { animation: fadeUp .5s .40s cubic-bezier(.16,1,.3,1) forwards; }

  /* ── Cards ── */
  .card-lift { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease; }
  .card-lift:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(26,20,16,.14) !important; }
  .card-lift:active { transform: scale(.97); }

  .img-zoom img,
  .img-zoom .img-bg { transition: transform .65s cubic-bezier(.16,1,.3,1); }
  .img-zoom:hover .img-bg { transform: scale(1.06); }

  /* ── Tap ripple ── */
  .tap-ripple { position: relative; overflow: hidden; }
  .tap-ripple::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(212,168,83,.12);
    opacity: 0; border-radius: inherit;
    transition: opacity .2s;
  }
  .tap-ripple:active::after { opacity: 1; }

  /* ── Chip ── */
  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 7px 16px; border-radius: 100px;
    font-size: 12px; font-weight: 500; letter-spacing: .025em;
    border: 1.5px solid; cursor: pointer;
    transition: all .2s ease; white-space: nowrap;
  }
  .chip-active   { background: var(--ink);  color: var(--parchment); border-color: var(--ink); }
  .chip-inactive { background: transparent; color: var(--smoke);     border-color: var(--clay); }
  .chip-inactive:hover { background: var(--light-clay); border-color: var(--smoke); }

  /* ── Search ── */
  .search-glow:focus-within {
    box-shadow: 0 0 0 3px rgba(212,168,83,.22);
    border-color: var(--gold) !important;
  }

  /* ── Bottom nav dot ── */
  .nav-dot { width: 4px; height: 4px; border-radius: 2px; background: var(--terracotta); transition: width .3s cubic-bezier(.16,1,.3,1); }
  .nav-dot.active { width: 16px; }

  /* ── Step progress ── */
  .step-track { height: 2px; background: var(--light-clay); border-radius: 1px; overflow: hidden; }
  .step-fill  { height: 100%; background: linear-gradient(to right, var(--gold), var(--terracotta)); border-radius: 1px; transition: width .5s cubic-bezier(.16,1,.3,1); }

  /* ── Timeline ── */
  .tl-line { width: 2px; background: linear-gradient(to bottom, var(--gold), var(--terracotta)); border-radius: 2px; }

  /* ── Glass ── */
  .glass {
    background: rgba(250,246,238,.88);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
  }

  /* ── Gradient text ── */
  .grad-text {
    background: linear-gradient(135deg, var(--terracotta), var(--gold));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Scroll snap ── */
  .snap-x  { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
  .snap-s  { scroll-snap-align: start; }

  /* ── Desktop sidebar ── */
  .desktop-sidebar {
    width: 240px; flex-shrink: 0;
    border-right: 1px solid var(--light-clay);
    height: 100vh; position: sticky; top: 0;
    display: flex; flex-direction: column;
  }

  /* ── Desktop nav link ── */
  .desk-nav-link {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 16px; border-radius: 12px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all .2s; color: var(--smoke); border: none; background: none; width: 100%; text-align: left;
  }
  .desk-nav-link:hover  { background: var(--light-clay); color: var(--ink); }
  .desk-nav-link.active { background: rgba(192,101,74,.1); color: var(--terracotta); font-weight: 600; }

  /* ── Desktop hero ── */
  .hero-text-xl { font-size: clamp(52px, 7vw, 96px); line-height: 1.0; font-weight: 400; }

  /* ── Marquee ── */
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee-track { display: flex; animation: marquee 28s linear infinite; }
  .marquee-track:hover { animation-play-state: paused; }

  /* ── Moroccan SVG pattern ── */
  .pattern-bg {
    background-color: var(--deep);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='rgba(212,168,83,0.08)' stroke-width='1'%3E%3Cpolygon points='40,5 75,22.5 75,57.5 40,75 5,57.5 5,22.5'/%3E%3Cpolygon points='40,15 65,27.5 65,52.5 40,65 15,52.5 15,27.5'/%3E%3C/g%3E%3C/svg%3E");
  }

  /* ── Hover reveal overlay on experience cards ── */
  .exp-overlay { opacity: 0; transition: opacity .35s ease; }
  .img-zoom:hover .exp-overlay { opacity: 1; }

  /* ── Feature row on desktop ── */
  .feature-divider { width: 1px; background: var(--light-clay); }

  /* Input floating label */
  .fl-wrap { position: relative; }
  .fl-wrap input:focus + label,
  .fl-wrap input:not(:placeholder-shown) + label {
    transform: translateY(-20px) scale(.8);
    color: var(--terracotta);
    transform-origin: left;
  }
  .fl-wrap label {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    font-size: 14px; color: var(--smoke); pointer-events: none;
    transition: all .2s cubic-bezier(.16,1,.3,1);
    background: var(--parchment); padding: 0 4px;
  }
`;

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const Ico = {
  Home:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  Search:  () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  AI:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M8 12s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>,
  Chat:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Profile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Star:    ({f}) => <svg width="13" height="13" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Cal:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Users:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Clock:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Arrow:   ({d="right"}) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: d==="left"?"rotate(180deg)":d==="up"?"rotate(-90deg)":d==="down"?"rotate(90deg)":""}}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  Filter:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  Heart:   ({f}) => <svg width="18" height="18" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  Send:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Sparkle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/></svg>,
  Check:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Pin:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Mic:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Globe:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  Menu:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const EXPERIENCES = [
  { id:1, title:"Sahara Desert Overnight", location:"Merzouga, Errachidia", price:"€149", rating:"4.9", reviews:"218", duration:"2 days", maxGroup:8, tags:["Adventure","Desert"], gradient:"linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)" },
  { id:2, title:"Fès Medina Food Trail",   location:"Fès el-Bali",          price:"€65",  rating:"4.8", reviews:"312", duration:"4 hours", maxGroup:6, tags:["Food","Culture"],     gradient:"linear-gradient(145deg,#C0654A 0%,#8B3A2A 55%,#1A1410 100%)" },
  { id:3, title:"Atlas Mountain Trek",     location:"Imlil, Marrakech",     price:"€89",  rating:"4.7", reviews:"156", duration:"Full day", maxGroup:10, tags:["Hiking","Nature"],  gradient:"linear-gradient(145deg,#7A8C6E 0%,#4A5C3E 50%,#2C3828 100%)" },
  { id:4, title:"Riad Cooking Class",      location:"Marrakech Medina",     price:"€75",  rating:"5.0", reviews:"89",  duration:"3 hours", maxGroup:4, tags:["Food","Luxury"],      gradient:"linear-gradient(145deg,#D4A853 0%,#C0654A 55%,#1A1410 100%)" },
  { id:5, title:"Blue Chefchaouen Walk",   location:"Chefchaouen",          price:"€55",  rating:"4.8", reviews:"201", duration:"Half day", maxGroup:8, tags:["Culture","Photo"],   gradient:"linear-gradient(145deg,#6B8CAE 0%,#3D5A73 50%,#1A2C38 100%)" },
  { id:6, title:"Essaouira Surf & Wind",   location:"Essaouira",            price:"€110", rating:"4.6", reviews:"134", duration:"Full day", maxGroup:6, tags:["Surf","Adventure"],  gradient:"linear-gradient(145deg,#8B9E8A 0%,#5C7A6E 50%,#2A3C35 100%)" },
];

const INITIAL_MSGS = [
  { role:"assistant", text:"Marhaba! I'm your personal Moroccan travel guide. Ask me anything — hidden medina gems to the best time to visit the Sahara.", suggestions:["Plan my 7-day trip","Best riads in Marrakech","When to visit?"] },
];
const AI_REPLIES = {
  "Plan my 7-day trip": "A perfect 7-day journey: 3 nights in Marrakech (medina, souks, Atlas day trip), 2 nights in Fès (the ancient medina is unlike anything else), finishing with 2 nights under the stars at Merzouga. Shall I build this into a full itinerary?",
  "Best riads in Marrakech": "Top picks: El Fenn (stunning rooftop pool, curated art collection), Riad Yasmine (iconic blue courtyard), Dar Anika (authentic 16th-century architecture). Budget: €120–€350/night. Shall I check availability for your dates?",
  "When to visit?": "Golden windows: March–May and September–November — warm days, cool evenings, minimal crowds. Avoid July–August (extreme heat in the south). December is magical for Sahara nights under clear skies.",
};

const ITINERARY = [
  { day:1, items:[
    { time:"Morning",   activity:"Arrive in Marrakech",  duration:"2h", note:"Check into your riad. Let the sounds of the medina wrap around you.", location:"Marrakech Medina" },
    { time:"Afternoon", activity:"Jemaa el-Fna Square",  duration:"3h", note:"Explore the vibrant square — street food, storytellers, musicians.", location:"Jemaa el-Fna" },
    { time:"Evening",   activity:"Sunset Rooftop Dinner", duration:"2h", note:"Dine above the medina with views of Koutoubia Mosque.", location:"Nomad Restaurant" },
  ]},
  { day:2, items:[
    { time:"Morning",   activity:"Majorelle Garden",   duration:"2h", note:"Walk through Yves Saint Laurent's iconic blue garden at golden hour.", location:"Guéliz District" },
    { time:"Afternoon", activity:"Traditional Hammam", duration:"2h", note:"A Moroccan steam bath ritual for full restoration.", location:"Hammam de la Rose" },
    { time:"Evening",   activity:"Atlas Foothills Drive", duration:"3h", note:"Scenic drive as the sun dips behind the peaks.", location:"Route de l'Ourika" },
  ]},
];

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

/* ── Experience Card ── */
function ExperienceCard({ exp, onTap, compact=false }) {
  const [liked, setLiked] = useState(false);

  if (compact) return (
    <div onClick={onTap} className="card-lift tap-ripple snap-s cursor-pointer flex-shrink-0" style={{width:200}}>
      <div className="img-zoom rounded-2xl overflow-hidden relative" style={{height:140}}>
        <div className="img-bg w-full h-full" style={{background:exp.gradient}}/>
        <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(26,20,16,.7) 0%,transparent 55%)"}}/>
        <button onClick={e=>{e.stopPropagation();setLiked(!liked)}} className="absolute top-2.5 right-2.5"
          style={{color:liked?"var(--terracotta)":"rgba(255,255,255,.85)"}}>
          <Ico.Heart f={liked}/>
        </button>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display text-white" style={{fontSize:15,fontWeight:500,lineHeight:1.2}}>{exp.title}</p>
          <p style={{color:"rgba(255,255,255,.65)",fontSize:11,marginTop:2}}>{exp.location}</p>
        </div>
      </div>
      <div className="pt-2.5 px-0.5 flex justify-between items-center">
        <span style={{fontSize:13,fontWeight:600,color:"var(--terracotta)"}}>{exp.price}</span>
        <div className="flex items-center gap-1" style={{color:"var(--gold)"}}>
          <Ico.Star f/><span style={{fontSize:12,color:"var(--smoke)"}}>{exp.rating}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onTap} className="card-lift tap-ripple cursor-pointer rounded-2xl overflow-hidden"
      style={{background:"var(--parchment)",boxShadow:"0 4px 24px rgba(26,20,16,.08)"}}>
      <div className="img-zoom relative overflow-hidden" style={{height:220}}>
        <div className="img-bg w-full h-full" style={{background:exp.gradient}}/>
        <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(26,20,16,.65) 0%,transparent 55%)"}}/>
        {/* Hover overlay — desktop */}
        <div className="exp-overlay absolute inset-0 flex items-center justify-center"
          style={{background:"rgba(26,20,16,.35)"}}>
          <span className="font-display text-white text-lg italic">View Experience →</span>
        </div>
        <button onClick={e=>{e.stopPropagation();setLiked(!liked)}} className="absolute top-3.5 right-3.5 flex"
          style={{color:liked?"var(--terracotta)":"rgba(255,255,255,.9)",
            background:"rgba(250,246,238,.18)",backdropFilter:"blur(8px)",
            borderRadius:"50%",padding:8}}>
          <Ico.Heart f={liked}/>
        </button>
        <div className="absolute bottom-3.5 left-4 right-4">
          <div className="flex gap-1.5 mb-1.5">
            {exp.tags.map(t=>(
              <span key={t} style={{fontSize:9,letterSpacing:".09em",textTransform:"uppercase",
                background:"rgba(212,168,83,.92)",color:"var(--ink)",padding:"3px 8px",borderRadius:100,fontWeight:600}}>
                {t}
              </span>
            ))}
          </div>
          <h3 className="font-display text-white" style={{fontSize:21,fontWeight:500,lineHeight:1.2}}>{exp.title}</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1" style={{color:"var(--smoke)"}}>
            <Ico.Pin/><span style={{fontSize:13}}>{exp.location}</span>
          </div>
          <div className="flex items-center gap-1" style={{color:"var(--gold)"}}>
            <Ico.Star f/>
            <span style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{exp.rating}</span>
            <span style={{fontSize:12,color:"var(--smoke)"}}>({exp.reviews})</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-3" style={{color:"var(--smoke)"}}>
            <div className="flex items-center gap-1"><Ico.Clock/><span style={{fontSize:12}}>{exp.duration}</span></div>
            <div className="flex items-center gap-1"><Ico.Users/><span style={{fontSize:12}}>Up to {exp.maxGroup}</span></div>
          </div>
          <div>
            <span style={{fontSize:11,color:"var(--smoke)"}}>from </span>
            <span style={{fontSize:18,fontWeight:700,color:"var(--terracotta)"}}>{exp.price}</span>
            <span style={{fontSize:11,color:"var(--smoke)"}}>/pp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chat Bubble ── */
function ChatBubble({msg, isTyping}) {
  if (isTyping) return (
    <div className="flex gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white"
        style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
        <Ico.Sparkle/>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
        style={{background:"var(--parchment)",boxShadow:"0 2px 12px rgba(26,20,16,.08)"}}>
        {[0,1,2].map(i=><div key={i} className="typing-dot w-2 h-2 rounded-full" style={{background:"var(--terracotta)"}}/>)}
      </div>
    </div>
  );
  if (msg.role==="assistant") return (
    <div className="bubble-in flex gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white"
        style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
        <Ico.Sparkle/>
      </div>
      <div style={{maxWidth:"80%"}}>
        <div className="px-4 py-3 rounded-2xl" style={{borderTopLeftRadius:4,background:"var(--parchment)",boxShadow:"0 2px 12px rgba(26,20,16,.08)"}}>
          <p style={{fontSize:14,lineHeight:1.65,color:"var(--ink)"}}>{msg.text}</p>
        </div>
        {msg.suggestions && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.suggestions.map(s=>(
              <button key={s} style={{fontSize:12,padding:"6px 13px",borderRadius:100,
                border:"1px solid var(--gold)",background:"rgba(212,168,83,.08)",
                color:"var(--terracotta)",fontWeight:500,cursor:"pointer"}}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="bubble-in flex justify-end mb-4">
      <div className="px-4 py-3" style={{maxWidth:"78%",
        background:"linear-gradient(135deg,var(--terracotta),var(--deep))",
        borderRadius:"18px 4px 18px 18px"}}>
        <p style={{fontSize:14,lineHeight:1.65,color:"#fff"}}>{msg.text}</p>
      </div>
    </div>
  );
}

/* ── Itinerary Day ── */
function ItineraryDay({day, items}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
          <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>D{day}</span>
        </div>
        <h3 className="font-display" style={{fontSize:20,fontWeight:500,color:"var(--ink)"}}>Day {day}</h3>
      </div>
      <div className="relative" style={{paddingLeft:18}}>
        <div className="tl-line draw-line absolute" style={{left:0,top:0,bottom:0}}/>
        {items.map((item,i)=>(
          <div key={i} className="relative mb-3.5" style={{paddingLeft:20}}>
            <div className="absolute" style={{left:-23,top:12,width:10,height:10,borderRadius:"50%",
              background:i===0?"var(--terracotta)":"var(--gold)",
              border:"2px solid var(--parchment)",
              boxShadow:`0 0 0 2px ${i===0?"var(--terracotta)":"var(--gold)"}`}}/>
            <div className="rounded-2xl p-4" style={{background:"var(--parchment)",boxShadow:"0 2px 12px rgba(26,20,16,.06)"}}>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span style={{fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:2}}>{item.time}</span>
                  <h4 style={{fontSize:15,fontWeight:600,color:"var(--ink)"}}>{item.activity}</h4>
                </div>
                <span style={{fontSize:10,background:"var(--light-clay)",padding:"4px 9px",borderRadius:100,color:"var(--smoke)",fontWeight:500,whiteSpace:"nowrap",marginLeft:8}}>{item.duration}</span>
              </div>
              <p style={{fontSize:13,color:"var(--smoke)",lineHeight:1.55}}>{item.note}</p>
              <div className="flex items-center gap-1 mt-2" style={{color:"var(--smoke)"}}>
                <Ico.Pin/><span style={{fontSize:12}}>{item.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOTTOM NAV (mobile only)
// ─────────────────────────────────────────────
function BottomNav({active, setPage}) {
  const tabs = [
    {id:"home",    label:"Home",    I:Ico.Home},
    {id:"explore", label:"Explore", I:Ico.Search},
    {id:"ai",      label:"AI Trip", I:Ico.AI},
    {id:"chat",    label:"Chat",    I:Ico.Chat},
    {id:"profile", label:"Profile", I:Ico.Profile},
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass z-50"
      style={{borderTop:"1px solid rgba(212,168,83,.2)",paddingBottom:"env(safe-area-inset-bottom,8px)"}}>
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(({id,label,I})=>{
          const on = active===id;
          return (
            <button key={id} onClick={()=>setPage(id)}
              className="flex flex-col items-center gap-1 px-3 py-1 tap-ripple rounded-xl" style={{minWidth:52}}>
              <div style={{color:on?"var(--terracotta)":"var(--smoke)",transition:"color .2s"}}><I/></div>
              <span style={{fontSize:9,fontWeight:on?600:400,letterSpacing:".03em",color:on?"var(--terracotta)":"var(--smoke)",transition:"color .2s"}}>{label}</span>
              <div className={`nav-dot ${on?"active":""}`}/>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// DESKTOP SIDEBAR
// ─────────────────────────────────────────────
function DesktopSidebar({active, setPage}) {
  const tabs = [
    {id:"home",      label:"Home",        I:Ico.Home},
    {id:"explore",   label:"Explore",     I:Ico.Search},
    {id:"ai",        label:"AI Planner",  I:Ico.AI},
    {id:"itinerary", label:"Itineraries", I:Ico.Globe},
    {id:"chat",      label:"AI Chat",     I:Ico.Chat},
    {id:"profile",   label:"Profile",     I:Ico.Profile},
  ];
  return (
    <aside className="desktop-sidebar hidden lg:flex flex-col" style={{background:"var(--parchment)"}}>
      {/* Brand */}
      <div className="px-6 py-8 border-b" style={{borderColor:"var(--light-clay)"}}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="7,1 13,4 13,10 7,13 1,10 1,4" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span className="font-display" style={{fontSize:16,fontWeight:500,color:"var(--ink)"}}>Morocco With You</span>
        </div>
        <p style={{fontSize:11,color:"var(--smoke)",letterSpacing:".04em"}}>Luxury travel, curated for you</p>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {tabs.map(({id,label,I})=>(
          <button key={id} onClick={()=>setPage(id)}
            className={`desk-nav-link ${active===id?"active":""}`}>
            <I/>{label}
            {active===id && <div className="ml-auto w-1 h-4 rounded-full" style={{background:"var(--terracotta)"}}/>}
          </button>
        ))}
      </nav>
      {/* Bottom */}
      <div className="px-4 py-5 border-t" style={{borderColor:"var(--light-clay)"}}>
        <div className="rounded-2xl p-4" style={{background:"linear-gradient(135deg,var(--deep),#5C3A2E)"}}>
          <p style={{fontSize:11,color:"rgba(255,255,255,.55)",marginBottom:2}}>AI Trips</p>
          <p className="font-display" style={{fontSize:18,color:"#fff",fontWeight:500,lineHeight:1.2}}>Build your<br/><em>perfect journey</em></p>
          <button onClick={()=>setPage("ai")} className="mt-3 w-full py-2 rounded-xl text-sm font-semibold"
            style={{background:"var(--gold)",color:"var(--ink)",border:"none",cursor:"pointer"}}>
            Start Planning →
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// DESKTOP TOP NAV (tablet)
// ─────────────────────────────────────────────
function TabletNav({active, setPage}) {
  const tabs = ["home","explore","ai","chat","profile"];
  const labels = {home:"Home",explore:"Explore",ai:"AI Planner",chat:"Chat",profile:"Profile"};
  return (
    <header className="hidden md:flex lg:hidden items-center justify-between px-6 py-4 glass sticky top-0 z-40"
      style={{borderBottom:"1px solid rgba(212,168,83,.2)"}}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="7,1 13,4 13,10 7,13 1,10 1,4" stroke="white" strokeWidth="1.2" fill="none"/>
            <circle cx="7" cy="7" r="2" fill="white"/>
          </svg>
        </div>
        <span className="font-display" style={{fontSize:16,fontWeight:500}}>Morocco With You</span>
      </div>
      <div className="flex items-center gap-1">
        {tabs.map(id=>(
          <button key={id} onClick={()=>setPage(id)}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{color:active===id?"var(--terracotta)":"var(--smoke)",
              background:active===id?"rgba(192,101,74,.1)":"transparent",
              border:"none",cursor:"pointer"}}>
            {labels[id]}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// PAGE: HOME
// ─────────────────────────────────────────────
function HomePage({setPage}) {
  const [filter, setFilter] = useState("All");
  const filters = ["All","Desert","Culture","Food","Hiking","Luxury"];

  return (
    <div className="page-enter">
      {/* ── MOBILE HERO ── */}
      <section className="md:hidden relative" style={{height:"72vh",overflow:"hidden"}}>
        <div className="absolute inset-0" style={{background:"linear-gradient(160deg,#2C1F12 0%,#8B4513 35%,#C0654A 65%,#D4A853 100%)"}}>
          <svg className="absolute" style={{right:-40,top:-40,opacity:.07}} width="280" height="280" viewBox="0 0 280 280">
            <polygon points="140,8 272,72 272,208 140,272 8,208 8,72" fill="none" stroke="#FAF6EE" strokeWidth="1"/>
            <polygon points="140,36 244,96 244,184 140,244 36,184 36,96" fill="none" stroke="#D4A853" strokeWidth=".8"/>
            <circle cx="140" cy="140" r="40" fill="none" stroke="#D4A853" strokeWidth=".8"/>
          </svg>
        </div>
        <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(26,20,16,.95) 0%,transparent 52%)"}}/>
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 pt-14">
          <div>
            <p style={{fontSize:10,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(212,168,83,.8)"}}>Morocco With You</p>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{background:"rgba(250,246,238,.15)",backdropFilter:"blur(8px)",border:"none"}}>
            <Ico.Filter/>
          </button>
        </div>
        <div className="absolute stagger" style={{bottom:32,left:20,right:20}}>
          <p style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:"var(--gold)",marginBottom:6}}>Your personal guide</p>
          <h1 className="font-display" style={{fontSize:42,lineHeight:1.05,color:"#fff",fontWeight:400,marginBottom:6}}>Discover<br/><em>Morocco</em></h1>
          <p style={{fontSize:14,color:"rgba(255,255,255,.58)",lineHeight:1.55,marginBottom:18}}>Curated experiences, AI-powered journeys</p>
          <div className="search-glow flex items-center gap-2.5 px-4 rounded-2xl" style={{background:"rgba(250,246,238,.12)",backdropFilter:"blur(16px)",border:"1px solid rgba(212,168,83,.3)"}}>
            <Ico.Search/>
            <input placeholder="Where in Morocco?" className="flex-1 bg-transparent border-none outline-none text-white text-sm" style={{padding:"14px 0"}}/>
            <div style={{width:1,height:20,background:"rgba(255,255,255,.2)"}}/>
            <button onClick={()=>setPage("explore")} className="text-xs font-semibold whitespace-nowrap bg-transparent border-none cursor-pointer" style={{color:"var(--gold)",letterSpacing:".05em"}}>Search</button>
          </div>
        </div>
        <div className="scroll-bounce absolute" style={{bottom:-18,left:"50%",transform:"translateX(-50%)",width:36,height:36,borderRadius:"50%",background:"var(--parchment)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(26,20,16,.15)",color:"var(--terracotta)"}}>
          <Ico.Arrow d="down"/>
        </div>
      </section>

      {/* ── DESKTOP / TABLET HERO ── */}
      <section className="hidden md:block relative overflow-hidden" style={{minHeight:"88vh"}}>
        <div className="absolute inset-0 pattern-bg"/>
        {/* Large Moroccan SVG geometry */}
        <svg className="absolute" style={{right:-60,top:"50%",transform:"translateY(-50%)",opacity:.06}} width="520" height="520" viewBox="0 0 520 520">
          <polygon points="260,12 508,138 508,382 260,508 12,382 12,138" fill="none" stroke="#FAF6EE" strokeWidth="1.5"/>
          <polygon points="260,60 460,168 460,352 260,460 60,352 60,168" fill="none" stroke="#D4A853" strokeWidth="1"/>
          <polygon points="260,108 412,198 412,322 260,412 108,322 108,198" fill="none" stroke="#FAF6EE" strokeWidth=".7"/>
          <circle cx="260" cy="260" r="70" fill="none" stroke="#D4A853" strokeWidth=".8"/>
          <circle cx="260" cy="260" r="110" fill="none" stroke="#D4A853" strokeWidth=".5"/>
        </svg>
        <div className="absolute inset-0" style={{background:"linear-gradient(105deg, rgba(26,20,16,0) 40%, rgba(26,20,16,0.18) 100%)"}}/>

        <div className="relative z-10 flex flex-col justify-center h-full" style={{minHeight:"88vh",padding:"80px 64px"}}>
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12" style={{background:"var(--gold)"}}/>
            <span style={{fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--gold)"}}>Luxury Travel · Morocco</span>
          </div>

          {/* Hero headline */}
          <h1 className="font-display hero-text-xl" style={{color:"#fff",fontWeight:300,maxWidth:700,marginBottom:28}}>
            Discover<br/><em style={{color:"var(--gold)"}}>extraordinary</em><br/>Morocco
          </h1>
          <p style={{fontSize:18,color:"rgba(255,255,255,.6)",lineHeight:1.7,maxWidth:480,marginBottom:44}}>
            Handcrafted experiences, AI-powered itineraries, and local guides who know every hidden corner.
          </p>

          {/* Desktop search bar */}
          <div className="search-glow flex items-center gap-0 rounded-2xl overflow-hidden" style={{maxWidth:620,background:"rgba(250,246,238,.1)",backdropFilter:"blur(20px)",border:"1px solid rgba(212,168,83,.3)"}}>
            <div className="flex items-center gap-3 px-5 py-4 flex-1">
              <Ico.Search/>
              <input placeholder="Destination, experience or vibe..." className="flex-1 bg-transparent border-none outline-none text-white text-base" style={{color:"#fff"}}/>
            </div>
            <div style={{width:1,height:28,background:"rgba(255,255,255,.15)"}}/>
            <div className="flex items-center gap-3 px-5 py-4" style={{color:"rgba(255,255,255,.55)"}}>
              <Ico.Cal/>
              <span style={{fontSize:14}}>Any dates</span>
            </div>
            <div style={{width:1,height:28,background:"rgba(255,255,255,.15)"}}/>
            <div className="flex items-center gap-3 px-5 py-4" style={{color:"rgba(255,255,255,.55)"}}>
              <Ico.Users/>
              <span style={{fontSize:14}}>2 guests</span>
            </div>
            <button onClick={()=>setPage("explore")} className="px-7 h-full font-semibold rounded-none" style={{background:"var(--terracotta)",border:"none",color:"#fff",fontSize:15,cursor:"pointer",height:"100%",padding:"14px 28px"}}>
              Search
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 mt-10">
            {[["244+","Experiences"],["48","Local guides"],["4.9★","Avg rating"]].map(([val,label])=>(
              <div key={label} className="flex items-center gap-3">
                <div>
                  <p className="font-display" style={{fontSize:24,color:"var(--gold)",fontWeight:500}}>{val}</p>
                  <p style={{fontSize:12,color:"rgba(255,255,255,.5)",letterSpacing:".04em"}}>{label}</p>
                </div>
                <div style={{width:1,height:32,background:"rgba(255,255,255,.1)"}}/>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating experience card — desktop only */}
        <div className="hidden lg:block absolute" style={{right:64,top:"50%",transform:"translateY(-50%)",width:280}}>
          <div className="rounded-3xl overflow-hidden" style={{boxShadow:"0 24px 64px rgba(26,20,16,.4)"}}>
            <div style={{height:180,background:"linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",position:"relative"}}>
              <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(26,20,16,.7),transparent)"}}/>
              <div className="absolute bottom-3 left-4 right-4">
                <p style={{fontSize:10,color:"rgba(255,255,255,.6)",marginBottom:2}}>Featured tonight</p>
                <h4 className="font-display text-white" style={{fontSize:18,fontWeight:500}}>Sahara Under the Stars</h4>
              </div>
            </div>
            <div className="p-4" style={{background:"var(--parchment)"}}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1" style={{color:"var(--smoke)"}}>
                  <Ico.Pin/><span style={{fontSize:12}}>Merzouga</span>
                </div>
                <div className="flex items-center gap-1" style={{color:"var(--gold)"}}>
                  <Ico.Star f/><span style={{fontSize:12,fontWeight:600,color:"var(--ink)"}}>4.9</span>
                </div>
              </div>
              <button onClick={()=>setPage("explore")} className="w-full py-2.5 rounded-xl font-semibold text-sm"
                style={{background:"var(--terracotta)",color:"#fff",border:"none",cursor:"pointer"}}>
                Book Experience
              </button>
            </div>
          </div>
          {/* Second smaller card */}
          <div className="rounded-2xl p-4 mt-4" style={{background:"rgba(250,246,238,.12)",backdropFilter:"blur(16px)",border:"1px solid rgba(212,168,83,.2)"}}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"rgba(212,168,83,.25)",color:"var(--gold)"}}>
                <Ico.Sparkle/>
              </div>
              <div>
                <p style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>AI-powered</p>
                <p className="font-display" style={{fontSize:15,color:"#fff",fontWeight:500}}>Build my itinerary</p>
              </div>
              <button onClick={()=>setPage("ai")} className="ml-auto" style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer"}}>
                <Ico.Arrow/>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE (desktop) ── */}
      <div className="hidden md:block overflow-hidden py-4 border-y" style={{borderColor:"var(--light-clay)"}}>
        <div className="marquee-track">
          {[...Array(2)].map((_,j)=>(
            <div key={j} className="flex items-center gap-0 flex-shrink-0">
              {["Marrakech Medina","Sahara Desert","Atlas Mountains","Fès el-Bali","Chefchaouen","Essaouira","Ouarzazate","Dades Gorge"].map(city=>(
                <span key={city} className="flex items-center gap-4 px-8 py-1" style={{color:"var(--smoke)",fontSize:13,letterSpacing:".1em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                  <span style={{color:"var(--gold)",fontSize:8}}>✦</span> {city}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="px-5 md:px-8 lg:px-10 pt-8 md:pt-10">
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {filters.map((f,i)=>(
            <button key={f} onClick={()=>setFilter(f)} className={`chip snap-s ${filter===f?"chip-active":"chip-inactive"}`}>{f}</button>
          ))}
        </div>
      </section>

      {/* ── FEATURED EXPERIENCES ── */}
      <section className="px-5 md:px-8 lg:px-10 pt-7 pb-4">
        <div className="flex justify-between items-end mb-5">
          <h2 className="font-display" style={{fontSize:"clamp(24px,3.5vw,36px)",fontWeight:400,color:"var(--ink)"}}>
            Featured <em>Experiences</em>
          </h2>
          <button onClick={()=>setPage("explore")} className="flex items-center gap-1.5 text-sm font-semibold bg-transparent border-none cursor-pointer" style={{color:"var(--terracotta)"}}>
            View all <Ico.Arrow/>
          </button>
        </div>
        {/* Grid: 1 col mobile → 2 col tablet → 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {EXPERIENCES.slice(0,3).map(exp=>(
            <ExperienceCard key={exp.id} exp={exp} onTap={()=>{}}/>
          ))}
        </div>
      </section>

      {/* ── AI TRIP BUILDER BANNER ── */}
      <section className="px-5 md:px-8 lg:px-10 py-6">
        <div onClick={()=>setPage("ai")} className="tap-ripple cursor-pointer overflow-hidden relative"
          style={{borderRadius:24,padding:"28px 24px",background:"linear-gradient(135deg,var(--deep) 0%,var(--terracotta) 100%)"}}>
          <svg className="absolute" style={{right:-24,top:-24,opacity:.07}} width="200" height="200" viewBox="0 0 200 200">
            <polygon points="100,5 195,55 195,145 100,195 5,145 5,55" fill="none" stroke="#FAF6EE" strokeWidth="2"/>
          </svg>
          {/* Mobile layout */}
          <div className="md:hidden flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(212,168,83,.22)",color:"var(--gold)"}}>
              <Ico.Sparkle/>
            </div>
            <div className="flex-1">
              <p style={{fontSize:10,letterSpacing:".14em",textTransform:"uppercase",color:"var(--gold)",marginBottom:2}}>AI-Powered</p>
              <h3 className="font-display text-white" style={{fontSize:20,fontWeight:500}}>Build My Perfect Trip</h3>
              <p style={{fontSize:12,color:"rgba(255,255,255,.55)",marginTop:1}}>Personalized in 30 seconds</p>
            </div>
            <div style={{color:"rgba(255,255,255,.6)"}}><Ico.Arrow/></div>
          </div>
          {/* Tablet / Desktop layout */}
          <div className="hidden md:flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{background:"rgba(212,168,83,.22)"}}>
              <Ico.Sparkle/>
            </div>
            <div className="flex-1">
              <p style={{fontSize:10,letterSpacing:".16em",textTransform:"uppercase",color:"var(--gold)",marginBottom:3}}>AI-Powered Travel Planning</p>
              <h3 className="font-display text-white" style={{fontSize:"clamp(20px,2.8vw,30px)",fontWeight:400}}>Let AI design your <em>perfect Moroccan journey</em></h3>
              <p style={{fontSize:14,color:"rgba(255,255,255,.55)",marginTop:4}}>Answer 4 quick questions. Get a full day-by-day itinerary.</p>
            </div>
            <button onClick={e=>{e.stopPropagation();}} className="flex-shrink-0 px-6 py-3 rounded-2xl font-semibold text-sm" style={{background:"var(--gold)",color:"var(--ink)",border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(212,168,83,.4)"}}>
              Start Planning →
            </button>
          </div>
        </div>
      </section>

      {/* ── MORE EXPERIENCES (desktop 3-col) ── */}
      <section className="px-5 md:px-8 lg:px-10 pb-10">
        <div className="flex justify-between items-end mb-5">
          <h2 className="font-display" style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:400,color:"var(--ink)"}}>
            More to <em>Explore</em>
          </h2>
        </div>
        {/* Mobile: horizontal scroll. Tablet+: grid */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-2 snap-x">
          {EXPERIENCES.map(exp=>(
            <ExperienceCard key={exp.id} exp={exp} onTap={()=>{}} compact/>
          ))}
        </div>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {EXPERIENCES.slice(3).map(exp=>(
            <ExperienceCard key={exp.id} exp={exp} onTap={()=>{}}/>
          ))}
        </div>
      </section>

      {/* ── WHY US — desktop only ── */}
      <section className="hidden md:block px-8 lg:px-10 pb-12">
        <div className="rounded-3xl overflow-hidden" style={{background:"var(--parchment)",border:"1px solid var(--light-clay)"}}>
          <div className="grid grid-cols-3 divide-x" style={{borderColor:"var(--light-clay)"}}>
            {[
              {title:"Local Expertise", desc:"Every guide is a native with deep roots in their region — no agency middlemen."},
              {title:"AI Itineraries",  desc:"Our AI understands Moroccan rhythm, seasons and hidden gems — not just top-10 lists."},
              {title:"Instant Booking", desc:"Real-time availability, instant confirmation, free cancellation up to 48h before."},
            ].map((f,i)=>(
              <div key={f.title} className="p-8 lg:p-10" style={{borderColor:"var(--light-clay)"}}>
                <div className="w-10 h-10 rounded-2xl mb-5 flex items-center justify-center" style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
                  <span style={{color:"#fff",fontSize:16}}>{"★✦◈"[i]}</span>
                </div>
                <h3 className="font-display mb-2" style={{fontSize:20,fontWeight:500,color:"var(--ink)"}}>{f.title}</h3>
                <p style={{fontSize:14,color:"var(--smoke)",lineHeight:1.65}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile spacer */}
      <div className="md:hidden" style={{height:80}}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: EXPLORE
// ─────────────────────────────────────────────
function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [view, setView] = useState("grid"); // grid | list
  const filters = ["All","Desert","Culture","Food","Hiking","Events","Group","Surf"];

  return (
    <div className="page-enter">
      {/* Mobile header */}
      <div className="md:hidden px-5 pt-14 pb-5" style={{borderBottom:"1px solid var(--light-clay)"}}>
        <h1 className="font-display" style={{fontSize:30,fontWeight:400,color:"var(--ink)",marginBottom:2}}>
          <em>Explore</em> Morocco
        </h1>
        <p style={{fontSize:14,color:"var(--smoke)",marginBottom:16}}>244 curated experiences</p>
        <div className="search-glow flex items-center gap-2.5 px-3.5 rounded-2xl mb-4" style={{border:"1.5px solid var(--clay)",background:"#fff"}}>
          <span style={{color:"var(--smoke)"}}><Ico.Search/></span>
          <input placeholder="Search experiences, cities..." className="flex-1 border-none outline-none text-sm bg-transparent py-3.5" style={{color:"var(--ink)"}}/>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"var(--light-clay)",border:"none",cursor:"pointer",color:"var(--smoke)"}}>
            <Ico.Filter/>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {filters.map(f=>(
            <button key={f} onClick={()=>setActiveFilter(f)} className={`chip snap-s ${activeFilter===f?"chip-active":"chip-inactive"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block px-8 lg:px-10 pt-10 pb-6" style={{borderBottom:"1px solid var(--light-clay)"}}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <p style={{fontSize:11,letterSpacing:".16em",textTransform:"uppercase",color:"var(--smoke)",marginBottom:4}}>244 experiences available</p>
            <h1 className="font-display" style={{fontSize:"clamp(32px,4.5vw,52px)",fontWeight:400,color:"var(--ink)"}}>
              Explore <em>Morocco</em>
            </h1>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl" style={{background:"var(--light-clay)"}}>
            {["grid","list"].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{background:view===v?"#fff":"transparent",color:view===v?"var(--ink)":"var(--smoke)",border:"none",cursor:"pointer",boxShadow:view===v?"0 1px 4px rgba(26,20,16,.1)":"none"}}>
                {v==="grid"?"⊞ Grid":"≡ List"}
              </button>
            ))}
          </div>
        </div>
        {/* Desktop search + filters row */}
        <div className="flex gap-4 items-center">
          <div className="search-glow flex-1 flex items-center gap-3 px-4 rounded-2xl" style={{border:"1.5px solid var(--clay)",background:"#fff"}}>
            <Ico.Search/>
            <input placeholder="Search by destination, activity, or vibe..." className="flex-1 border-none outline-none text-sm bg-transparent py-3.5" style={{color:"var(--ink)"}}/>
          </div>
          <button className="flex items-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm" style={{background:"var(--light-clay)",border:"none",cursor:"pointer",color:"var(--ink)"}}>
            <Ico.Filter/> Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm" style={{background:"var(--light-clay)",border:"none",cursor:"pointer",color:"var(--ink)"}}>
            Sort: Recommended
          </button>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {filters.map(f=>(
            <button key={f} onClick={()=>setActiveFilter(f)} className={`chip ${activeFilter===f?"chip-active":"chip-inactive"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 md:px-8 lg:px-10 py-5">
        {/* Mobile: single col */}
        <div className="md:hidden stagger flex flex-col gap-4">
          {EXPERIENCES.map(exp=><ExperienceCard key={exp.id} exp={exp} onTap={()=>{}}/>)}
        </div>
        {/* Tablet+: responsive grid */}
        <div className={`hidden md:grid gap-5 stagger ${view==="list"?"grid-cols-1":"md:grid-cols-2 lg:grid-cols-3"}`}>
          {EXPERIENCES.map(exp=>(
            <div key={exp.id} className={view==="list"?"flex gap-4 items-stretch":""}>
              {view==="list" ? (
                <div className="card-lift tap-ripple cursor-pointer rounded-2xl overflow-hidden flex w-full" style={{background:"var(--parchment)",boxShadow:"0 4px 24px rgba(26,20,16,.07)"}}>
                  <div className="img-zoom flex-shrink-0" style={{width:180}}>
                    <div className="img-bg h-full" style={{background:exp.gradient}}/>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        {exp.tags.map(t=><span key={t} style={{fontSize:9,letterSpacing:".08em",textTransform:"uppercase",background:"var(--light-clay)",color:"var(--smoke)",padding:"3px 8px",borderRadius:100,fontWeight:600}}>{t}</span>)}
                      </div>
                      <h3 className="font-display" style={{fontSize:20,fontWeight:500,color:"var(--ink)",marginBottom:4}}>{exp.title}</h3>
                      <div className="flex items-center gap-1" style={{color:"var(--smoke)"}}><Ico.Pin/><span style={{fontSize:13}}>{exp.location}</span></div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-4" style={{color:"var(--smoke)"}}>
                        <div className="flex items-center gap-1"><Ico.Clock/><span style={{fontSize:12}}>{exp.duration}</span></div>
                        <div className="flex items-center gap-1"><Ico.Users/><span style={{fontSize:12}}>Max {exp.maxGroup}</span></div>
                      </div>
                      <div className="text-right">
                        <span style={{fontSize:11,color:"var(--smoke)"}}>from </span>
                        <span style={{fontSize:20,fontWeight:700,color:"var(--terracotta)"}}>{exp.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ExperienceCard exp={exp} onTap={()=>{}}/>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="md:hidden" style={{height:80}}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: AI PLANNER
// ─────────────────────────────────────────────
function AIPage({setPage}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({duration:"", group:"", budget:"", interests:[]});
  const interests = ["Desert","Culture","Food","Hiking","Surf","Wellness","Photography","History","Riads","Nightlife"];
  const totalSteps = 4;
  const stepLabels = ["Duration","Travellers","Budget","Interests"];
  const next = () => step < totalSteps-1 ? setStep(step+1) : setPage("itinerary");

  return (
    <div className="page-enter">
      {/* ── Mobile Header ── */}
      <div className="md:hidden pattern-bg relative overflow-hidden" style={{padding:"52px 20px 28px"}}>
        <svg className="absolute" style={{right:-20,top:-20,opacity:.06}} width="180" height="180" viewBox="0 0 180 180">
          <polygon points="90,5 175,50 175,130 90,175 5,130 5,50" fill="none" stroke="#FAF6EE" strokeWidth="1.5"/>
        </svg>
        <div className="flex items-center gap-3 mb-5 relative">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{background:"rgba(212,168,83,.2)"}}>
            <Ico.Sparkle/>
          </div>
          <div>
            <p style={{fontSize:10,letterSpacing:".15em",textTransform:"uppercase",color:"var(--gold)"}}>AI Planner</p>
            <h1 className="font-display text-white" style={{fontSize:24,fontWeight:400}}>Build Your <em>Journey</em></h1>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({length:totalSteps}).map((_,i)=>(
            <div key={i} className="step-track flex-1"><div className="step-fill" style={{width:i<=step?"100%":"0%"}}/></div>
          ))}
        </div>
        <p style={{fontSize:11,color:"rgba(255,255,255,.45)",marginTop:6}}>Step {step+1} of {totalSteps} · {stepLabels[step]}</p>
      </div>

      {/* ── Desktop / Tablet layout ── */}
      <div className="hidden md:grid lg:grid-cols-5 min-h-screen">
        {/* Left panel */}
        <div className="lg:col-span-2 pattern-bg relative overflow-hidden flex flex-col justify-between p-10 lg:p-14" style={{minHeight:"100vh"}}>
          <svg className="absolute" style={{right:-40,bottom:-40,opacity:.06}} width="260" height="260" viewBox="0 0 260 260">
            <polygon points="130,8 252,72 252,188 130,252 8,188 8,72" fill="none" stroke="#FAF6EE" strokeWidth="1.5"/>
            <circle cx="130" cy="130" r="55" fill="none" stroke="#D4A853" strokeWidth=".8"/>
          </svg>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Ico.Sparkle/>
              <span style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:"var(--gold)"}}>AI Planner</span>
            </div>
            <h2 className="font-display text-white mt-4" style={{fontSize:"clamp(32px,3.5vw,48px)",fontWeight:300,lineHeight:1.1}}>
              Build your<br/><em>perfect</em><br/>Moroccan<br/>journey.
            </h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,.5)",lineHeight:1.7,marginTop:16,maxWidth:320}}>
              Answer 4 simple questions and our AI will craft a full day-by-day itinerary tailored to your style.
            </p>
          </div>
          {/* Step progress — desktop */}
          <div className="relative space-y-4">
            {stepLabels.map((label,i)=>(
              <div key={label} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{background:i<step?"var(--gold)":i===step?"var(--terracotta)":"rgba(255,255,255,.1)",
                    color:i<=step?"var(--ink)":"rgba(255,255,255,.4)"}}>
                  {i<step?<Ico.Check/>:i+1}
                </div>
                <span style={{fontSize:13,fontWeight:i===step?600:400,color:i<=step?"rgba(255,255,255,.9)":"rgba(255,255,255,.35)"}}>{label}</span>
                {i<totalSteps-1 && <div style={{marginLeft:3.5,position:"absolute",left:14.5,top:`${i*52+48}px`,width:2,height:24,background:i<step?"var(--gold)":"rgba(255,255,255,.1)"}}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3 flex flex-col justify-center px-10 lg:px-16 py-12">
          <div className="max-w-lg w-full mx-auto">
            <FormStep step={step} form={form} setForm={setForm} interests={interests}/>
            <button onClick={next} className="mt-8 w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
              style={{background:"linear-gradient(135deg,var(--terracotta),var(--deep))",border:"none",color:"#fff",cursor:"pointer",
                boxShadow:"0 8px 28px rgba(192,101,74,.32)"}}>
              {step<totalSteps-1?"Continue":"✨ Generate My Itinerary"} <Ico.Arrow/>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile form */}
      <div className="md:hidden px-5 pt-7">
        <FormStep step={step} form={form} setForm={setForm} interests={interests}/>
        <div className="mt-6 mb-4">
          <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
            style={{background:"linear-gradient(135deg,var(--terracotta),var(--deep))",border:"none",color:"#fff",cursor:"pointer",
              boxShadow:"0 8px 28px rgba(192,101,74,.28)"}}>
            {step<totalSteps-1?"Continue":"✨ Generate My Itinerary"} <Ico.Arrow/>
          </button>
        </div>
      </div>

      <div className="md:hidden" style={{height:30}}/>
    </div>
  );
}

function FormStep({step, form, setForm, interests}) {
  const durationOpts = ["Weekend (2–3 days)","Short trip (4–5 days)","1 week","2 weeks","Custom"];
  const groupOpts    = ["Solo","Couple","Family","Friends","Group (8+)","Corporate"];
  const budgetOpts   = ["Budget (< €500)","Mid-range (€500–1200)","Premium (€1200–2500)","Luxury (€2500+)"];

  if (step===0) return (
    <div className="page-enter">
      <h2 className="font-display mb-1" style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:400,color:"var(--ink)"}}>
        How long is your <em>trip?</em>
      </h2>
      <p className="mb-6" style={{fontSize:14,color:"var(--smoke)"}}>Choose your travel duration</p>
      <div className="flex flex-col gap-2.5">
        {durationOpts.map(d=>(
          <button key={d} onClick={()=>setForm({...form,duration:d})}
            className="tap-ripple py-4 px-5 rounded-2xl text-left flex justify-between items-center"
            style={{border:`1.5px solid ${form.duration===d?"var(--terracotta)":"var(--clay)"}`,
              background:form.duration===d?"rgba(192,101,74,.06)":"var(--parchment)",cursor:"pointer",transition:"all .2s"}}>
            <span style={{fontSize:15,color:"var(--ink)",fontWeight:form.duration===d?600:400}}>{d}</span>
            {form.duration===d && <div style={{color:"var(--terracotta)"}}><Ico.Check/></div>}
          </button>
        ))}
      </div>
    </div>
  );
  if (step===1) return (
    <div className="page-enter">
      <h2 className="font-display mb-1" style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:400,color:"var(--ink)"}}>
        Who's travelling <em>with you?</em>
      </h2>
      <p className="mb-6" style={{fontSize:14,color:"var(--smoke)"}}>Select your group type</p>
      <div className="grid grid-cols-2 gap-2.5">
        {groupOpts.map(g=>(
          <button key={g} onClick={()=>setForm({...form,group:g})}
            className="tap-ripple py-5 px-4 rounded-2xl text-center"
            style={{border:`1.5px solid ${form.group===g?"var(--terracotta)":"var(--clay)"}`,
              background:form.group===g?"rgba(192,101,74,.06)":"var(--parchment)",cursor:"pointer",transition:"all .2s"}}>
            <span style={{fontSize:14,fontWeight:form.group===g?600:400,color:form.group===g?"var(--terracotta)":"var(--ink)"}}>{g}</span>
          </button>
        ))}
      </div>
    </div>
  );
  if (step===2) return (
    <div className="page-enter">
      <h2 className="font-display mb-1" style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:400,color:"var(--ink)"}}>
        What's your <em>budget?</em>
      </h2>
      <p className="mb-6" style={{fontSize:14,color:"var(--smoke)"}}>Per person, excluding flights</p>
      <div className="flex flex-col gap-2.5">
        {budgetOpts.map(b=>(
          <button key={b} onClick={()=>setForm({...form,budget:b})}
            className="tap-ripple py-4 px-5 rounded-2xl text-left flex justify-between items-center"
            style={{border:`1.5px solid ${form.budget===b?"var(--terracotta)":"var(--clay)"}`,
              background:form.budget===b?"rgba(192,101,74,.06)":"var(--parchment)",cursor:"pointer",transition:"all .2s"}}>
            <span style={{fontSize:15,color:"var(--ink)",fontWeight:form.budget===b?600:400}}>{b}</span>
            {form.budget===b && <div style={{color:"var(--terracotta)"}}><Ico.Check/></div>}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="page-enter">
      <h2 className="font-display mb-1" style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:400,color:"var(--ink)"}}>
        What excites <em>you most?</em>
      </h2>
      <p className="mb-6" style={{fontSize:14,color:"var(--smoke)"}}>Select all that apply</p>
      <div className="flex flex-wrap gap-2.5">
        {interests.map(interest=>{
          const selected = form.interests.includes(interest);
          return (
            <button key={interest} onClick={()=>setForm({...form,interests:selected?form.interests.filter(x=>x!==interest):[...form.interests,interest]})}
              className={`chip text-sm ${selected?"chip-active":"chip-inactive"}`} style={{padding:"10px 20px"}}>
              {interest}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: ITINERARY
// ─────────────────────────────────────────────
function ItineraryPage({setPage}) {
  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{height:"clamp(180px,28vw,260px)",background:"linear-gradient(135deg,#2C1F12 0%,#C0654A 60%,#D4A853 100%)"}}>
        <svg className="absolute" style={{right:-20,bottom:-20,opacity:.07}} width="180" height="180" viewBox="0 0 180 180">
          <polygon points="90,5 175,50 175,130 90,175 5,130 5,50" fill="none" stroke="#FAF6EE" strokeWidth="1.5"/>
        </svg>
        <div className="absolute inset-0" style={{background:"linear-gradient(to top,rgba(26,20,16,.7),transparent)"}}/>
        <div className="absolute bottom-5 px-5 md:px-10 w-full">
          <span style={{fontSize:10,letterSpacing:".15em",textTransform:"uppercase",color:"var(--gold)"}}>✨ AI Generated</span>
          <h1 className="font-display text-white mt-1" style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:400}}>Your Moroccan <em>Journey</em></h1>
          <div className="flex gap-5 mt-2" style={{color:"rgba(255,255,255,.65)"}}>
            {[<><Ico.Cal/><span className="text-xs ml-1">7 Days</span></>,<><Ico.Pin/><span className="text-xs ml-1">3 Cities</span></>,<><Ico.Users/><span className="text-xs ml-1">2 People</span></>].map((el,i)=>(
              <div key={i} className="flex items-center gap-1">{el}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 gap-0">
        {/* Main timeline */}
        <div className="lg:col-span-2 px-5 md:px-8 lg:px-10 pt-6">
          {/* Action bar */}
          <div className="flex gap-2.5 mb-6 pb-5" style={{borderBottom:"1px solid var(--light-clay)"}}>
            {["Save Trip","Share","Edit"].map((a,i)=>(
              <button key={a} className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{background:i===0?"var(--terracotta)":"var(--light-clay)",color:i===0?"#fff":"var(--ink)",border:"none",cursor:"pointer"}}>
                {a}
              </button>
            ))}
          </div>
          {ITINERARY.map(d=><ItineraryDay key={d.day} day={d.day} items={d.items}/>)}
        </div>

        {/* Desktop sidebar: booking card */}
        <div className="hidden lg:block lg:col-span-1 px-6 pt-6 pb-10">
          <div className="sticky top-6">
            <div className="rounded-3xl overflow-hidden" style={{boxShadow:"0 8px 40px rgba(26,20,16,.12)",border:"1px solid var(--light-clay)"}}>
              <div className="p-6" style={{background:"linear-gradient(135deg,var(--deep),var(--terracotta)"}}>
                <p style={{fontSize:11,color:"rgba(255,255,255,.55)",marginBottom:2}}>Total estimated</p>
                <p className="font-display text-white" style={{fontSize:36,fontWeight:500}}>€1,240</p>
                <p style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>per person · 7 days</p>
              </div>
              <div className="p-6" style={{background:"var(--parchment)"}}>
                <div className="flex flex-col gap-3 mb-5">
                  {[["8","Experiences included"],["3","Cities"],["2","Nights camping"]].map(([val,label])=>(
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm" style={{background:"var(--light-clay)",color:"var(--terracotta)"}}>{val}</div>
                      <span style={{fontSize:13,color:"var(--smoke)"}}>{label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setPage("booking")} className="w-full py-4 rounded-2xl font-semibold text-base"
                  style={{background:"var(--terracotta)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 6px 20px rgba(192,101,74,.35)"}}>
                  Book This Journey
                </button>
                <p className="text-center mt-3" style={{fontSize:11,color:"var(--smoke)"}}>Free cancellation · 48h before</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile booking CTA */}
      <div className="md:hidden px-5 pb-5">
        <div className="rounded-3xl p-5 flex items-center justify-between" style={{background:"linear-gradient(135deg,var(--deep),var(--terracotta)"}}>
          <div>
            <p style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>Total estimated</p>
            <p className="font-display text-white" style={{fontSize:26,fontWeight:500}}>€1,240</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>per person · 7 days</p>
          </div>
          <button onClick={()=>setPage("booking")} className="px-5 py-3 rounded-2xl font-bold text-sm"
            style={{background:"var(--gold)",color:"var(--ink)",border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(212,168,83,.4)"}}>
            Book Now
          </button>
        </div>
      </div>
      <div style={{height:80}} className="lg:hidden"/>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: BOOKING
// ─────────────────────────────────────────────
function BookingPage({setPage}) {
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState(2);
  const steps = ["Details","Guests","Review","Payment"];
  return (
    <div className="page-enter">
      {/* Mobile header */}
      <div className="md:hidden px-5 pt-14 pb-5" style={{borderBottom:"1px solid var(--light-clay)"}}>
        <p style={{fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"var(--smoke)",marginBottom:4}}>Booking</p>
        <h1 className="font-display" style={{fontSize:26,fontWeight:400,color:"var(--ink)",marginBottom:14}}>Confirm Your <em>Experience</em></h1>
        <div className="flex items-center gap-0">
          {steps.map((s,i)=>(
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{background:i<=step?"var(--terracotta)":"var(--light-clay)",color:i<=step?"#fff":"var(--smoke)",transition:"all .3s"}}>
                  {i<step?<Ico.Check/>:i+1}
                </div>
                <span style={{fontSize:9,marginTop:3,color:i<=step?"var(--terracotta)":"var(--smoke)",fontWeight:i===step?600:400,letterSpacing:".04em"}}>{s}</span>
              </div>
              {i<steps.length-1 && <div style={{flex:1,height:1.5,background:i<step?"var(--terracotta)":"var(--light-clay)",margin:"0 4px",marginBottom:14,transition:"background .3s"}}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 min-h-screen">
        {/* Form area */}
        <div className="lg:col-span-2 px-5 md:px-8 lg:px-10 py-6 lg:py-10">
          {/* Desktop step */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            {steps.map((s,i)=>(
              <div key={s} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{background:i<=step?"var(--terracotta)":"var(--light-clay)",color:i<=step?"#fff":"var(--smoke)"}}>
                  {i<step?<Ico.Check/>:i+1}
                </div>
                <span style={{fontSize:13,fontWeight:i===step?600:400,color:i<=step?"var(--terracotta)":"var(--smoke)"}}>{s}</span>
                {i<steps.length-1 && <div style={{width:32,height:1.5,background:i<step?"var(--terracotta)":"var(--light-clay)",marginLeft:4}}/>}
              </div>
            ))}
          </div>

          {/* Experience card */}
          <div className="rounded-2xl overflow-hidden mb-6 flex gap-4 items-center p-4" style={{background:"linear-gradient(135deg,#C0654A 0%,#2C1F12 100%)"}}>
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl" style={{background:"rgba(255,255,255,.1)"}}/>
            <div className="flex-1">
              <p style={{fontSize:9,color:"rgba(255,255,255,.5)",letterSpacing:".1em",textTransform:"uppercase"}}>Experience</p>
              <h3 className="font-display text-white" style={{fontSize:17,fontWeight:500,marginTop:1}}>Sahara Desert Overnight</h3>
              <div className="flex gap-4 mt-1.5" style={{color:"rgba(255,255,255,.6)"}}>
                <div className="flex items-center gap-1"><Ico.Clock/><span style={{fontSize:11}}>2 Days</span></div>
                <div className="flex items-center gap-1"><Ico.Pin/><span style={{fontSize:11}}>Merzouga</span></div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p style={{fontSize:20,fontWeight:700,color:"var(--gold)"}}>€149</p>
              <p style={{fontSize:10,color:"rgba(255,255,255,.45)"}}>/person</p>
            </div>
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{letterSpacing:".06em",textTransform:"uppercase",color:"var(--smoke)"}}>Travel Date</label>
            <input type="date" className="w-full px-4 py-4 rounded-2xl text-base" style={{border:"1.5px solid var(--clay)",color:"var(--ink)",outline:"none",background:"var(--parchment)",fontFamily:"'DM Sans',sans-serif"}}/>
          </div>
          {/* Guests */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{letterSpacing:".06em",textTransform:"uppercase",color:"var(--smoke)"}}>Guests</label>
            <div className="flex items-center gap-4 px-4 py-3 rounded-2xl" style={{border:"1.5px solid var(--clay)",background:"var(--parchment)"}}>
              <button onClick={()=>setGuests(Math.max(1,guests-1))} className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-light" style={{background:"var(--light-clay)",border:"none",cursor:"pointer",color:"var(--ink)"}}>−</button>
              <span className="flex-1 text-center font-semibold" style={{fontSize:16}}>{guests} Guest{guests>1?"s":""}</span>
              <button onClick={()=>setGuests(Math.min(8,guests+1))} className="w-9 h-9 rounded-full flex items-center justify-center text-xl" style={{background:"var(--terracotta)",border:"none",cursor:"pointer",color:"#fff"}}>+</button>
            </div>
          </div>
          {/* Requests */}
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{letterSpacing:".06em",textTransform:"uppercase",color:"var(--smoke)"}}>Special Requests</label>
            <textarea rows={3} placeholder="Dietary needs, accessibility, celebrations..." className="w-full px-4 py-4 rounded-2xl text-sm" style={{border:"1.5px solid var(--clay)",color:"var(--ink)",outline:"none",resize:"none",background:"var(--parchment)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.55}}/>
          </div>

          <button onClick={()=>step<3?setStep(step+1):setPage("home")}
            className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
            style={{background:"linear-gradient(135deg,var(--terracotta),var(--deep))",border:"none",color:"#fff",cursor:"pointer",boxShadow:"0 8px 28px rgba(192,101,74,.3)"}}>
            {step<3?"Continue":"✓ Confirm Booking"}{step<3&&<Ico.Arrow/>}
          </button>
          <p className="text-center mt-3" style={{fontSize:11,color:"var(--smoke)"}}>Free cancellation up to 48h before your experience</p>
        </div>

        {/* Right: price summary — desktop */}
        <div className="hidden lg:block px-6 py-10" style={{borderLeft:"1px solid var(--light-clay)"}}>
          <div className="sticky top-10">
            <h3 className="font-display mb-4" style={{fontSize:20,fontWeight:500,color:"var(--ink)"}}>Price Summary</h3>
            <div className="rounded-2xl p-5 mb-4" style={{background:"var(--parchment)",border:"1px solid var(--light-clay)"}}>
              {[["€149 × "+guests+" guests","€"+(149*guests)],["Guide fee","€40"],["Platform fee (5%)","€"+(((149*guests+40)*0.05).toFixed(2))]].map(([label,val])=>(
                <div key={label} className="flex justify-between mb-3">
                  <span style={{fontSize:14,color:"var(--smoke)"}}>{label}</span>
                  <span style={{fontSize:14,color:"var(--ink)",fontWeight:500}}>{val}</span>
                </div>
              ))}
              <div style={{height:1,background:"var(--clay)",margin:"12px 0"}}/>
              <div className="flex justify-between">
                <span style={{fontSize:15,fontWeight:700}}>Total</span>
                <span style={{fontSize:22,fontWeight:700,color:"var(--terracotta)"}}>€{(149*guests+40+(149*guests+40)*0.05).toFixed(0)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {["✓ Free cancellation up to 48h","✓ Instant confirmation","✓ Guide speaks English & French"].map(f=>(
                <p key={f} style={{fontSize:12,color:"var(--smoke)"}}>{f}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{height:80}} className="lg:hidden"/>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: CHAT
// ─────────────────────────────────────────────
function ChatPage() {
  const [messages, setMessages] = useState(INITIAL_MSGS);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  const send = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(m=>[...m,{role:"user",text:msg}]);
    setInput("");
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMessages(m=>[...m,{role:"assistant",text:AI_REPLIES[msg]||"Great question! Morocco has so much to offer. Could you tell me more about your interests — history and culture, natural landscapes, or culinary experiences?",suggestions:["Tell me more","Show experiences","Build my trip"]}]);
    },1800);
  };

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[messages,typing]);

  return (
    <div className="page-enter flex flex-col" style={{height:"100dvh"}}>
      {/* Header */}
      <div className="glass flex-shrink-0 px-4 md:px-8 pt-14 md:pt-5 pb-4" style={{borderBottom:"1px solid rgba(212,168,83,.18)"}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))"}}>
            <Ico.Sparkle/>
          </div>
          <div>
            <h2 style={{fontSize:15,fontWeight:700,color:"var(--ink)"}}>Morocco AI Guide</h2>
            <div className="flex items-center gap-1.5">
              <div style={{width:6,height:6,borderRadius:"50%",background:"#4CAF50"}}/>
              <span style={{fontSize:11,color:"var(--smoke)"}}>Always available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-5 md:max-w-3xl md:mx-auto md:w-full">
        {messages.map((msg,i)=><ChatBubble key={i} msg={msg}/>)}
        {typing && <ChatBubble isTyping/>}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div className="glass flex-shrink-0 px-4 md:px-8 lg:px-16 py-3 pb-6" style={{borderTop:"1px solid rgba(212,168,83,.15)"}}>
        <div className="flex gap-2.5 items-end md:max-w-3xl md:mx-auto">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl" style={{background:"var(--parchment)",border:"1.5px solid var(--clay)",boxShadow:"0 2px 12px rgba(26,20,16,.06)"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Ask your guide anything..." className="flex-1 border-none outline-none text-sm bg-transparent" style={{color:"var(--ink)",fontFamily:"'DM Sans',sans-serif"}}/>
            <button style={{color:"var(--smoke)",display:"flex",border:"none",background:"none",cursor:"pointer"}}><Ico.Mic/></button>
          </div>
          <button onClick={()=>send()} className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
            style={{background:"linear-gradient(135deg,var(--terracotta),var(--deep))",border:"none",color:"#fff",cursor:"pointer",boxShadow:"0 4px 16px rgba(192,101,74,.3)"}}>
            <Ico.Send/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: PROFILE
// ─────────────────────────────────────────────
function ProfilePage({setPage}) {
  const bookings = [
    {title:"Sahara Desert Overnight",location:"Merzouga",date:"Mar 22, 2026",guests:2,total:"€298",status:"Upcoming",statusColor:"var(--sage)",gradient:"linear-gradient(135deg,#c8a06e 0%,#2C1F12 100%)"},
    {title:"Fès Medina Food Trail",location:"Fès el-Bali",date:"Jan 14, 2026",guests:2,total:"€130",status:"Completed",statusColor:"var(--terracotta)",gradient:"linear-gradient(135deg,#C0654A 0%,#1A1410 100%)"},
  ];
  return (
    <div className="page-enter">
      {/* Profile hero */}
      <div className="pattern-bg relative overflow-hidden" style={{padding:"52px 20px 28px"}}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-white flex-shrink-0"
            style={{background:"linear-gradient(135deg,var(--terracotta),var(--gold))",border:"3px solid rgba(212,168,83,.35)"}}>
            S
          </div>
          <div>
            <h2 className="font-display text-white" style={{fontSize:22,fontWeight:500}}>Sarah Dupont</h2>
            <p style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>Member since 2024 · Paris, France</p>
          </div>
        </div>
        <div className="flex mt-5 rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,.07)"}}>
          {[["3","Trips"],["12","Experiences"],["4.9★","Rating"]].map(([val,label],i)=>(
            <div key={label} className="flex-1 py-3 text-center" style={{borderRight:i<2?"1px solid rgba(255,255,255,.1)":"none"}}>
              <p className="font-display" style={{fontSize:20,color:"var(--gold)",fontWeight:500}}>{val}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,.45)",marginTop:1}}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 md:px-8 lg:px-10 py-6">
        {/* Bookings */}
        <h2 className="font-display mb-4" style={{fontSize:22,fontWeight:400,color:"var(--ink)"}}>My <em>Bookings</em></h2>
        <div className="flex flex-col gap-3 mb-6">
          {bookings.map((b,i)=>(
            <div key={i} className="card-lift rounded-2xl overflow-hidden" style={{background:"var(--parchment)",boxShadow:"0 4px 20px rgba(26,20,16,.08)"}}>
              <div className="h-20 relative" style={{background:b.gradient}}>
                <div className="absolute inset-0" style={{background:"linear-gradient(to right,rgba(26,20,16,.6),transparent)"}}/>
                <div className="absolute top-3 left-4 right-4 flex justify-between items-start">
                  <div>
                    <h4 className="font-display text-white" style={{fontSize:15,fontWeight:500}}>{b.title}</h4>
                    <p style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:1}}>{b.location}</p>
                  </div>
                  <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-full" style={{background:b.statusColor,letterSpacing:".04em"}}>{b.status}</span>
                </div>
              </div>
              <div className="px-4 py-3 flex justify-between items-center">
                <div className="flex gap-4" style={{color:"var(--smoke)"}}>
                  <div className="flex items-center gap-1"><Ico.Cal/><span style={{fontSize:12}}>{b.date}</span></div>
                  <div className="flex items-center gap-1"><Ico.Users/><span style={{fontSize:12}}>{b.guests} guests</span></div>
                </div>
                <span style={{fontSize:16,fontWeight:700,color:"var(--terracotta)"}}>{b.total}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Saved */}
        <h2 className="font-display mb-4" style={{fontSize:22,fontWeight:400,color:"var(--ink)"}}>Saved <em>Experiences</em></h2>
        <div className="md:hidden flex gap-3 overflow-x-auto pb-2 snap-x mb-6">
          {EXPERIENCES.slice(0,3).map(exp=><ExperienceCard key={exp.id} exp={exp} onTap={()=>{}} compact/>)}
        </div>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {EXPERIENCES.slice(0,3).map(exp=><ExperienceCard key={exp.id} exp={exp} onTap={()=>{}}/>)}
        </div>

        {/* Settings */}
        <h2 className="font-display mb-3" style={{fontSize:20,fontWeight:400,color:"var(--ink)"}}>Account</h2>
        {["Account Settings","Notifications","Language & Currency","Help Center","Sign Out"].map((item,i)=>(
          <button key={item} className="w-full py-4 flex justify-between items-center bg-transparent text-left"
            style={{border:"none",borderBottom:i<4?"1px solid var(--light-clay)":"none",cursor:"pointer",
              color:i===4?"var(--terracotta)":"var(--ink)",fontSize:14,fontWeight:i===4?600:400}}>
            {item}
            {i<4&&<span style={{color:"var(--smoke)"}}><Ico.Arrow/></span>}
          </button>
        ))}
      </div>
      <div style={{height:80}} className="lg:hidden"/>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");

  const pages = {
    home:      <HomePage setPage={setPage}/>,
    explore:   <ExplorePage/>,
    ai:        <AIPage setPage={setPage}/>,
    itinerary: <ItineraryPage setPage={setPage}/>,
    booking:   <BookingPage setPage={setPage}/>,
    chat:      <ChatPage/>,
    profile:   <ProfilePage setPage={setPage}/>,
  };

  const isChat = page === "chat";

  return (
    <>
      <style>{STYLES}</style>
      <div className="grain"/>

      {/* ── DESKTOP: sidebar layout ── */}
      <div className="hidden lg:flex min-h-screen">
        <DesktopSidebar active={page} setPage={setPage}/>
        <main className="flex-1 overflow-y-auto" style={{background:"var(--parchment)"}}>
          <div key={page}>{pages[page]||pages.home}</div>
        </main>
      </div>

      {/* ── TABLET: top nav ── */}
      <div className="hidden md:block lg:hidden">
        <TabletNav active={page} setPage={setPage}/>
        <main key={page} style={{background:"var(--parchment)",minHeight:"calc(100vh - 64px)"}}>
          {pages[page]||pages.home}
        </main>
      </div>

      {/* ── MOBILE: full screen + bottom nav ── */}
      <div className="md:hidden" style={{background:"var(--parchment)",minHeight:"100dvh"}}>
        <main key={page}>{pages[page]||pages.home}</main>

        {/* Floating AI chat button */}
        {!["chat","ai","itinerary","booking"].includes(page) && (
          <button onClick={()=>setPage("chat")} className="ai-float tap-ripple fixed z-40"
            style={{right:16,bottom:76,width:50,height:50,borderRadius:18,
              background:"linear-gradient(135deg,var(--terracotta),var(--deep))",
              border:"none",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",cursor:"pointer"}}>
            <Ico.Sparkle/>
          </button>
        )}

        <BottomNav active={page} setPage={setPage}/>
      </div>
    </>
  );
}
