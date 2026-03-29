/** Canonical tags (match user app Explore filters). */
export const POPULAR_EXPERIENCE_TAGS = [
  "Adventure",
  "Desert",
  "Food",
  "Culture",
  "Hiking",
  "Nature",
  "Luxury",
  "Photo",
  "Surf",
];

/**
 * Map free text to a canonical popular tag when it matches case-insensitively;
 * otherwise title-case each word for consistent storage.
 */
export function normalizeExperienceTag(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  const fromPopular = POPULAR_EXPERIENCE_TAGS.find((p) => p.toLowerCase() === lower);
  if (fromPopular) return fromPopular;
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Dedupe case-insensitively, preserve first normalized spelling. */
export function normalizeExperienceTagsList(tags) {
  const out = [];
  const seen = new Set();
  for (const raw of tags || []) {
    const n = normalizeExperienceTag(raw);
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}
