-- Hybrid RAG: BM25-style full-text + vector cosine, merged with Reciprocal Rank Fusion (RRF).
-- Run in Supabase SQL Editor AFTER schema_pgvector_catalogue.sql (vector(1536) + match_catalogue).
--
-- Why hybrid (not pure vector):
-- 1. Exact keyword matches can score lower than semantic near-misses
--    Example: "Riad Yasmine" — vector may miss; keyword/FTS finds it.
-- 2. No length normalization in raw cosine — short rows can dominate; RRF reduces that bias.
-- 3. No recency/popularity in this MVP — FTS + vector is the standard baseline before rerankers.
--
-- Solution: ts_rank_cd on tsvector + HNSW cosine → RRF merge (same family as ES / Pinecone hybrid).

ALTER TABLE catalogue_embeddings
  ADD COLUMN IF NOT EXISTS fts_vector TSVECTOR;

UPDATE catalogue_embeddings SET fts_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english',
    coalesce(array_to_string(tags, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C')
WHERE fts_vector IS NULL;

CREATE OR REPLACE FUNCTION update_embedding_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english',
      coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS catalogue_fts_trigger ON catalogue_embeddings;
CREATE TRIGGER catalogue_fts_trigger
  BEFORE INSERT OR UPDATE OF title, tags, location ON catalogue_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_embedding_fts();

CREATE INDEX IF NOT EXISTS idx_catalogue_fts
  ON catalogue_embeddings USING gin (fts_vector);

-- RRF hybrid (OpenAI text-embedding-3-small — 1536 dims)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text       TEXT,
  query_embedding  vector(1536),
  match_count      INT     DEFAULT 10,
  vector_weight    FLOAT   DEFAULT 0.7,
  keyword_weight   FLOAT   DEFAULT 0.3,
  filter_type      TEXT    DEFAULT NULL,
  rrf_k            INT     DEFAULT 60
)
RETURNS TABLE (
  item_id       UUID,
  item_type     TEXT,
  title         TEXT,
  location      TEXT,
  city          TEXT,
  price         NUMERIC,
  gradient      TEXT,
  tags          TEXT[],
  metadata      JSONB,
  score         DOUBLE PRECISION,
  vector_rank   INT,
  keyword_rank  INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      ce.item_id,
      ROW_NUMBER() OVER (ORDER BY ce.embedding <=> query_embedding) AS rank
    FROM catalogue_embeddings ce
    WHERE
      (filter_type IS NULL OR ce.item_type = filter_type)
      AND ce.embedding IS NOT NULL
    LIMIT GREATEST(match_count * 3, 30)
  ),
  keyword_results AS (
    SELECT
      ce.item_id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(
          ce.fts_vector,
          websearch_to_tsquery('english', query_text)
        ) DESC
      ) AS rank
    FROM catalogue_embeddings ce
    WHERE
      ce.fts_vector @@ websearch_to_tsquery('english', query_text)
      AND (filter_type IS NULL OR ce.item_type = filter_type)
    LIMIT GREATEST(match_count * 3, 30)
  ),
  rrf_scores AS (
    SELECT
      COALESCE(v.item_id, k.item_id) AS fusion_item_id,
      COALESCE(v.rank, 9999) AS v_rank,
      COALESCE(k.rank, 9999) AS k_rank,
      (vector_weight  * (1.0 / (rrf_k + COALESCE(v.rank, 9999)::FLOAT))) +
      (keyword_weight * (1.0 / (rrf_k + COALESCE(k.rank, 9999)::FLOAT)))
        AS rrf_score
    FROM vector_results v
    FULL OUTER JOIN keyword_results k ON v.item_id = k.item_id
  )
  SELECT
    ce.item_id,
    ce.item_type,
    ce.title,
    ce.location,
    ce.city,
    ce.price,
    ce.gradient,
    ce.tags,
    ce.metadata,
    rs.rrf_score::DOUBLE PRECISION AS score,
    (CASE WHEN rs.v_rank = 9999 THEN NULL ELSE rs.v_rank END)::INT AS vector_rank,
    (CASE WHEN rs.k_rank = 9999 THEN NULL ELSE rs.k_rank END)::INT AS keyword_rank
  FROM rrf_scores rs
  INNER JOIN catalogue_embeddings ce ON ce.item_id = rs.fusion_item_id
  WHERE (filter_type IS NULL OR ce.item_type = filter_type)
  ORDER BY rs.rrf_score DESC
  LIMIT match_count;
END;
$$;

-- Same RRF pipeline for Gemini / Ollama embeddings (vector(768) catalogue column).
CREATE OR REPLACE FUNCTION hybrid_search_768(
  query_text       TEXT,
  query_embedding  vector(768),
  match_count      INT     DEFAULT 10,
  vector_weight    FLOAT   DEFAULT 0.7,
  keyword_weight   FLOAT   DEFAULT 0.3,
  filter_type      TEXT    DEFAULT NULL,
  rrf_k            INT     DEFAULT 60
)
RETURNS TABLE (
  item_id       UUID,
  item_type     TEXT,
  title         TEXT,
  location      TEXT,
  city          TEXT,
  price         NUMERIC,
  gradient      TEXT,
  tags          TEXT[],
  metadata      JSONB,
  score         DOUBLE PRECISION,
  vector_rank   INT,
  keyword_rank  INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      ce.item_id,
      ROW_NUMBER() OVER (ORDER BY ce.embedding <=> query_embedding) AS rank
    FROM catalogue_embeddings ce
    WHERE
      (filter_type IS NULL OR ce.item_type = filter_type)
      AND ce.embedding IS NOT NULL
    LIMIT GREATEST(match_count * 3, 30)
  ),
  keyword_results AS (
    SELECT
      ce.item_id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(
          ce.fts_vector,
          websearch_to_tsquery('english', query_text)
        ) DESC
      ) AS rank
    FROM catalogue_embeddings ce
    WHERE
      ce.fts_vector @@ websearch_to_tsquery('english', query_text)
      AND (filter_type IS NULL OR ce.item_type = filter_type)
    LIMIT GREATEST(match_count * 3, 30)
  ),
  rrf_scores AS (
    SELECT
      COALESCE(v.item_id, k.item_id) AS fusion_item_id,
      COALESCE(v.rank, 9999) AS v_rank,
      COALESCE(k.rank, 9999) AS k_rank,
      (vector_weight  * (1.0 / (rrf_k + COALESCE(v.rank, 9999)::FLOAT))) +
      (keyword_weight * (1.0 / (rrf_k + COALESCE(k.rank, 9999)::FLOAT)))
        AS rrf_score
    FROM vector_results v
    FULL OUTER JOIN keyword_results k ON v.item_id = k.item_id
  )
  SELECT
    ce.item_id,
    ce.item_type,
    ce.title,
    ce.location,
    ce.city,
    ce.price,
    ce.gradient,
    ce.tags,
    ce.metadata,
    rs.rrf_score::DOUBLE PRECISION AS score,
    (CASE WHEN rs.v_rank = 9999 THEN NULL ELSE rs.v_rank END)::INT AS vector_rank,
    (CASE WHEN rs.k_rank = 9999 THEN NULL ELSE rs.k_rank END)::INT AS keyword_rank
  FROM rrf_scores rs
  INNER JOIN catalogue_embeddings ce ON ce.item_id = rs.fusion_item_id
  WHERE (filter_type IS NULL OR ce.item_type = filter_type)
  ORDER BY rs.rrf_score DESC
  LIMIT match_count;
END;
$$;
