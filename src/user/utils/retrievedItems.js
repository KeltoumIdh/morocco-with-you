/** Deduplicate RAG hits that repeat the same catalogue row. */
export function dedupeRetrievedItems(items) {
  const seen = new Map();
  for (const it of items || []) {
    if (!it?.item_id || !it?.item_type) continue;
    const k = `${it.item_type}-${it.item_id}`;
    if (!seen.has(k)) seen.set(k, it);
  }
  return [...seen.values()];
}

export function catalogueCtaLabel(itemType) {
  switch (itemType) {
    case "experience":
    case "activity":
      return "View & book";
    case "accommodation":
      return "View stay";
    case "restaurant":
      return "View restaurant";
    case "package":
      return "View package";
    case "group_trip":
      return "View trip";
    case "provider":
      return "Browse catalogue";
    default:
      return "View";
  }
}
