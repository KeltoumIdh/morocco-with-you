// ── AI Service ────────────────────────────────────────────────
// Chat: OpenAI, Google Gemini (free tier / production), or Ollama (local).
// See AI_CHAT_PROVIDER and GEMINI_API_KEY in server/.env.example.

import { supabase } from "./supabase.js";
import { hybridSearch, canUseSemanticSearch } from "./embeddings.js";
import { getActivePrompt, renderPrompt } from "./promptManager.js";

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";

function hasGeminiKey() {
  return !!(
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim()
  );
}

function openAiKeyPresent() {
  return !!process.env.OPENAI_API_KEY?.trim();
}

function skipOpenAIInAuto() {
  return /^(1|true|yes)$/i.test(process.env.SKIP_OPENAI?.trim() || "");
}

function isOpenAIQuotaError(err) {
  const msg = String(err?.message || err || "");
  return /429|quota|insufficient[_\s]quota|billing/i.test(msg);
}

function isGeminiQuotaError(err) {
  const msg = String(err?.message || err || "");
  return /429|quota|rate[\s-]?limit|exceeded|Resource exhausted|billing|free_tier/i.test(
    msg,
  );
}

/** openai | gemini | ollama | auto — auto: OpenAI → Gemini → Ollama */
export function resolveChatProvider() {
  const p = (process.env.AI_CHAT_PROVIDER || "auto").trim().toLowerCase();
  const hasOpenAI = openAiKeyPresent();
  if (p === "openai") return hasOpenAI ? "openai" : "none";
  if (p === "gemini") return hasGeminiKey() ? "gemini" : "none";
  if (p === "ollama") return "ollama";
  if (hasOpenAI && !skipOpenAIInAuto()) return "openai";
  if (hasGeminiKey()) return "gemini";
  return "ollama";
}

export function activeChatModelForLogging() {
  const r = resolveChatProvider();
  if (r === "openai") return CHAT_MODEL;
  if (r === "gemini")
    return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash";
  if (r === "ollama")
    return process.env.OLLAMA_CHAT_MODEL?.trim() || "llama3.2";
  return null;
}

// ── Rule-based itinerary templates ────────────────────────────
const BASE_DAYS = {
  desert: [
    {
      time: "Morning",
      activity: "Camel trek into the dunes",
      duration: "2h",
      note: "Watch the golden light hit the Erg Chebbi dunes at sunrise.",
      location: "Merzouga",
    },
    {
      time: "Afternoon",
      activity: "Berber camp arrival & mint tea",
      duration: "1h",
      note: "Settle into your luxury desert camp, meet your Berber hosts.",
      location: "Erg Chebbi Camp",
    },
    {
      time: "Evening",
      activity: "Stargazing & traditional dinner",
      duration: "3h",
      note: "No light pollution — the Milky Way is extraordinary here.",
      location: "Sahara Desert",
    },
  ],
  culture: [
    {
      time: "Morning",
      activity: "Fès Medina guided walk",
      duration: "3h",
      note: "The world's largest car-free urban area. Lose yourself in 1,200 years of history.",
      location: "Fès el-Bali",
    },
    {
      time: "Afternoon",
      activity: "Tanneries & leather souks",
      duration: "2h",
      note: "Watch the ancient dyeing process from a rooftop terrace.",
      location: "Chouara Tannery",
    },
    {
      time: "Evening",
      activity: "Riad dinner & live Gnawa music",
      duration: "2h",
      note: "Dine in a candlelit courtyard to hypnotic Gnawa rhythms.",
      location: "Riad Dar Seffarine",
    },
  ],
  food: [
    {
      time: "Morning",
      activity: "Djemaa el-Fna breakfast",
      duration: "1.5h",
      note: "Fresh msemen, argan oil, and amlou — the Moroccan breakfast ritual.",
      location: "Jemaa el-Fna, Marrakech",
    },
    {
      time: "Afternoon",
      activity: "Riad cooking class",
      duration: "3h",
      note: "Make tagine, bastilla, and harira with a local chef.",
      location: "Marrakech Medina",
    },
    {
      time: "Evening",
      activity: "Night market street food tour",
      duration: "2h",
      note: "Snail soup, merguez, and fresh-squeezed orange juice.",
      location: "Jemaa el-Fna",
    },
  ],
  hiking: [
    {
      time: "Morning",
      activity: "Imlil village departure",
      duration: "1h",
      note: "Start early to beat the heat. Pack layers — altitude changes fast.",
      location: "Imlil, High Atlas",
    },
    {
      time: "Afternoon",
      activity: "Jebel Toubkal base camp",
      duration: "4h",
      note: "North Africa's highest peak at 4,167m. Stunning cedar forest trail.",
      location: "Toubkal National Park",
    },
    {
      time: "Evening",
      activity: "Berber village homestay",
      duration: "evening",
      note: "Sleep in a traditional stone house with a local family.",
      location: "Aroumd Village",
    },
  ],
  surf: [
    {
      time: "Morning",
      activity: "Surf lesson — Atlantic coast",
      duration: "2h",
      note: "Essaouira's consistent wind and gentle waves are perfect for beginners.",
      location: "Essaouira Beach",
    },
    {
      time: "Afternoon",
      activity: "Medina & ramparts walk",
      duration: "2h",
      note: "UNESCO-listed blue-and-white medina with ocean views.",
      location: "Essaouira Medina",
    },
    {
      time: "Evening",
      activity: "Fresh seafood at the port",
      duration: "1.5h",
      note: "Point at the catch of the day — grilled on the spot.",
      location: "Essaouira Port",
    },
  ],
  luxury: [
    {
      time: "Morning",
      activity: "Hammam & argan oil massage",
      duration: "2h",
      note: "A traditional Moroccan steam bath ritual at a 5-star riad.",
      location: "Marrakech Medina",
    },
    {
      time: "Afternoon",
      activity: "Majorelle Garden & Yves Saint Laurent Museum",
      duration: "2h",
      note: "Cobalt blue architecture and a world-class fashion collection.",
      location: "Guéliz, Marrakech",
    },
    {
      time: "Evening",
      activity: "Rooftop dinner — Nomad Restaurant",
      duration: "2h",
      note: "Contemporary Moroccan cuisine with views of Koutoubia Mosque.",
      location: "Marrakech Medina",
    },
  ],
  photo: [
    {
      time: "Morning",
      activity: "Blue city golden hour walk",
      duration: "2h",
      note: "Chefchaouen's blue alleys glow at dawn before tourists arrive.",
      location: "Chefchaouen",
    },
    {
      time: "Afternoon",
      activity: "Rif Mountain viewpoint",
      duration: "1.5h",
      note: "Panoramic views of the medina and surrounding mountains.",
      location: "Spanish Mosque, Chefchaouen",
    },
    {
      time: "Evening",
      activity: "Sunset at the waterfall",
      duration: "1h",
      note: "Ras el-Maa waterfall — locals gather here at dusk.",
      location: "Ras el-Maa",
    },
  ],
};

const INTEREST_MAP = {
  "Desert & Sahara": "desert",
  "Medinas & Culture": "culture",
  "Food & Cuisine": "food",
  "Hiking & Nature": "hiking",
  "Surf & Coast": "surf",
  "Luxury Riads": "luxury",
  Photography: "photo",
  Architecture: "culture",
  Spiritual: "culture",
  Nightlife: "food",
};

function parseDurationDays(duration) {
  if (!duration) return 5;
  const d = String(duration).toLowerCase();
  if (d.includes("2 week")) return 14;
  if (
    d.includes("8") &&
    (d.includes("10") || d.includes("8–10") || d.includes("8-10"))
  )
    return 10;
  if (
    (d.includes("5") && d.includes("7")) ||
    d.includes("5–7") ||
    d.includes("5-7")
  )
    return 7;
  if (
    (d.includes("3") && d.includes("4")) ||
    d.includes("3–4") ||
    d.includes("3-4")
  )
    return 4;
  if (d.includes("8")) return 10;
  if (d.includes("5")) return 7;
  if (d.includes("3")) return 4;
  return 5;
}

/** Map LLM day blocks to fixed length; fill gaps from rule-based template */
function normalizeItineraryDaysFromAi(parsed, prefs) {
  const target = parseDurationDays(prefs.duration);
  const aiDays = Array.isArray(parsed?.days) ? parsed.days : [];
  const byNum = new Map();
  for (const d of aiDays) {
    const n = Number(d?.day);
    if (Number.isFinite(n) && n >= 1 && n <= target) {
      byNum.set(n, d);
    }
  }
  if (byNum.size === 0 && aiDays.length === 1 && aiDays[0]?.items?.length) {
    const only = aiDays[0];
    const n = Number(only.day);
    byNum.set(Number.isFinite(n) && n >= 1 && n <= target ? n : 1, {
      ...only,
      day: Number.isFinite(n) && n >= 1 && n <= target ? n : 1,
    });
  }

  const rule = buildRuleBasedItinerary(prefs);
  const ruleDays = rule.days || [];

  const normItems = (items) =>
    (Array.isArray(items) ? items : []).map((a) => ({
      time: a?.time || "Morning",
      activity:
        a?.activity ||
        a?.title ||
        (typeof a === "string" ? a : "") ||
        "Activity",
      duration: a?.duration || "2h",
      note: a?.note || a?.description || "",
      location: a?.location || "Morocco",
    }));

  const merged = [];
  for (let i = 1; i <= target; i++) {
    const ai = byNum.get(i);
    if (ai && Array.isArray(ai.items) && ai.items.length > 0) {
      merged.push({ day: i, items: normItems(ai.items) });
    } else {
      const rd = ruleDays[i - 1];
      merged.push({
        day: i,
        items: rd?.items?.length ? normItems(rd.items) : normItems([]),
      });
    }
  }

  const est =
    typeof parsed.estimatedTotal === "number" &&
    Number.isFinite(parsed.estimatedTotal)
      ? parsed.estimatedTotal
      : rule.estimatedTotal;
  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : rule.title;

  return {
    ...parsed,
    days: merged,
    estimatedTotal: est,
    title,
    highlights:
      Array.isArray(parsed.highlights) && parsed.highlights.length
        ? parsed.highlights
        : rule.highlights,
  };
}

function buildRuleBasedItinerary({ duration, group, budget, interests }) {
  const totalDays = parseDurationDays(duration);
  const keys = (interests || []).map((i) => INTEREST_MAP[i] || "culture");
  const uniqueKeys = [
    ...new Set(keys.length ? keys : ["culture", "food", "desert"]),
  ];

  const days = Array.from({ length: totalDays }, (_, i) => {
    const key = uniqueKeys[i % uniqueKeys.length];
    const items = BASE_DAYS[key] || BASE_DAYS.culture;
    return { day: i + 1, items };
  });

  // Ballpark trip total (€): per-week anchor by tier × (days/7). Not flights, not live hotel rates.
  const priceMap = {
    Budget: 350,
    "Mid-range": 750,
    Premium: 1500,
    Luxury: 3000,
  };
  const budgetKey =
    Object.keys(priceMap).find((k) => budget?.includes(k)) || "Mid-range";
  const estimatedTotal = priceMap[budgetKey] * (totalDays / 7);

  const highlights = uniqueKeys.slice(0, 3).map((k) => {
    const map = {
      desert: "Sahara Desert overnight",
      culture: "Ancient Fès Medina",
      food: "Marrakech food tour",
      hiking: "Atlas Mountain trek",
      surf: "Essaouira surf lesson",
      luxury: "Luxury riad experience",
      photo: "Chefchaouen blue city",
    };
    return map[k] || "Morocco highlight";
  });

  return {
    title: `${totalDays}-Day Morocco ${uniqueKeys[0].charAt(0).toUpperCase() + uniqueKeys[0].slice(1)} Journey`,
    days,
    estimatedTotal: Math.round(estimatedTotal),
    highlights,
    meta: { duration, group, budget, interests },
  };
}

// ── Chat keyword fallback ──────────────────────────────────────
const CHAT_KEYWORDS = {
  plan: {
    text: "I'd love to help you plan your Morocco trip! Tell me your travel dates, group size, and what excites you most — desert, culture, food, or adventure?",
    suggestions: ["7-day itinerary", "Best time to visit", "Budget tips"],
  },
  sahara: {
    text: "The Sahara is unmissable. I recommend 2 nights at Merzouga — arrive by sunset for the camel trek, sleep under the stars, and wake to a sunrise over the dunes. Best months: October–April.",
    suggestions: ["Book Sahara experience", "What to pack", "Getting there"],
  },
  marrakech: {
    text: "Marrakech is the perfect base. Stay in the medina for authenticity, or Guéliz for modern comfort. Must-do: Djemaa el-Fna at dusk, Majorelle Garden at dawn, and a hammam afternoon.",
    suggestions: ["Best riads", "Day trips from Marrakech", "Food guide"],
  },
  food: {
    text: "Moroccan cuisine is extraordinary. Don't miss: tagine (slow-cooked in clay), bastilla (sweet pigeon pie), harira (spiced soup), and fresh msemen for breakfast. The Fès medina has the best street food.",
    suggestions: ["Book cooking class", "Best restaurants", "Food tour"],
  },
  budget: {
    text: "Morocco is excellent value. Budget: €50–80/day (hostels, street food). Mid-range: €120–200/day (riads, restaurants). Luxury: €300+/day (5-star riads, private guides).",
    suggestions: [
      "Budget itinerary",
      "Luxury options",
      "Best value experiences",
    ],
  },
  when: {
    text: "Best times to visit: March–May (warm, green, few crowds) and September–November (perfect temperatures). Avoid July–August in the south — extreme heat. December is magical for Sahara stargazing.",
    suggestions: ["Plan my trip", "Weather by region", "Festival calendar"],
  },
  riad: {
    text: "Top riads: El Fenn (stunning rooftop pool, art collection, €200+/night), Riad Yasmine (iconic blue courtyard, €120/night), Dar Anika (authentic 16th-century, €90/night).",
    suggestions: ["Book a riad", "Riad vs hotel", "Medina neighborhoods"],
  },
  fes: {
    text: "Fès el-Bali is the world's largest car-free urban area and a UNESCO World Heritage Site. Hire a local guide (€30–50) — the medina has 9,000 streets and you will get lost without one.",
    suggestions: ["Book Fès guide", "Fès food trail", "Day trip from Fès"],
  },
};

function getRuleBasedReply(message) {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(CHAT_KEYWORDS)) {
    if (lower.includes(keyword)) return reply;
  }
  return {
    text: "That's a wonderful question about Morocco! I'd love to help you plan the perfect experience. Could you tell me more about your travel dates and what kind of experience you're looking for?",
    suggestions: ["Plan my trip", "Best experiences", "When to visit"],
  };
}

// ── OpenAI helpers ─────────────────────────────────────────────
async function callOpenAI(messages, model = CHAT_MODEL) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message?.content;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) {
    return msg
      .map((p) => (typeof p === "string" ? p : (p?.text ?? "")))
      .join("");
  }
  if (msg != null && typeof msg === "object") return JSON.stringify(msg);
  return String(msg ?? "");
}

async function callChatLLM(messages) {
  const r = resolveChatProvider();
  if (r === "none")
    throw new Error("No chat provider: set OPENAI_API_KEY or GEMINI_API_KEY");
  if (r === "openai") {
    try {
      return await callOpenAI(messages);
    } catch (e) {
      if (isOpenAIQuotaError(e) && hasGeminiKey()) {
        console.warn(
          "[ai] OpenAI quota/billing error; falling back to Gemini for this request",
        );
        const { geminiGenerateContent } = await import("./geminiProvider.js");
        return geminiGenerateContent(messages);
      }
      throw e;
    }
  }
  if (r === "gemini") {
    const { geminiGenerateContent } = await import("./geminiProvider.js");
    try {
      return await geminiGenerateContent(messages);
    } catch (e) {
      if (!isGeminiQuotaError(e)) throw e;
      if (openAiKeyPresent() && !skipOpenAIInAuto()) {
        console.warn(
          "[ai] Gemini failed (quota/rate); trying OpenAI for this request",
        );
        try {
          return await callOpenAI(messages);
        } catch (e2) {
          console.warn("[ai] OpenAI fallback failed:", e2.message);
        }
      }
      console.warn(
        "[ai] Gemini failed (quota/rate); trying Ollama for this request",
      );
      const { ollamaChat, ollamaChatModel } = await import("./llmProviders.js");
      try {
        return await ollamaChat(messages, ollamaChatModel());
      } catch (ollamaErr) {
        console.error("[ai] Ollama fallback failed:", ollamaErr.message);
        throw e;
      }
    }
  }
  const { ollamaChat, ollamaChatModel } = await import("./llmProviders.js");
  return ollamaChat(messages, ollamaChatModel());
}

// ── RAG + catalogue ───────────────────────────────────────────

export function ragDefaultSuggestions() {
  return [
    "What are the must-see places in Morocco?",
    "How much does a Morocco trip cost?",
    "What is the best time to visit?",
  ];
}

export function ragFallbackText(msg) {
  const m = String(msg || "").toLowerCase();
  if (m.includes("sahara") || m.includes("desert"))
    return "The Sahara near Merzouga is unforgettable — camel treks, dunes, and Berber camps. Browse our desert experiences on the platform for current prices and dates.";
  if (m.includes("marrakech") || m.includes("medina"))
    return "Marrakech blends medina life, riads, and Jemaa el-Fna. We list curated stays and day experiences — tell me your dates and I can point you to matches in the catalogue.";
  if (m.includes("food") || m.includes("restaurant") || m.includes("eat"))
    return "From tagine to street food in the medinas, Morocco is a feast. Check our restaurant and food experiences for bookable options with real prices.";
  return "Morocco With You lists real experiences, stays, and trips you can book. Ask about a city, budget, or style (desert, culture, surf) and I will use our catalogue when possible.";
}

export function estimateTokensFromMessages(messages) {
  const t = messages.map((m) => m.content || "").join(" ");
  return Math.min(32000, Math.max(1, Math.ceil(t.length / 4)));
}

/** Parse JSON RAG reply; on failure return raw string + default suggestions */
export function parseRagAssistantOutput(raw) {
  try {
    const parsed = JSON.parse(String(raw).trim());
    return {
      text: parsed.text != null ? String(parsed.text) : String(raw),
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
        : ragDefaultSuggestions(),
    };
  } catch {
    return { text: String(raw), suggestions: ragDefaultSuggestions() };
  }
}

/** Blended estimate (demo): ~gpt-4o-mini order of magnitude */
export function estimateCostUsdFromTokens(tokens) {
  const t = Number(tokens) || 0;
  return Math.round(t * 0.00000015 * 1e6) / 1e6;
}

export function buildContextBlock(retrievedItems) {
  if (!retrievedItems.length) {
    return "No specific catalogue items retrieved for this query.";
  }
  return `
RELEVANT MOROCCO WITH YOU CATALOGUE ITEMS:
${retrievedItems
  .map((item, i) => {
    const sim =
      item.searchMode === "hybrid" &&
      item.similarity != null &&
      Number.isFinite(Number(item.similarity))
        ? `RRF ${Number(item.similarity).toFixed(4)}`
        : item.similarity != null && Number.isFinite(Number(item.similarity))
          ? `${(Number(item.similarity) * 100).toFixed(0)}%`
          : "—";
    return `
[${i + 1}] ${String(item.item_type || "").toUpperCase()}: ${item.title || "—"}
  Location: ${item.location || item.city || "—"}
  Price: ${item.price != null ? `€${item.price}` : "on request"}
  Tags: ${(item.tags || []).join(", ")}
  Details: ${JSON.stringify(item.metadata || {})}
  Similarity: ${sim}
`;
  })
  .join("\n")}
`;
}

function defaultChatSystemPromptFromContext(contextBlock) {
  return `You are the official AI travel guide for Morocco With You,
a premium Moroccan travel platform.

${contextBlock}

INSTRUCTIONS:
- Answer in the same language the user writes in
- When relevant, mention specific items from the catalogue above
- Be specific: use prices, locations, durations from the data only — never invent numbers
- Booking / checkout: the chat cannot take payment or confirm reservations. Tell the user to use the in-app flow: after your reply they can tap "View & book" (or similar) under catalogue sources when shown, open the experience detail page, choose dates and guests, then complete checkout on Morocco With You. Never claim the chat processed a booking.
- Keep responses concise (2–4 sentences)
- Return ONLY valid JSON: {"text":"...","suggestions":["...","...","..."]}
- If no strong catalogue match, give helpful general Morocco advice and suggest exploring the platform`;
}

export async function resolveChatSystemPromptContent(retrievedItems) {
  const contextBlock = buildContextBlock(retrievedItems);
  const tpl = await getActivePrompt("chat_system");
  if (tpl) return renderPrompt(tpl, { catalogue_context: contextBlock });
  return defaultChatSystemPromptFromContext(contextBlock);
}

function parseGuardrailOutput(raw) {
  try {
    let s = String(raw).trim();
    const fenced = s.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
    if (fenced) s = fenced[1].trim();
    const o = JSON.parse(s);
    const safe = o.safe !== false;
    const category = String(o.category || "travel");
    const redirect =
      o.redirect != null && String(o.redirect).trim()
        ? String(o.redirect).trim()
        : null;
    return { safe, category, redirect };
  } catch {
    return { safe: true, category: "parse_error", redirect: null };
  }
}

/**
 * LLM-based scope/safety check. Fails open on errors or missing config.
 * Set GUARDRAIL_ENABLED=0 to skip.
 */
export async function checkGuardrail(userMessage) {
  const off = /^(0|false|no|off)$/i.test(
    process.env.GUARDRAIL_ENABLED?.trim() || "",
  );
  if (off) return { safe: true, category: "travel", redirect: null };

  if (resolveChatProvider() === "none") {
    return { safe: true, category: "travel", redirect: null };
  }

  const tpl = await getActivePrompt("guardrail");
  if (!tpl) return { safe: true, category: "travel", redirect: null };

  const prompt = renderPrompt(tpl, {
    user_message: String(userMessage).slice(0, 4000),
  });

  try {
    const messages = [
      {
        role: "system",
        content:
          "Respond with a single JSON object only. No markdown fences, no extra text.",
      },
      { role: "user", content: prompt },
    ];
    const raw = await callChatLLM(messages);
    return parseGuardrailOutput(raw);
  } catch (e) {
    console.warn("[guardrail] fail-open:", e.message);
    return { safe: true, category: "unknown", redirect: null };
  }
}

/**
 * Shared RAG message list for chat (non-stream and stream endpoints).
 * @param {{ userMessage: string, chatHistory?: {role:string,content:string}[], retrievedItems: unknown[], systemPromptContent?: string }} p
 */
export function buildRagChatMessages({
  userMessage,
  chatHistory = [],
  retrievedItems = [],
  systemPromptContent,
}) {
  const contextBlock = buildContextBlock(retrievedItems);
  const systemPrompt =
    systemPromptContent ?? defaultChatSystemPromptFromContext(contextBlock);

  const trimmedHistory = chatHistory
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...trimmedHistory,
    { role: "user", content: userMessage },
  ];
  const retrievalMode = retrievedItems.length
    ? retrievedItems[0]?.searchMode || "vector"
    : "none";
  return { messages, retrievalMode };
}

export async function buildRagChatMessagesAsync({
  userMessage,
  chatHistory = [],
  retrievedItems = [],
}) {
  const systemPromptContent =
    await resolveChatSystemPromptContent(retrievedItems);
  return buildRagChatMessages({
    userMessage,
    chatHistory,
    retrievedItems,
    systemPromptContent,
  });
}

/**
 * Stream completion: Gemini streams; other providers send one chunk (full text).
 * @param {{ role: string, content: string }[]} messages
 * @param {(ev: { type: string, content?: string }) => void} onDelta
 * @returns {Promise<string>} full model output
 */
export async function streamChatCompletion(messages, onDelta) {
  const r = resolveChatProvider();
  if (r === "gemini") {
    const { geminiGenerateContentStream } = await import("./geminiProvider.js");
    let full = "";
    for await (const chunk of geminiGenerateContentStream(messages)) {
      full += chunk;
      onDelta({ type: "delta", content: chunk });
    }
    return full;
  }
  const full = await callChatLLM(messages);
  onDelta({ type: "delta", content: full });
  return full;
}

/**
 * RAG chat: hybrid retrieval (vector + FTS + RRF) when available, else keyword/vector fallback.
 */
export async function generateRAGChatReply({
  userMessage,
  chatHistory = [],
  userId,
  sessionId,
}) {
  const startTime = Date.now();

  let guard;
  try {
    guard = await checkGuardrail(userMessage);
  } catch {
    guard = { safe: true, category: "travel", redirect: null };
  }

  if (!guard.safe) {
    const latencyMs = Date.now() - startTime;
    const text =
      guard.redirect?.trim() ||
      "I can only help with Morocco travel and using Morocco With You. Ask about trips, places, or bookings on the platform.";
    if (userId) {
      await supabase
        .from("ai_logs")
        .insert({
          user_id: userId,
          feature: "chat",
          prompt: String(userMessage).slice(0, 500),
          status: "blocked",
          model: "guardrail",
          retrieval_mode: "guardrail_blocked",
          items_retrieved: 0,
          tokens_used: 0,
          latency_ms: latencyMs,
          error_msg: `guardrail:${guard.category}`,
        })
        .catch(() => {});
    }
    return {
      text,
      suggestions: ragDefaultSuggestions(),
      retrievedItems: [],
      retrievalMode: "guardrail_blocked",
      tokensUsed: 0,
      latencyMs,
      modelUsed: "guardrail",
      blocked: true,
      guardCategory: guard.category,
    };
  }

  let retrievedItems = [];
  let retrievalMode = "none";

  try {
    retrievedItems = await hybridSearch({
      query: userMessage,
      limit: 6,
      vectorWeight: 0.65,
      keywordWeight: 0.35,
    });
    retrievalMode = retrievedItems.length
      ? retrievedItems[0]?.searchMode || "hybrid"
      : "none";
  } catch (err) {
    console.error("[RAG] Retrieval failed:", err.message);
  }

  const systemPromptContent =
    await resolveChatSystemPromptContent(retrievedItems);
  const { messages, retrievalMode: rm } = buildRagChatMessages({
    userMessage,
    chatHistory,
    retrievedItems,
    systemPromptContent,
  });
  retrievalMode = rm;

  let text = "";
  let suggestions = ragDefaultSuggestions();
  let tokensUsed = estimateTokensFromMessages(messages);
  let llmError = null;

  if (resolveChatProvider() !== "none") {
    try {
      const raw = await callChatLLM(messages);
      tokensUsed =
        estimateTokensFromMessages(messages) +
        Math.ceil(String(raw).length / 4);
      const parsed = parseRagAssistantOutput(raw);
      text = parsed.text;
      suggestions = parsed.suggestions;
    } catch (err) {
      console.error("[RAG] LLM failed:", err.message);
      llmError = String(err.message || err);
      text = ragFallbackText(userMessage);
      suggestions = ragDefaultSuggestions();
    }
  } else {
    text = ragFallbackText(userMessage);
  }

  const latencyMs = Date.now() - startTime;
  const modelUsed = activeChatModelForLogging();
  const costUsd = estimateCostUsdFromTokens(tokensUsed);

  if (userId) {
    const { error: logErr } = await supabase.from("ai_logs").insert({
      user_id: userId,
      feature: "chat",
      prompt: String(userMessage).slice(0, 500),
      tokens_used: tokensUsed,
      status: llmError ? "error" : "success",
      model: modelUsed || "rag-chat",
      output_ref: sessionId || null,
      latency_ms: latencyMs,
      retrieval_mode: retrievalMode,
      items_retrieved: retrievedItems.length,
      cost_usd: costUsd,
      error_msg: llmError,
    });
    if (logErr) console.error("[LOG] ai_logs:", logErr.message);
  }

  return {
    text,
    suggestions,
    retrievedItems,
    retrievalMode,
    tokensUsed,
    latencyMs,
    modelUsed,
  };
}

function itinerarySearchQuery(duration, budget, interests) {
  const i = (interests || []).join(" ");
  return `${i} Morocco travel ${duration || ""} ${budget || ""}`.trim();
}

/** Deep-clone via JSON; if that fails (non-serializable graph), fall back to rule-based plan. */
export function ensureStorableItinerary(content, prefs) {
  try {
    return JSON.parse(JSON.stringify(content));
  } catch {
    return buildRuleBasedItinerary(prefs);
  }
}

export async function generateItinerary({
  duration,
  group,
  budget,
  interests,
  userId = null,
}) {
  const interestsList = interests || [];
  const searchQuery = itinerarySearchQuery(duration, budget, interestsList);

  let catalogueItems = [];
  try {
    catalogueItems = await hybridSearch({
      query: searchQuery,
      limit: 15,
      vectorWeight: 0.6,
      keywordWeight: 0.4,
    });
  } catch (err) {
    console.error("[ITINERARY] Retrieval failed:", err.message);
  }

  const catalogueContext =
    catalogueItems.length > 0
      ? `
AVAILABLE REAL CATALOGUE ITEMS (prefer these when they fit the traveller):
${catalogueItems
  .map(
    (item) => `
- [${item.item_type}] ${item.title}
  Location: ${item.city || item.location || "—"}
  Price: ${item.price != null ? `€${item.price}` : "on request"}
  Tags: ${(item.tags || []).join(", ")}
`,
  )
  .join("")}
`
      : "";

  if (resolveChatProvider() === "none") {
    const base = buildRuleBasedItinerary({
      duration,
      group,
      budget,
      interests: interestsList,
    });
    if (catalogueItems.length) base.catalogueItems = catalogueItems;
    return base;
  }

  const totalDaysForTrip = parseDurationDays(duration);
  const itinStart = Date.now();
  const systemPrompt = `You are a Moroccan travel expert. Return ONLY valid JSON — no markdown, no code fences.
Schema (use camelCase estimatedTotal):
{
  "title": "string",
  "days": [
    {
      "day": 1,
      "items": [
        { "time": "Morning|Afternoon|Evening", "activity": "string", "duration": "string", "note": "string", "location": "string" }
      ]
    }
  ],
  "estimatedTotal": 1200,
  "highlights": ["string"]
}

CRITICAL: "days" must contain exactly ${totalDaysForTrip} objects, with "day" equal to 1, 2, …, ${totalDaysForTrip} in order — one entry per calendar day. Never return only the last day or a random subset.`;

  const userPrompt = `Create a Morocco itinerary for ${group}.
Trip length: ${duration} → you MUST output exactly ${totalDaysForTrip} full days in "days" (day 1 through day ${totalDaysForTrip}).
Budget: ${budget}.
Interests: ${interestsList.join(", ")}.
Each day must include 3 items (morning, afternoon, evening). Reference catalogue items by name when you use them.
${catalogueContext}`;

  try {
    let raw = await callChatLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    raw = String(raw).trim();
    const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
    if (fenced) raw = fenced[1].trim();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return buildRuleBasedItinerary({
        duration,
        group,
        budget,
        interests: interestsList,
      });
    }
    if (parsed.estimated_total != null && parsed.estimatedTotal == null) {
      parsed.estimatedTotal = parsed.estimated_total;
    }
    parsed.meta = { duration, group, budget, interests: interestsList };
    if (catalogueItems.length) parsed.catalogueItems = catalogueItems;

    const fixed = normalizeItineraryDaysFromAi(parsed, {
      duration,
      group,
      budget,
      interests: interestsList,
    });
    Object.assign(parsed, fixed);

    if (userId) {
      const tok =
        estimateTokensFromMessages([
          { content: systemPrompt },
          { content: userPrompt },
        ]) + Math.ceil(String(raw).length / 4);
      const { error: logErr } = await supabase.from("ai_logs").insert({
        user_id: userId,
        feature: "itinerary",
        prompt: `Itinerary: ${duration}, ${group}, ${budget}`,
        tokens_used: tok,
        status: "success",
        model: activeChatModelForLogging() || "itinerary",
        latency_ms: Date.now() - itinStart,
        retrieval_mode:
          catalogueItems[0]?.searchMode ||
          (catalogueItems.length ? "vector" : "none"),
        items_retrieved: catalogueItems.length,
        cost_usd: estimateCostUsdFromTokens(tok),
      });
      if (logErr) console.error("[LOG] ai_logs itinerary:", logErr.message);
    }
    return parsed;
  } catch (err) {
    console.error("[ITINERARY] Generation failed:", err.message);
    if (userId) {
      const { error: logErr } = await supabase.from("ai_logs").insert({
        user_id: userId,
        feature: "itinerary",
        prompt: `Itinerary: ${duration}, ${group}, ${budget}`,
        status: "error",
        model: activeChatModelForLogging() || "itinerary",
        latency_ms: Date.now() - itinStart,
        error_msg: String(err.message || err),
        items_retrieved: catalogueItems.length,
        retrieval_mode:
          catalogueItems[0]?.searchMode ||
          (catalogueItems.length ? "vector" : "none"),
      });
      if (logErr) console.error("[LOG] ai_logs itinerary:", logErr.message);
    }
    const base = buildRuleBasedItinerary({
      duration,
      group,
      budget,
      interests: interestsList,
    });
    if (catalogueItems.length) base.catalogueItems = catalogueItems;
    return base;
  }
}

export async function generateRecommendations({ userId, limit = 6 }) {
  const lim = Math.min(20, Math.max(1, Number(limit) || 6));
  try {
    const { data: cached } = await supabase
      .from("user_recommendations")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("score", { ascending: false })
      .limit(lim);

    if (cached?.length >= 3) {
      const ids = cached.map((c) => c.item_id).filter(Boolean);
      const { data: emb } = await supabase
        .from("catalogue_embeddings")
        .select("*")
        .in("item_id", ids);
      const byId = Object.fromEntries((emb || []).map((r) => [r.item_id, r]));
      const recommendations = cached
        .map((c) => {
          const row = byId[c.item_id];
          if (!row) return null;
          return {
            item_id: row.item_id,
            item_type: row.item_type,
            title: row.title,
            location: row.location,
            city: row.city,
            price: row.price,
            gradient: row.gradient,
            tags: row.tags,
            metadata: row.metadata,
            similarity: c.score != null ? Number(c.score) : null,
            reason: c.reason,
          };
        })
        .filter(Boolean);
      if (recommendations.length >= 3) {
        return { recommendations, source: "cache" };
      }
    }

    const { data: bookings } = await supabase
      .from("bookings")
      .select("experiences(title, tags)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .limit(10);

    const { data: saved } = await supabase
      .from("saved_experiences")
      .select("experiences(title, tags)")
      .eq("user_id", userId)
      .limit(10);

    const history = [
      ...(bookings || []).flatMap((b) => [
        b.experiences?.title,
        ...(b.experiences?.tags || []).map(String),
      ]),
      ...(saved || []).flatMap((s) => [
        s.experiences?.title,
        ...(s.experiences?.tags || []).map(String),
      ]),
    ].filter(Boolean);

    if (!history.length || !canUseSemanticSearch()) {
      const { data: featured } = await supabase
        .from("experiences")
        .select("*")
        .eq("is_active", true)
        .eq("featured", true)
        .limit(lim);
      let rows = featured || [];
      if (!rows.length) {
        const { data: top } = await supabase
          .from("experiences")
          .select("*")
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(lim);
        rows = top || [];
      }
      const recommendations = rows.map((e) => ({
        item_id: e.id,
        item_type: "experience",
        title: e.title,
        location: e.location,
        city: e.route || "",
        price: e.price,
        gradient: e.gradient,
        tags: e.tags,
        metadata: {
          rating: e.rating,
          review_count: e.review_count,
          duration: e.duration,
          featured: e.featured,
        },
        similarity: null,
      }));
      return { recommendations, source: "featured" };
    }

    const preferenceQuery = `Morocco travel: ${history.slice(0, 12).join(", ")}`;
    const results = await hybridSearch({
      query: preferenceQuery,
      limit: lim * 2,
      vectorWeight: 0.65,
      keywordWeight: 0.35,
    });

    if (results.length > 0) {
      const recs = results.slice(0, lim).map((r) => ({
        user_id: userId,
        item_id: r.item_id,
        item_type: r.item_type,
        score: r.similarity,
        reason: `Based on your interest in ${history.slice(0, 3).join(", ")}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));
      await supabase
        .from("user_recommendations")
        .delete()
        .eq("user_id", userId);
      await supabase.from("user_recommendations").insert(recs);
    }

    return {
      recommendations: results.slice(0, lim),
      source: results[0]?.searchMode || "vector",
    };
  } catch (err) {
    console.error("[RECS] Failed:", err.message);
    return { recommendations: [], source: "error" };
  }
}

/** Admin: AI draft from planning_requests row (uses same LLM stack as chat). */
export async function suggestItineraryForRequest({ request }) {
  if (resolveChatProvider() === "none") {
    return {
      error: "Configure GEMINI_API_KEY or OPENAI_API_KEY for AI suggestions",
    };
  }

  const {
    duration_days,
    cities,
    budget_range,
    interests,
    group_size,
    group_type,
    start_date,
    end_date,
  } = request || {};

  const searchQuery = [
    ...(interests || []),
    ...(cities || []),
    budget_range,
    group_type,
  ]
    .filter(Boolean)
    .join(" ");

  let catalogueItems = [];
  if (searchQuery.trim()) {
    try {
      catalogueItems = await hybridSearch({
        query: searchQuery,
        limit: 20,
        vectorWeight: 0.6,
        keywordWeight: 0.4,
      });
    } catch (e) {
      console.error("[ADMIN RAG]", e.message);
    }
  }

  const days =
    duration_days ||
    (start_date && end_date
      ? Math.max(
          1,
          Math.ceil(
            (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24),
          ),
        )
      : 7);

  const catBlock =
    catalogueItems.length > 0
      ? catalogueItems
          .map(
            (item) => `
- [${item.item_type}] ${item.title}
  City: ${item.city || item.location}
  Price: ${item.price != null ? `€${item.price}` : "ask"}
  Tags: ${(item.tags || []).join(", ")}
`,
          )
          .join("")
      : "(none)";

  const prompt = `You are a Moroccan travel expert building a custom itinerary for a client.

CLIENT REQUEST:
- Duration: ${days} days
- Dates: ${start_date || "TBD"} → ${end_date || "TBD"}
- Group: ${group_size} people, ${group_type || "—"}
- Cities: ${(cities || []).join(", ")}
- Budget: ${budget_range}
- Interests: ${(interests || []).join(", ")}

CATALOGUE ITEMS (prefer these):
${catBlock}

Return ONLY valid JSON:
{
  "days": [{"day":1,"title":"string","activities":["..."],"services":[{"title":"string","price":0,"item_type":"experience"}]}],
  "estimated_cost": 0,
  "notes": "string"
}`;

  const llmMessages = [
    {
      role: "system",
      content: "You are a Moroccan travel expert. Return only valid JSON.",
    },
    { role: "user", content: prompt },
  ];
  try {
    const raw = await callChatLLM(llmMessages);
    const tokens_used =
      estimateTokensFromMessages(llmMessages) +
      Math.ceil(String(raw).length / 4);
    const parsed = JSON.parse(String(raw).trim());
    const servicesCost = (parsed.days || [])
      .flatMap((d) => d.services || [])
      .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    return {
      ...parsed,
      services_cost: servicesCost || parsed.estimated_cost,
      catalogue_items: catalogueItems,
      tokens_used,
    };
  } catch (e) {
    return { error: e.message || "AI suggestion failed", tokens_used: 0 };
  }
}

export async function generateChatReply(userMessage, history = []) {
  const r = await generateRAGChatReply({
    userMessage,
    chatHistory: history,
    userId: null,
    sessionId: null,
  });
  return {
    text: r.text,
    suggestions: r.suggestions,
    model_used: r.modelUsed,
  };
}
