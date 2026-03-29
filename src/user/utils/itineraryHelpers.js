/** Regex → canonical place key (see TRIP_STOP_META). Order: more specific first. */
const PLACE_KEY_FROM_TEXT = [
  [/chefchaouen/i, "chefchaouen"],
  [/essaouira/i, "essaouira"],
  [/marrakech|menara airport|\brak\b/i, "marrakech"],
  [/f(e|è)s\b|\bfez\b/i, "fes"],
  [/casablanca/i, "casablanca"],
  [/rabat/i, "rabat"],
  [/tangier|tanger/i, "tangier"],
  [/merzouga|erg chebbi|sahara desert/i, "merzouga"],
  [/atlas mountains|high atlas|toubkal|imlil/i, "atlas"],
  [/agadir/i, "agadir"],
];

/** Approximate centers for route map (Morocco). */
export const TRIP_STOP_META = {
  marrakech: { label: "Marrakech", lat: 31.6295, lng: -7.9811 },
  essaouira: { label: "Essaouira", lat: 31.5085, lng: -9.7595 },
  fes: { label: "Fès", lat: 34.0331, lng: -5.0003 },
  casablanca: { label: "Casablanca", lat: 33.5731, lng: -7.5898 },
  rabat: { label: "Rabat", lat: 34.0209, lng: -6.8416 },
  tangier: { label: "Tangier", lat: 35.7595, lng: -5.834 },
  merzouga: { label: "Merzouga (Sahara)", lat: 31.08, lng: -4.01 },
  atlas: { label: "High Atlas", lat: 31.06, lng: -7.91 },
  agadir: { label: "Agadir", lat: 30.4278, lng: -9.5981 },
  chefchaouen: { label: "Chefchaouen", lat: 35.1714, lng: -5.2693 },
};

/** Map canonical key → “Plan My Trip” city chip label */
export const PLANNING_CITY_BY_KEY = {
  marrakech: "Marrakech",
  essaouira: "Essaouira",
  fes: "Fès",
  casablanca: "Casablanca",
  rabat: "Rabat",
  tangier: "Tangier",
  merzouga: "Sahara/Merzouga",
  atlas: "Atlas Mountains",
  agadir: "Agadir",
  chefchaouen: "Chefchaouen",
};

function placeKeyFromString(s) {
  const str = String(s || "");
  for (const [re, key] of PLACE_KEY_FROM_TEXT) {
    if (re.test(str) && TRIP_STOP_META[key]) return key;
  }
  return null;
}

function resolveStopFromItem(item) {
  const loc = String(item?.location || "").trim();
  if (loc && !/^morocco$/i.test(loc)) {
    const k = placeKeyFromString(loc);
    if (k) return { key: k, ...TRIP_STOP_META[k] };
  }
  const blob = `${item?.activity || ""} ${item?.note || ""}`;
  for (const [re, key] of PLACE_KEY_FROM_TEXT) {
    if (re.test(blob) && TRIP_STOP_META[key]) return { key, ...TRIP_STOP_META[key] };
  }
  return null;
}

/**
 * Ordered stops (deduped), first appearance wins — same order as the trip narrative.
 */
export function buildOrderedTripStops(days) {
  const out = [];
  let lastKey = null;
  let order = 0;
  for (const d of days || []) {
    for (const item of d.items || []) {
      const r = resolveStopFromItem(item);
      if (!r) continue;
      if (r.key === lastKey) continue;
      lastKey = r.key;
      order += 1;
      out.push({
        order,
        key: r.key,
        label: r.label,
        lat: r.lat,
        lng: r.lng,
        day: d.day,
        placeQuery: `${r.label}, Morocco`,
      });
    }
  }
  return out;
}

export function googleMapsSearchUrl(placeQuery) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
}

const MAX_ACTIVITY_MAPS_QUERY = 120;

function inferCityLabelFromBlob(blob) {
  const b = String(blob || "");
  for (const [re, key] of PLACE_KEY_FROM_TEXT) {
    if (re.test(b) && TRIP_STOP_META[key]) return TRIP_STOP_META[key].label;
  }
  return null;
}

/** Optional landmark word from long prose (never pass full activity text to Google). */
function spotHintFromActivity(act) {
  const a = String(act || "");
  if (/\bport\b|harbour|harbor|fishing port|quai\b/i.test(a)) return "port";
  if (/\bmedina\b|souks?\b|old town/i.test(a)) return "medina";
  if (/airport|menara|\brak\b/i.test(a)) return "airport";
  if (/\bbeach\b|plage|coast(al)?\b/i.test(a)) return "beach";
  if (/jemaa|jamaa el-fna/i.test(a)) return "Jemaa el-Fna";
  if (/majorelle/i.test(a)) return "Jardin Majorelle";
  if (/bahia palace/i.test(a)) return "Bahia Palace";
  if (/hassan ii|mosquée hassan/i.test(a)) return "Hassan II Mosque";
  if (/atlas|imlil|toubkal|ourika/i.test(a)) return "Atlas Mountains";
  if (/erg chebbi|merzouga|sahara/i.test(a)) return "Merzouga";
  return null;
}

function isTitleLikeActivity(act) {
  const s = String(act || "").trim();
  if (!s || s.length > 52) return false;
  if (s.split(/\s+/).length > 9) return false;
  // Long marketing sentences usually start like this:
  if (/^(indulge|enjoy|discover|experience|immerse|start|begin|take a|visit the|explore the)\b/i.test(s)) return false;
  return true;
}

/**
 * Short Maps search: destination-style, not full AI prose (location + optional hint, or short title).
 */
export function buildActivityMapsQuery(item) {
  const act = String(item?.activity || item?.title || "").trim();
  const loc = String(item?.location || "").trim();
  const note = String(item?.note || item?.description || "").trim();
  const blob = `${act} ${note}`;

  const locIsGeneric = !loc || /^morocco$/i.test(loc);
  const locShort = !locIsGeneric ? (loc.length > 70 ? `${loc.slice(0, 67)}…` : loc) : null;

  let cityPart = locShort || inferCityLabelFromBlob(blob);
  const hint = spotHintFromActivity(act) || spotHintFromActivity(note);

  let q = null;
  if (cityPart && hint && !cityPart.toLowerCase().includes(hint.toLowerCase())) {
    q = `${cityPart} ${hint}, Morocco`;
  } else if (cityPart) {
    q = `${cityPart}, Morocco`;
  } else if (isTitleLikeActivity(act)) {
    q = `${act}, Morocco`;
  } else {
    const cityOnly = inferCityLabelFromBlob(blob);
    if (cityOnly && hint) q = `${cityOnly} ${hint}, Morocco`;
    else if (cityOnly) q = `${cityOnly}, Morocco`;
  }

  if (!q?.trim()) return null;
  if (!/\bmorocco\b/i.test(q)) q = `${q}, Morocco`;
  if (q.length > MAX_ACTIVITY_MAPS_QUERY) q = `${q.slice(0, MAX_ACTIVITY_MAPS_QUERY - 1)}…`;
  return q;
}

export function googleMapsUrlForItineraryItem(item) {
  const query = buildActivityMapsQuery(item);
  return query ? googleMapsSearchUrl(query) : null;
}

/**
 * Human-readable route (labels), for summary line.
 */
export function deriveTripDestinations(days) {
  const stops = buildOrderedTripStops(days);
  if (!stops.length) return "Morocco";
  return stops.map((s) => s.label).join(" → ");
}

export function buildItineraryExportText({ title, days, estimatedTotal, destinationsLine }) {
  const lines = [];
  lines.push(title || "Morocco itinerary");
  lines.push("");
  if (destinationsLine) lines.push(`Destinations: ${destinationsLine}`);
  if (estimatedTotal) lines.push(`Estimated budget: €${estimatedTotal}`);
  lines.push("");

  for (const d of days || []) {
    lines.push(`— Day ${d.day} —`);
    for (const item of d.items || []) {
      const t = item.time || "Block";
      lines.push(`  [${t}] ${item.activity || ""}`);
      if (item.duration) lines.push(`    Duration: ${item.duration}`);
      if (item.location) lines.push(`    Location: ${item.location}`);
      if (item.note) lines.push(`    Note: ${item.note}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

const PREFILL_MAX = 10000;

/** Mirrors PlanningPage selects (for mapping AI → form). */
export const PLANNING_GROUP_TYPES_FOR_MAP = [
  "Solo",
  "Couple",
  "Family",
  "Friends",
  "Group",
  "Corporate",
];
export const PLANNING_INTEREST_CHIPS = [
  "Desert",
  "Culture",
  "Food",
  "Hiking",
  "Surf",
  "Wellness",
  "Photography",
  "History",
];

/** Map AI wizard / DB budget string → Plan My Trip chip label (see PlanningPage BUDGETS). */
export function mapBudgetToPlanningRange(budget) {
  const b = String(budget || "").toLowerCase();
  if (b.includes("luxury")) return "Luxury (€2500+)";
  if (b.includes("premium")) return "Premium (€1200-2500)";
  if (b.includes("mid-range") || b.includes("mid range")) return "Mid-range (€500-1200)";
  if (b.includes("budget")) return "Budget (<€500)";
  return null;
}

/** Map AI interests → PlanningPage INTERESTS chips (subset). */
export function mapAiInterestsToPlanningChips(aiList, allowedChips) {
  const allowed = new Set(allowedChips || []);
  const out = new Set();
  for (const raw of aiList || []) {
    const s = String(raw).toLowerCase();
    if (s.includes("desert") || s.includes("sahara")) out.add("Desert");
    if (s.includes("culture") || s.includes("medina") || s.includes("architecture")) out.add("Culture");
    if (s.includes("food") || s.includes("cuisine") || s.includes("nightlife")) out.add("Food");
    if (s.includes("hik") || s.includes("nature") || s.includes("atlas")) out.add("Hiking");
    if (s.includes("surf") || s.includes("coast")) out.add("Surf");
    if (s.includes("photo")) out.add("Photography");
    if (s.includes("history") || s.includes("spiritual")) out.add("History");
    if (s.includes("wellness") || s.includes("luxury") || s.includes("riad")) out.add("Wellness");
  }
  return [...out].filter((x) => allowed.has(x));
}

/** Map AI group string → PlanningPage group_type select value. */
export function mapGroupToPlanningType(group, allowedList) {
  const g = String(group || "").trim();
  const allowed = new Set(allowedList || []);
  if (allowed.has(g)) return g;
  if (/small group|3-5|3–5/i.test(g)) return allowed.has("Friends") ? "Friends" : null;
  if (/large group|6\+/i.test(g)) return allowed.has("Group") ? "Group" : null;
  if (/corporate/i.test(g)) return allowed.has("Corporate") ? "Corporate" : null;
  if (/family/i.test(g)) return allowed.has("Family") ? "Family" : null;
  if (/couple/i.test(g)) return allowed.has("Couple") ? "Couple" : null;
  if (/solo/i.test(g)) return allowed.has("Solo") ? "Solo" : null;
  return null;
}

/**
 * Merge DB row + `content.meta` from generate (duration, group, budget, interests).
 */
export function extractPlannerMetaFromItinerary(row, content) {
  const meta = content?.meta && typeof content.meta === "object" ? content.meta : {};
  const fromRow = Array.isArray(row?.interests) ? row.interests : [];
  const fromMeta = Array.isArray(meta.interests) ? meta.interests : [];
  return {
    duration: row?.duration ?? meta.duration ?? "",
    group: row?.group_type ?? meta.group ?? "",
    budget: row?.budget ?? meta.budget ?? "",
    interests: fromRow.length ? fromRow : fromMeta,
  };
}

/** Payload for Plan My Trip form (custom quote from AI itinerary + wizard answers). */
export function buildPlanningPrefillFromItinerary(
  {
    title,
    days,
    totalDays,
    destinationsLine,
    estimatedTotal,
    plannerMeta,
  },
  planningFieldOptions = {}
) {
  const groupTypes = planningFieldOptions.groupTypes ?? PLANNING_GROUP_TYPES_FOR_MAP;
  const interestChips = planningFieldOptions.interests ?? PLANNING_INTEREST_CHIPS;
  const stops = buildOrderedTripStops(days);
  const cities = [];
  const seen = new Set();
  for (const s of stops) {
    const c = PLANNING_CITY_BY_KEY[s.key];
    if (c && !seen.has(c)) {
      seen.add(c);
      cities.push(c);
    }
  }

  const pm = plannerMeta || {};
  const hasPlanner =
    !!(pm.duration || pm.group || pm.budget || (pm.interests && pm.interests.length));

  const plannerLines = hasPlanner
    ? [
        "--- AI planner choices (please honour in your quote) ---",
        pm.duration ? `Duration: ${pm.duration}` : null,
        pm.group ? `Group: ${pm.group}` : null,
        pm.budget ? `Budget tier: ${pm.budget}` : null,
        pm.interests?.length ? `Interests: ${pm.interests.join(", ")}` : null,
        "",
      ].filter((line) => line != null)
    : [];

  const detail = buildItineraryExportText({
    title,
    days,
    estimatedTotal,
    destinationsLine,
  });

  const head = [
    "Quote request — I created this plan with your AI itinerary tool.",
    `Title: ${title || "My trip"}`,
    `Approx. length: ${totalDays} days`,
    `Route: ${destinationsLine}`,
    estimatedTotal != null
      ? `AI ballpark total shown in app: €${estimatedTotal} (see pricing note below)`
      : null,
    "",
  ].filter((line) => line != null);

  let special_requests = [
    ...head,
    ...plannerLines,
    "--- Full outline ---",
    "",
    detail,
    "",
    "---",
    "Note: Trip total in the app is a rough estimate from budget tier and trip length, not live flight/hotel prices.",
  ].join("\n");

  if (special_requests.length > PREFILL_MAX) {
    special_requests = `${special_requests.slice(0, PREFILL_MAX - 40)}\n\n…(message truncated — export file has full detail)`;
  }

  const group_type = mapGroupToPlanningType(pm.group, groupTypes);
  const budget_range = mapBudgetToPlanningRange(pm.budget);
  const interestsMapped =
    pm.interests?.length
      ? mapAiInterestsToPlanningChips(pm.interests, interestChips)
      : [];

  return {
    cities,
    special_requests,
    ...(group_type ? { group_type } : {}),
    ...(budget_range ? { budget_range } : {}),
    ...(interestsMapped.length ? { interests: interestsMapped } : {}),
  };
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
