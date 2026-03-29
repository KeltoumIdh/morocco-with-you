import crypto from 'crypto';
import OpenAI from 'openai';
import { supabase } from './supabase.js';
import { ollamaEmbed } from './llmProviders.js';
import { geminiEmbed, geminiApiKey } from './geminiProvider.js';

let openaiClient = null;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';

function openAiKeyPresent() {
  return !!process.env.OPENAI_API_KEY?.trim();
}

/** When true, auto mode skips OpenAI (e.g. quota 429) and uses Gemini/Ollama. */
function skipOpenAIInAuto() {
  return /^(1|true|yes)$/i.test(process.env.SKIP_OPENAI?.trim() || '');
}

/** openai | gemini | ollama | auto — auto: OpenAI → Gemini → Ollama */
function embeddingProviderMode() {
  return (process.env.AI_EMBEDDING_PROVIDER || 'auto').trim().toLowerCase();
}

export function useOpenAIEmbeddings() {
  const m = embeddingProviderMode();
  if (m === 'ollama' || m === 'gemini') return false;
  if (!openAiKeyPresent()) return false;
  if (m === 'openai') return true;
  if (skipOpenAIInAuto()) return false;
  return true;
}

export function useGeminiEmbeddings() {
  const m = embeddingProviderMode();
  if (m === 'openai' || m === 'ollama') return false;
  if (m === 'gemini') return !!geminiApiKey();
  if (openAiKeyPresent() && !skipOpenAIInAuto()) return false;
  return !!geminiApiKey();
}

export function useOllamaEmbeddings() {
  const m = embeddingProviderMode();
  if (m === 'openai' || m === 'gemini') return false;
  if (m === 'ollama') return true;
  if (openAiKeyPresent() && !skipOpenAIInAuto()) return false;
  if (geminiApiKey()) return false;
  return true;
}

export function canUseSemanticSearch() {
  return (
    useOpenAIEmbeddings() ||
    useGeminiEmbeddings() ||
    useOllamaEmbeddings()
  );
}

function isOpenAIQuotaError(err) {
  const msg = String(err?.message || err || '');
  return /429|quota|insufficient[_\s]quota|billing/i.test(msg);
}

/** @param {{ forQuery?: boolean }} [opts] Gemini uses RETRIEVAL_QUERY vs RETRIEVAL_DOCUMENT */
async function vectorFromText(text, opts = {}) {
  if (useOpenAIEmbeddings()) {
    const client = getOpenAI();
    if (!client) throw new Error('OPENAI_API_KEY is not set');
    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: String(text).slice(0, 8000),
      });
      return response.data[0].embedding;
    } catch (e) {
      if (isOpenAIQuotaError(e) && geminiApiKey()) {
        console.warn(
          '[embed] OpenAI quota/billing error; using Gemini for this embedding (768-dim DB only)'
        );
        return geminiEmbed(String(text).slice(0, 8000), {
          taskType: opts.forQuery ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
        });
      }
      throw e;
    }
  }
  if (useGeminiEmbeddings()) {
    return geminiEmbed(String(text).slice(0, 8000), {
      taskType: opts.forQuery ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
    });
  }
  if (useOllamaEmbeddings()) {
    return ollamaEmbed(text);
  }
  throw new Error(
    'No embedding provider: OPENAI_API_KEY, GEMINI_API_KEY (AI Studio), or Ollama — see server/.env.example'
  );
}

export function contentHash(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

/** PostgREST / pgvector string form */
export function formatVectorForPg(embedding) {
  if (!Array.isArray(embedding)) return '[]';
  return `[${embedding.join(',')}]`;
}

function groupTripDurationDays(item) {
  if (item.duration_days != null) return item.duration_days;
  if (item.start_date && item.end_date) {
    const a = new Date(item.start_date);
    const b = new Date(item.end_date);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
      return Math.max(1, Math.round((b.getTime() - a.getTime()) / (86400 * 1000)));
    }
  }
  return '';
}

export const buildItemText = (item, type) => {
  const parts = [];

  switch (type) {
    case 'experience':
      parts.push(
        item.title,
        item.description || '',
        item.location || '',
        item.route || '',
        `Price: €${item.price ?? ''}`,
        `Duration: ${item.duration || ''}`,
        `Tags: ${(item.tags || []).join(', ')}`,
        `Max group: ${item.max_group ?? ''}`
      );
      break;

    case 'activity':
      parts.push(
        item.title,
        item.description || '',
        item.location || '',
        item.city || '',
        `Duration: ${item.duration || ''}`,
        `Price: €${item.price ?? ''} ${item.price_type || 'per person'}`,
        `Category: ${item.category || ''}`,
        `Tags: ${(item.tags || []).join(', ')}`,
        `Max group: ${item.max_group ?? ''}`,
        (item.included || []).join(', ')
      );
      break;

    case 'accommodation':
      parts.push(
        item.name,
        item.description || '',
        `Type: ${item.type || ''}`,
        item.city || '',
        item.location || '',
        `Stars: ${item.stars ?? ''}`,
        `Price from: €${item.price_from ?? ''}/night`,
        `Amenities: ${(item.amenities || []).join(', ')}`,
        `Tags: ${(item.tags || []).join(', ')}`
      );
      break;

    case 'restaurant':
      parts.push(
        item.name,
        item.description || '',
        `Cuisine: ${item.cuisine || ''}`,
        item.city || '',
        item.location || '',
        `Price range: ${item.price_range || ''}`,
        `Tags: ${(item.tags || []).join(', ')}`,
        item.has_terrace ? 'Has terrace' : '',
        item.reservations ? 'Takes reservations' : ''
      );
      break;

    case 'package':
      parts.push(
        item.title,
        item.subtitle || '',
        item.description || '',
        `Duration: ${item.duration_days ?? ''} days`,
        `Cities: ${(item.cities || []).join(', ')}`,
        `Difficulty: ${item.difficulty || ''}`,
        `Price from: €${item.price_from ?? ''}`,
        `Highlights: ${(item.highlights || []).join(', ')}`,
        `Includes: ${(item.included || []).join(', ')}`,
        `Tags: ${(item.tags || []).join(', ')}`
      );
      break;

    case 'provider':
      parts.push(
        item.name,
        item.description || '',
        `Type: ${item.type || ''}`,
        item.city || '',
        `Tags: ${(item.tags || []).join(', ')}`,
        ...(item.provider_services || []).map(
          (s) => `${s.title}: ${s.description || ''}`
        )
      );
      break;

    case 'group_trip':
      parts.push(
        item.title,
        item.subtitle || '',
        item.description || '',
        `Destination: ${item.destination || ''}`,
        `Duration: ${groupTripDurationDays(item)} days`,
        `Price: €${item.price_per_person ?? ''}/person`,
        `Includes: ${(item.includes || []).join(', ')}`,
        `Tags: ${(item.tags || []).join(', ')}`
      );
      break;
    default:
      parts.push(JSON.stringify(item));
  }

  return parts.filter(Boolean).join(' | ').slice(0, 8000);
};

export const embedItem = async (item, type) => {
  if (!canUseSemanticSearch()) {
    return { skipped: true, reason: 'no_embedding_provider' };
  }
  if (!item?.id) {
    return { skipped: true, reason: 'no_id' };
  }

  const text = buildItemText(item, type);
  const hash = contentHash(text);

  const { data: existing, error: exErr } = await supabase
    .from('catalogue_embeddings')
    .select('id, content_hash')
    .eq('item_id', item.id)
    .eq('item_type', type)
    .maybeSingle();

  if (exErr) throw exErr;
  if (existing?.content_hash === hash) {
    return { skipped: true, id: existing.id };
  }

  const embedding = await vectorFromText(text);
  const vecStr = formatVectorForPg(embedding);

  const row = {
    item_id: item.id,
    item_type: type,
    content_hash: hash,
    embedding: vecStr,
    title: item.title || item.name || null,
    location: item.location || item.destination || '',
    city: item.city || '',
    price:
      item.price ??
      item.price_from ??
      item.price_per_person ??
      null,
    gradient: item.gradient || '',
    tags: item.tags || [],
    metadata: {
      rating: item.rating,
      review_count: item.review_count,
      duration: item.duration || item.duration_days || groupTripDurationDays(item),
      max_group: item.max_group || item.max_capacity,
      type: item.type,
      stars: item.stars,
      price_type: item.price_type,
      price_range: item.price_range,
      featured: item.featured,
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('catalogue_embeddings')
    .upsert(row, { onConflict: 'item_id,item_type' })
    .select()
    .single();

  if (error) throw error;
  return { upserted: true, id: data.id };
};

const TABLE_MAP = {
  experience: 'experiences',
  activity: 'activities',
  accommodation: 'accommodations',
  restaurant: 'restaurants',
  package: 'packages',
  provider: 'providers',
  group_trip: 'group_trips',
};

export const embedAllOfType = async (type) => {
  if (!canUseSemanticSearch()) {
    throw new Error(
      'No embedding provider: OPENAI_API_KEY, GEMINI_API_KEY, or local Ollama'
    );
  }

  const table = TABLE_MAP[type];
  if (!table) throw new Error(`Unknown type: ${type}`);

  let query = supabase.from(table).select(
    type === 'provider'
      ? '*, provider_services(title, description)'
      : '*'
  );

  if (type === 'provider') {
    query = query.eq('status', 'active');
  } else if (type === 'group_trip') {
    query = query.in('status', ['open', 'full', 'completed']);
  } else {
    query = query.eq('is_active', true);
  }

  const { data: items, error } = await query;
  if (error) throw error;
  if (!items?.length) return { processed: 0, skipped: 0, errors: 0 };

  const results = { processed: 0, skipped: 0, errors: 0 };
  let delayMs = 60;
  if (useOllamaEmbeddings()) {
    delayMs = Math.max(0, Number(process.env.OLLAMA_EMBED_DELAY_MS) || 0);
  } else if (useGeminiEmbeddings()) {
    const n = Number(process.env.GEMINI_EMBED_DELAY_MS);
    delayMs = Number.isFinite(n) ? Math.max(0, n) : 100;
  }

  for (const item of items) {
    try {
      const result = await embedItem(item, type);
      if (result.skipped) results.skipped++;
      else results.processed++;
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    } catch (err) {
      console.error(`Embed error [${type}:${item.id}]:`, err.message);
      results.errors++;
    }
  }

  return results;
};

/**
 * Hybrid retrieval: vector cosine + PostgreSQL full-text (weighted tsvector), fused via RRF.
 * See server/schema_hybrid_search.sql — run in Supabase after catalogue_embeddings exists.
 *
 * Why not vector-only:
 * 1. Exact names (e.g. "Riad Yasmine") can lose to generic semantic neighbors.
 * 2. RRF reduces single-signal rank bias (short snippets vs long descriptions).
 * 3. Keyword leg catches token overlap vector embeddings underweight.
 */
export async function keywordOnlySearch(query, filterType, limit) {
  const safe = String(query).replace(/[%_,]/g, ' ').trim().slice(0, 200);
  if (!safe) return [];

  const pattern = `%${safe}%`;
  let q = supabase
    .from('catalogue_embeddings')
    .select(
      'item_id,item_type,title,location,city,price,gradient,tags,metadata'
    )
    .limit(Math.min(50, Math.max(1, Number(limit) || 10)));

  if (filterType) q = q.eq('item_type', filterType);
  q = q.or(
    `title.ilike.${pattern},location.ilike.${pattern},city.ilike.${pattern}`
  );

  const { data, error } = await q;
  if (error) {
    console.error('[keywordOnlySearch]', error.message);
    return [];
  }
  return (data || []).map((item) => ({
    ...item,
    similarity: 0.5,
    searchMode: 'keyword',
  }));
}

export const hybridSearch = async ({
  query,
  filterType = null,
  limit = 10,
  vectorWeight = 0.7,
  keywordWeight = 0.3,
} = {}) => {
  const q = String(query ?? '').slice(0, 8000);
  if (!q.trim()) return [];

  if (!canUseSemanticSearch()) {
    return keywordOnlySearch(q, filterType, limit);
  }

  let queryEmbedding;
  try {
    queryEmbedding = await vectorFromText(q, { forQuery: true });
  } catch (e) {
    console.warn('[HYBRID] embed failed, keyword fallback:', e.message);
    return keywordOnlySearch(q, filterType, limit);
  }

  const vecStr = formatVectorForPg(queryEmbedding);
  const rpcName =
    Array.isArray(queryEmbedding) && queryEmbedding.length === 768
      ? 'hybrid_search_768'
      : 'hybrid_search';

  const { data, error } = await supabase.rpc(rpcName, {
    query_text: q,
    query_embedding: vecStr,
    match_count: Math.min(50, Math.max(1, Number(limit) || 10)),
    vector_weight: Number(vectorWeight),
    keyword_weight: Number(keywordWeight),
    filter_type: filterType || null,
    rrf_k: 60,
  });

  if (error) {
    console.error('[HYBRID SEARCH] RPC error:', error.message);
    try {
      return await semanticSearch({
        query: q,
        filterType,
        threshold: 0.5,
        limit,
      });
    } catch (e2) {
      console.error('[HYBRID] vector fallback failed:', e2.message);
      return keywordOnlySearch(q, filterType, limit);
    }
  }

  return (data || []).map((item) => ({
    ...item,
    similarity: item.score != null ? Number(item.score) : null,
    searchMode: 'hybrid',
  }));
};

export const semanticSearch = async ({
  query,
  filterType = null,
  threshold = 0.7,
  limit = 10,
}) => {
  const queryEmbedding = await vectorFromText(String(query).slice(0, 8000), {
    forQuery: true,
  });
  const vecStr = formatVectorForPg(queryEmbedding);

  const { data, error } = await supabase.rpc('match_catalogue', {
    query_embedding: vecStr,
    match_threshold: Number(threshold),
    match_count: Number(limit),
    filter_type: filterType || null,
  });

  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    searchMode: 'vector',
  }));
};

export const embedText = async (text) => {
  return vectorFromText(String(text).slice(0, 8000));
};

/** Fire-and-forget embedding refresh after admin CRUD */
export function scheduleEmbedCatalogue(row, type) {
  if (!row?.id) return;
  embedItem(row, type).catch((err) =>
    console.error(`[EMBED] ${type} ${row.id}:`, err.message)
  );
}

export async function embedProviderById(providerId) {
  if (!providerId) return;
  const { data, error } = await supabase
    .from('providers')
    .select('*, provider_services(title, description)')
    .eq('id', providerId)
    .maybeSingle();
  if (error || !data) return;
  await embedItem(data, 'provider');
}

export function scheduleEmbedProvider(providerId) {
  embedProviderById(providerId).catch((err) =>
    console.error('[EMBED] provider', providerId, err.message)
  );
}
