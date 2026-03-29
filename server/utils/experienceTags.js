/** Keep in sync with src/config/experienceTags.js */
const POPULAR_EXPERIENCE_TAGS = [
  'Adventure', 'Desert', 'Food', 'Culture', 'Hiking', 'Nature', 'Luxury', 'Photo', 'Surf',
];

export function normalizeExperienceTag(raw) {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const lower = t.toLowerCase();
  const fromPopular = POPULAR_EXPERIENCE_TAGS.find((p) => p.toLowerCase() === lower);
  if (fromPopular) return fromPopular;
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

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
