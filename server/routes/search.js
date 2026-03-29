import express from 'express';
import { supabase } from '../services/supabase.js';
import { hybridSearch, canUseSemanticSearch } from '../services/embeddings.js';

const router = express.Router();

function mapExperienceRows(data) {
  return (data || []).map((e) => ({
    item_id: e.id,
    item_type: 'experience',
    title: e.title,
    location: e.location,
    city: e.route || '',
    price: e.price,
    gradient: e.gradient,
    tags: e.tags,
    metadata: {
      rating: e.rating,
      review_count: e.review_count,
      duration: e.duration,
      max_group: e.max_group,
      featured: e.featured,
    },
    similarity: null,
  }));
}

/** Keyword fallback when OpenAI is missing or returns 429 / rate limits (only experiences). */
async function ilikeExperienceSearch(q, limit) {
  const safe = q.replace(/[%_,]/g, ' ').trim();
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${safe}%,location.ilike.%${safe}%,description.ilike.%${safe}%`)
    .limit(limit);
  if (error) throw error;
  return mapExperienceRows(data);
}

function isOpenAIQuotaOrRateError(err) {
  const msg = String(err?.message || err || '');
  return /429|quota|insufficient[_\s]quota|rate\s*limit|too\s+many\s+requests/i.test(msg);
}

function isEmbeddingFallbackError(err) {
  const msg = String(err?.message || err || '');
  return (
    isOpenAIQuotaOrRateError(err) ||
    /ECONNREFUSED|fetch failed|Ollama embed|RESOURCE_EXHAUSTED|Gemini embed|network|ENOTFOUND/i.test(
      msg
    )
  );
}

// GET /api/search?q=...&type=experience&limit=6 (hybrid vector+FTS; threshold query param unused)
router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const type = req.query.type ? String(req.query.type).trim() : null;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 6));
    const experienceOnlyFallback = !type || type === 'experience';

    if (q.length < 2) {
      return res.status(400).json({ error: 'Query required (min 2 chars)' });
    }

    if (!canUseSemanticSearch()) {
      const results = await ilikeExperienceSearch(q, limit);
      return res.json({ results, mode: 'ilike', query: q });
    }

    try {
      const results = await hybridSearch({
        query: q,
        filterType: type,
        limit,
        vectorWeight: 0.65,
        keywordWeight: 0.35,
      });
      const mode =
        results[0]?.searchMode === 'hybrid'
          ? 'hybrid'
          : results[0]?.searchMode || 'semantic';
      return res.json({ results, mode, query: q });
    } catch (semErr) {
      if (experienceOnlyFallback && isEmbeddingFallbackError(semErr)) {
        console.warn('Search: embedding provider failed, using ilike fallback:', semErr.message);
        const results = await ilikeExperienceSearch(q, limit);
        return res.json({
          results,
          mode: 'ilike',
          query: q,
          notice:
            'Semantic search skipped (API quota, rate limit, or local Ollama unreachable). Using keyword search on experiences.',
        });
      }
      throw semErr;
    }
  } catch (err) {
    console.error('Search error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
