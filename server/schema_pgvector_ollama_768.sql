-- Gemini (gemini-embedding-001 with outputDimensionality 768) and Ollama (nomic-embed-text).
-- Run this in Supabase SQL Editor if you use AI_EMBEDDING_PROVIDER=ollama (not OpenAI 1536).
--
-- If you already ran schema_pgvector_catalogue.sql with vector(1536) and have NO rows you care about:
--   TRUNCATE catalogue_embeddings;
-- Then run this file to resize the column + index + match function.
--
-- If the table is empty, TRUNCATE is optional.

DROP INDEX IF EXISTS idx_catalogue_embeddings_vector;

-- pgvector cannot always cast 1536→768; replace column (safe if table empty or you truncated).
ALTER TABLE catalogue_embeddings DROP COLUMN IF EXISTS embedding;
ALTER TABLE catalogue_embeddings ADD COLUMN embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_catalogue_embeddings_vector
  ON catalogue_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE OR REPLACE FUNCTION match_catalogue(
  query_embedding  vector(768),
  match_threshold  FLOAT    DEFAULT 0.70,
  match_count      INT      DEFAULT 10,
  filter_type      TEXT     DEFAULT NULL
)
RETURNS TABLE (
  item_id    UUID,
  item_type  TEXT,
  title      TEXT,
  location   TEXT,
  city       TEXT,
  price      NUMERIC,
  gradient   TEXT,
  tags       TEXT[],
  metadata   JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
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
    (1 - (ce.embedding <=> query_embedding))::FLOAT AS similarity
  FROM catalogue_embeddings ce
  WHERE
    (filter_type IS NULL OR ce.item_type = filter_type)
    AND (1 - (ce.embedding <=> query_embedding)) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
