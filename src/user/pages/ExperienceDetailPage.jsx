import { useEffect, useMemo, useState } from "react";
import ExperienceCard from "../components/ui/ExperienceCard";
import { Ico } from "../icons";
import { EXPERIENCES } from "../data/experiences";
import { useToast } from "../../context/ToastContext";

const GALLERY_GRADIENTS = [
  "linear-gradient(145deg,#c8a06e 0%,#8B5E3C 45%,#2C1F12 100%)",
  "linear-gradient(145deg,#D4A853 0%,#C0654A 55%,#1A1410 100%)",
  "linear-gradient(145deg,#7A8C6E 0%,#4A5C3E 50%,#2C3828 100%)",
];

function coverUrl(exp) {
  const u = exp?.image_url;
  if (u == null || String(u).trim() === "") return null;
  const s = String(u).trim();
  return /^https?:\/\//i.test(s) ? s : null;
}

/** YYYY-MM-DD in local timezone for input type="date" min */
function todayDateInputMin() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STAR_RATING = (n) => Array.from({ length: 5 }, (_, i) => (
  <span key={i} style={{ color: i < n ? "var(--gold)" : "var(--clay)" }}>★</span>
));

const MOCK_REVIEWS = [
  { id: 1, name: "Sophie L.", avatar: "S", rating: 5, comment: "Absolutely magical. Our guide Youssef was incredibly knowledgeable and made the whole experience feel deeply personal. The sunset over the dunes was unlike anything I've ever seen.", date: "Feb 2026" },
  { id: 2, name: "Marco R.", avatar: "M", rating: 5, comment: "Worth every euro. The camel trek at dawn, the Berber camp, the food — it all exceeded expectations. Book it without hesitation.", date: "Jan 2026" },
  { id: 3, name: "Amara K.", avatar: "A", rating: 4, comment: "A truly immersive experience. The only small note is that the camp was slightly crowded on our night, but the stars and the silence made up for everything.", date: "Dec 2025" },
];

export default function ExperienceDetailPage({ experience, setPage, setSelectedExperience, onBook }) {
  const toast = useToast();
  const [guests, setGuests] = useState(1);
  const [date, setDate]     = useState("");
  const [liked, setLiked]   = useState(false);

  const exp = experience || EXPERIENCES[0];
  const minDate = useMemo(() => todayDateInputMin(), []);

  useEffect(() => {
    setDate("");
    setGuests(1);
  }, [exp?.id]);
  const related = EXPERIENCES.filter((e) => e.id !== exp.id).slice(0, 3);
  const heroImg = coverUrl(exp);
  const galleryItems = heroImg ? [heroImg, ...GALLERY_GRADIENTS.slice(0, 2)] : [...GALLERY_GRADIENTS];
  const priceNum = typeof exp.price === "number" ? exp.price : Number(String(exp.price ?? "").replace(/[^\d.]/g, ""));
  const total = Math.round(((Number.isFinite(priceNum) ? priceNum : 0) * guests + 25) * 1.05);

  const handleBook = () => {
    if (!date) {
      toast("Please select a travel date", "warning");
      return;
    }
    if (onBook) onBook({ date, guests: String(guests), experience: exp });
    else setPage("booking");
  };

  const handleLike = () => {
    setLiked((l) => !l);
    toast(liked ? "Removed from saved" : "Saved to your wishlist", "success");
  };

  return (
    <div className="page-enter pt-14 md:pt-0 pb-28 lg:pb-0" style={{ background: "var(--parchment)" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ height: "clamp(260px,40vh,420px)" }}>
        {heroImg ? (
          <>
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 w-full h-full" style={{ background: exp.gradient, opacity: 0.25 }} />
          </>
        ) : (
          <div className="w-full h-full" style={{ background: exp.gradient }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(26,20,16,.75) 0%,rgba(26,20,16,.2) 50%,transparent 100%)" }} />

        {/* Back button */}
        <button onClick={() => setPage("explore")}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: "rgba(250,246,238,.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", cursor: "pointer" }}>
          <Ico.Arrow d="left" /> Back
        </button>

        {/* Like button */}
        <button onClick={handleLike}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(250,246,238,.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.2)", cursor: "pointer", color: liked ? "var(--terracotta)" : "#fff" }}>
          <Ico.Heart f={liked} />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-10 pb-6">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(exp.tags || []).map((t) => (
              <span key={t} style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", background: "rgba(212,168,83,.9)", color: "var(--ink)", padding: "3px 8px", borderRadius: 100, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
          <h1 className="font-display text-white" style={{ fontSize: "clamp(26px,4vw,48px)", fontWeight: 400, lineHeight: 1.1 }}>{exp.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            <span className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,.8)", textTransform: "capitalize" }}><Ico.Pin />{exp.location}</span>
            {exp.route ? (
              <span className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,.75)" }}><Ico.Map />{exp.route}</span>
            ) : null}
            <span className="flex items-center gap-1 text-sm" style={{ color: "var(--gold)" }}>
              {STAR_RATING(Math.round(Number(exp.rating)))}
              <span style={{ color: "rgba(255,255,255,.7)", marginLeft: 4 }}>{exp.rating} ({exp.reviews || exp.review_count || 0})</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lg:grid lg:grid-cols-3 max-w-7xl mx-auto">

        {/* Left: main content */}
        <div className="lg:col-span-2 px-5 md:px-10 py-8">

          {/* Gallery */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x mb-8 -mx-5 px-5">
            {galleryItems.map((item, i) => {
              const isUrl = typeof item === "string" && /^https?:\/\//i.test(item.trim());
              return (
                <div
                  key={i}
                  className="snap-s flex-shrink-0 rounded-2xl overflow-hidden relative"
                  style={{
                    width: "clamp(200px,55vw,320px)",
                    height: 180,
                    ...(isUrl ? {} : { background: item }),
                  }}
                >
                  {isUrl ? (
                    <img src={item.trim()} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: <Ico.Clock />, label: "Duration", value: exp.duration || "Full day" },
              { icon: <Ico.Users />, label: "Max Group", value: `${exp.max_group || exp.maxGroup || 8} people` },
              { icon: <Ico.Star f />, label: "Rating", value: `${exp.rating} / 5.0` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
                <div className="flex justify-center mb-1" style={{ color: "var(--terracotta)" }}>{s.icon}</div>
                <p className="text-xs" style={{ color: "var(--smoke)" }}>{s.label}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--ink)" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="font-display mb-3" style={{ fontSize: 24, fontWeight: 400, color: "var(--ink)" }}>About this <em>experience</em></h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--smoke)" }}>
              {exp.description || "Immerse yourself in one of Morocco's most extraordinary landscapes. This carefully curated experience blends adventure, culture, and authentic local hospitality into an unforgettable journey."}
            </p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--smoke)" }}>
              Your expert local guide will lead you through hidden pathways, sharing centuries of history and culture. Every detail is thoughtfully arranged so you can focus entirely on the experience.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--smoke)" }}>
              Small groups ensure a personal, intimate atmosphere. Maximum {exp.max_group || exp.maxGroup || 8} guests per session guarantees quality and exclusivity.
            </p>
          </div>

          {/* Highlights */}
          <div className="mb-8">
            <h2 className="font-display mb-4" style={{ fontSize: 24, fontWeight: 400, color: "var(--ink)" }}>What's <em>included</em></h2>
            <ul className="space-y-2.5">
              {["Expert certified local guide (English & French)", "All equipment and safety gear provided", "Traditional Moroccan refreshments", "Small group — maximum 8 guests", "Free cancellation up to 48 hours before"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--smoke)" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(122,140,110,.15)", color: "var(--sage)" }}>
                    <Ico.Check />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Guide profile */}
          <div className="mb-8 rounded-2xl p-5" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
            <h2 className="font-display mb-4" style={{ fontSize: 20, fontWeight: 400, color: "var(--ink)" }}>Your <em>guide</em></h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-display font-medium flex-shrink-0"
                style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>Y</div>
              <div>
                <p className="font-semibold" style={{ color: "var(--ink)" }}>Youssef Benali</p>
                <p className="text-sm" style={{ color: "var(--smoke)" }}>Certified guide · 12 years experience</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs" style={{ color: "var(--smoke)" }}>🇬🇧 🇫🇷 🇲🇦</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--gold)" }}>★ 4.97 <span style={{ color: "var(--smoke)" }}>(312 reviews)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-8">
            <h2 className="font-display mb-4" style={{ fontSize: 24, fontWeight: 400, color: "var(--ink)" }}>Guest <em>reviews</em></h2>
            <div className="space-y-4">
              {MOCK_REVIEWS.map((r) => (
                <div key={r.id} className="rounded-2xl p-5" style={{ background: "var(--parchment)", border: "1px solid var(--light-clay)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                        style={{ background: "linear-gradient(135deg,var(--terracotta),var(--gold))" }}>{r.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{r.name}</p>
                        <p className="text-xs" style={{ color: "var(--smoke)" }}>{r.date}</p>
                      </div>
                    </div>
                    <div className="flex" style={{ color: "var(--gold)", fontSize: 13 }}>{STAR_RATING(r.rating)}</div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--smoke)" }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related experiences */}
          <div>
            <h2 className="font-display mb-4" style={{ fontSize: 24, fontWeight: 400, color: "var(--ink)" }}>You might also <em>love</em></h2>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x -mx-5 px-5">
              {related.map((r) => (
                <div key={r.id} className="flex-shrink-0 snap-s" style={{ width: 200 }}>
                  <ExperienceCard exp={r} compact onTap={() => { setSelectedExperience(r); setPage("experience"); }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: booking widget (desktop) */}
        <div className="hidden lg:block lg:col-span-1 border-l" style={{ borderColor: "var(--light-clay)" }}>
          <div className="sticky top-0 p-8">
            <div className="rounded-3xl p-6" style={{ background: "var(--sand)", border: "1px solid var(--clay)" }}>
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-display" style={{ fontSize: 32, fontWeight: 400, color: "var(--terracotta)" }}>
                  €{String(exp.price).replace("€","")}
                </span>
                <span className="text-sm" style={{ color: "var(--smoke)" }}>per person</span>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Date</label>
                  <input
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", color: "var(--ink)", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--clay)" }}>Required — pick today or a future date</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>Guests</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", cursor: "pointer", color: "var(--ink)" }}>−</button>
                    <span className="flex-1 text-center font-semibold" style={{ color: "var(--ink)" }}>{guests}</span>
                    <button onClick={() => setGuests((g) => Math.min(exp.max_group || exp.maxGroup || 8, g + 1))}
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ background: "var(--parchment)", border: "1.5px solid var(--clay)", cursor: "pointer", color: "var(--ink)" }}>+</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between"><span style={{ color: "var(--smoke)" }}>€{String(exp.price).replace("€","")} × {guests}</span><span style={{ color: "var(--ink)" }}>€{Number(String(exp.price).replace("€","")) * guests}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--smoke)" }}>Guide fee</span><span style={{ color: "var(--ink)" }}>€25</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--smoke)" }}>Platform fee (5%)</span><span style={{ color: "var(--ink)" }}>€{Math.round((Number(String(exp.price).replace("€","")) * guests + 25) * 0.05)}</span></div>
                <div className="flex justify-between pt-2 font-semibold" style={{ borderTop: "1px solid var(--clay)" }}>
                  <span style={{ color: "var(--ink)" }}>Total</span>
                  <span style={{ color: "var(--terracotta)", fontSize: 18 }}>€{total}</span>
                </div>
              </div>

              <button onClick={handleBook}
                className="w-full py-4 rounded-2xl font-semibold text-sm"
                style={{ background: "linear-gradient(135deg,var(--terracotta),var(--deep))", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,101,74,.3)" }}>
                Book Now
              </button>
              <p className="text-center text-xs mt-3" style={{ color: "var(--clay)" }}>Free cancellation up to 48h before</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: date + guests (sidebar is hidden below lg — without this, Book Now always failed) */}
      <div
        className="lg:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-3 pt-3 border-t"
        style={{
          background: "var(--parchment)",
          borderColor: "var(--light-clay)",
          boxShadow: "0 -8px 32px rgba(26,20,16,.08)",
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--smoke)", letterSpacing: ".1em" }}>
          Travel date
        </p>
        <input
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm mb-2"
          style={{
            background: "var(--sand)",
            border: "1.5px solid var(--clay)",
            color: "var(--ink)",
            fontFamily: "'DM Sans',sans-serif",
            outline: "none",
          }}
        />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--smoke)" }}>Guests</span>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", cursor: "pointer", color: "var(--ink)" }}
            >
              −
            </button>
            <span className="font-semibold min-w-[1.5rem] text-center" style={{ color: "var(--ink)" }}>{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(exp.max_group || exp.maxGroup || 8, g + 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--sand)", border: "1.5px solid var(--clay)", cursor: "pointer", color: "var(--ink)" }}
            >
              +
            </button>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "var(--smoke)" }}>Total</p>
            <p className="font-display font-semibold" style={{ fontSize: 18, color: "var(--terracotta)" }}>€{total}</p>
          </div>
        </div>
        <button
          onClick={handleBook}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm"
          style={{
            background: "linear-gradient(135deg,var(--terracotta),var(--deep))",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 28px rgba(192,101,74,.3)",
            opacity: date ? 1 : 0.75,
          }}
        >
          {date ? "Book Now" : "Select a date to continue"}
        </button>
      </div>
    </div>
  );
}
