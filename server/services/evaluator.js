/**
 * RAG retrieval evaluation: Precision@K, Recall@K, MRR, NDCG@K.
 * Ground truth: eval_queries.expected_item_ids (strict) or expected_types (type match + corpus recall).
 */
import { supabase } from './supabase.js';
import {
  hybridSearch,
  semanticSearch,
  keywordOnlySearch,
} from './embeddings.js';

function embeddingModelLabel() {
  const m = (process.env.AI_EMBEDDING_PROVIDER || 'auto').trim().toLowerCase();
  if (m === 'ollama')
    return (
      process.env.OLLAMA_EMBED_MODEL?.trim() ||
      'nomic-embed-text'
    );
  if (m === 'gemini')
    return (
      process.env.GEMINI_EMBED_MODEL?.trim() || 'gemini-embedding-001'
    );
  return (
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small'
  );
}

const precisionAtK = (retrievedIds, relevantSet, k) => {
  const topK = retrievedIds.slice(0, k);
  const hits = topK.filter((id) => relevantSet.has(String(id))).length;
  return k > 0 ? hits / k : 0;
};

const recallAtK = (retrievedIds, relevantSet, k, corpusRelevantSize) => {
  if (corpusRelevantSize <= 0) return 0;
  const topK = retrievedIds.slice(0, k);
  const hits = topK.filter((id) => relevantSet.has(String(id))).length;
  return Math.min(1, hits / corpusRelevantSize);
};

const reciprocalRankFromBinary = (binaryRelevance) => {
  for (let i = 0; i < binaryRelevance.length; i++) {
    if (binaryRelevance[i]) return 1 / (i + 1);
  }
  return 0;
};

const dcgAtK = (binaryRelevance, k) =>
  binaryRelevance.slice(0, k).reduce((sum, rel, i) => {
    return sum + (rel ? 1 / Math.log2(i + 2) : 0);
  }, 0);

const ndcgAtK = (binaryRelevance, k, corpusRelevantSize) => {
  const dcgScore = dcgAtK(binaryRelevance, k);
  const idealLen = Math.min(k, Math.max(0, corpusRelevantSize));
  const idealRel = Array.from({ length: k }, (_, i) => (i < idealLen ? 1 : 0));
  const idealDcg = dcgAtK(idealRel, k);
  return idealDcg > 0 ? dcgScore / idealDcg : 0;
};

async function countCorpusByTypes(types) {
  if (!types?.length) return 0;
  const { count, error } = await supabase
    .from('catalogue_embeddings')
    .select('item_id', { count: 'exact', head: true })
    .in('item_type', types);
  if (error) {
    console.warn('[eval] corpus count:', error.message);
    return 0;
  }
  return count ?? 0;
}

function binaryRelevanceForIds(retrieved, relevantSet) {
  return retrieved.map((id) => relevantSet.has(String(id)));
}

function binaryRelevanceForTypes(retrievedRows, expectedTypes) {
  const types = expectedTypes || [];
  return retrievedRows.map((r) => types.includes(r.item_type));
}

/**
 * @param {object} p
 * @param {string} p.runName
 * @param {'hybrid'|'vector'|'keyword'} [p.searchMode]
 * @param {number} [p.k]
 * @param {number} [p.vectorWeight]
 * @param {number} [p.keywordWeight]
 * @param {number} [p.threshold]
 * @param {string} [p.embeddingModel]
 */
export async function runEvaluation({
  runName,
  searchMode = 'hybrid',
  k = 5,
  vectorWeight = 0.7,
  keywordWeight = 0.3,
  threshold = 0.6,
  embeddingModel,
} = {}) {
  const kk = Math.min(50, Math.max(1, Number(k) || 5));
  const limitRetrieve = kk * 2;

  console.log(`\n[eval] Starting run: ${runName}`);
  console.log(
    `      mode=${searchMode} K=${kk} vectorWeight=${vectorWeight} keywordWeight=${keywordWeight}`
  );

  const { data: run, error: runErr } = await supabase
    .from('eval_runs')
    .insert({
      run_name: runName,
      search_mode: searchMode,
      embedding_model:
        embeddingModel || embeddingModelLabel(),
      vector_weight: vectorWeight,
      keyword_weight: keywordWeight,
      threshold,
      k: kk,
    })
    .select()
    .single();

  if (runErr) throw runErr;

  const { data: queries, error: qErr } = await supabase
    .from('eval_queries')
    .select('*')
    .order('created_at', { ascending: true });

  if (qErr) throw qErr;
  if (!queries?.length) {
    throw new Error(
      'No eval_queries rows. Run server/schema_eval_retrieval.sql in Supabase.'
    );
  }

  const results = [];
  const allMetrics = { precision: [], recall: [], mrr: [], ndcg: [] };

  for (const query of queries) {
    const startTime = Date.now();
    let retrieved = [];

    try {
      if (searchMode === 'hybrid') {
        retrieved = await hybridSearch({
          query: query.query,
          limit: limitRetrieve,
          vectorWeight,
          keywordWeight,
        });
      } else if (searchMode === 'vector') {
        retrieved = await semanticSearch({
          query: query.query,
          threshold,
          limit: limitRetrieve,
        });
      } else if (searchMode === 'keyword') {
        retrieved = await keywordOnlySearch(
          query.query,
          null,
          limitRetrieve
        );
      }
    } catch (err) {
      console.error(`  [eval] query failed [${query.id}]:`, err.message);
    }

    const latencyMs = Date.now() - startTime;
    const retrievedIds = retrieved.map((r) => r.item_id);

    const uuidList = (query.expected_item_ids || []).filter(Boolean);
    let binaryRel;
    let corpusRelevantSize;

    if (uuidList.length > 0) {
      const relevantSet = new Set(uuidList.map(String));
      binaryRel = binaryRelevanceForIds(retrievedIds, relevantSet);
      corpusRelevantSize = uuidList.length;
      const p = precisionAtK(retrievedIds, relevantSet, kk);
      const r = recallAtK(retrievedIds, relevantSet, kk, corpusRelevantSize);
      const rr = reciprocalRankFromBinary(binaryRel);
      const ng = ndcgAtK(binaryRel, kk, corpusRelevantSize);
      allMetrics.precision.push(p);
      allMetrics.recall.push(r);
      allMetrics.mrr.push(rr);
      allMetrics.ndcg.push(ng);
      results.push({
        run_id: run.id,
        query_id: query.id,
        retrieved_ids: retrievedIds.slice(0, kk),
        retrieved_types: retrieved.slice(0, kk).map((r) => r.item_type),
        precision_at_k: p,
        recall_at_k: r,
        reciprocal_rank: rr,
        ndcg_at_k: ng,
        latency_ms: latencyMs,
      });
    } else if (query.expected_types?.length) {
      corpusRelevantSize = await countCorpusByTypes(query.expected_types);
      binaryRel = binaryRelevanceForTypes(retrieved, query.expected_types);
      const hitsInTopK = binaryRel.slice(0, kk).filter(Boolean).length;
      const p = kk > 0 ? hitsInTopK / kk : 0;
      const r =
        corpusRelevantSize > 0
          ? Math.min(1, hitsInTopK / corpusRelevantSize)
          : 0;
      const rr = reciprocalRankFromBinary(binaryRel);
      const ng = ndcgAtK(binaryRel, kk, corpusRelevantSize);
      allMetrics.precision.push(p);
      allMetrics.recall.push(r);
      allMetrics.mrr.push(rr);
      allMetrics.ndcg.push(ng);
      results.push({
        run_id: run.id,
        query_id: query.id,
        retrieved_ids: retrievedIds.slice(0, kk),
        retrieved_types: retrieved.slice(0, kk).map((r) => r.item_type),
        precision_at_k: p,
        recall_at_k: r,
        reciprocal_rank: rr,
        ndcg_at_k: ng,
        latency_ms: latencyMs,
      });
    } else {
      results.push({
        run_id: run.id,
        query_id: query.id,
        retrieved_ids: retrievedIds.slice(0, kk),
        retrieved_types: retrieved.slice(0, kk).map((r) => r.item_type),
        precision_at_k: 0,
        recall_at_k: 0,
        reciprocal_rank: 0,
        ndcg_at_k: 0,
        latency_ms: latencyMs,
      });
      allMetrics.precision.push(0);
      allMetrics.recall.push(0);
      allMetrics.mrr.push(0);
      allMetrics.ndcg.push(0);
    }

    const last = results[results.length - 1];
    console.log(
      `  [${query.difficulty}] "${String(query.query).slice(0, 48)}..." ` +
        `P@${kk}=${Number(last.precision_at_k).toFixed(3)} ` +
        `R@${kk}=${Number(last.recall_at_k).toFixed(3)} ` +
        `MRR=${Number(last.reciprocal_rank).toFixed(3)} ` +
        `${latencyMs}ms`
    );
  }

  const { error: insErr } = await supabase.from('eval_results').insert(results);
  if (insErr) throw insErr;

  const avg = (arr) =>
    arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const aggregates = {
    precision_at_k: avg(allMetrics.precision),
    recall_at_k: avg(allMetrics.recall),
    mrr: avg(allMetrics.mrr),
    ndcg: avg(allMetrics.ndcg),
    avg_latency_ms: Math.round(
      results.reduce((s, r) => s + (r.latency_ms || 0), 0) /
        Math.max(1, results.length)
    ),
    total_queries: queries.length,
  };

  await supabase.from('eval_runs').update(aggregates).eq('id', run.id);

  console.log('\n[eval] Aggregates:');
  console.log(`      P@${kk}:   ${aggregates.precision_at_k.toFixed(4)}`);
  console.log(`      R@${kk}:   ${aggregates.recall_at_k.toFixed(4)}`);
  console.log(`      MRR:      ${aggregates.mrr.toFixed(4)}`);
  console.log(`      NDCG:     ${aggregates.ndcg.toFixed(4)}`);
  console.log(`      Latency:  ${aggregates.avg_latency_ms}ms avg`);

  return { run, aggregates, results };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function compareRuns(runId1, runId2) {
  const { data: runs, error } = await supabase
    .from('eval_runs')
    .select('*')
    .in('id', [runId1, runId2]);

  if (error) throw error;
  if (!runs || runs.length < 2) {
    throw new Error('Two valid eval run IDs are required');
  }

  const byId = Object.fromEntries(runs.map((r) => [r.id, r]));
  const a = byId[runId1];
  const b = byId[runId2];
  if (!a || !b) throw new Error('Run not found for given IDs');

  const pct = (x, y) =>
    `${((num(y) - num(x)) * 100).toFixed(1)}% (B vs A)`;

  return {
    runs: [a, b],
    delta: {
      precision: pct(a.precision_at_k, b.precision_at_k),
      recall: pct(a.recall_at_k, b.recall_at_k),
      mrr: pct(a.mrr, b.mrr),
      ndcg: pct(a.ndcg, b.ndcg),
      latency_ms: `${num(b.avg_latency_ms) - num(a.avg_latency_ms)}ms (B − A)`,
    },
    winner:
      num(b.ndcg) >= num(a.ndcg) ? b.run_name : a.run_name,
  };
}
