-- pgvector + catalogue embeddings — run in Supabase SQL Editor
-- Requires: extensions available on your Supabase plan
--
-- OpenAI text-embedding-3-small → vector(1536) below.
-- Gemini (gemini-embedding-001 @ 768) or Ollama (nomic-embed-text) → 768 dims:
-- run schema_pgvector_ollama_768.sql after this file when using those providers.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS catalogue_embeddings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id       UUID NOT NULL,
  item_type     TEXT NOT NULL CHECK (item_type IN (
                  'experience','activity','accommodation',
                  'restaurant','package','provider','group_trip')),
  content_hash  TEXT,
  embedding     vector(1536),
  metadata      JSONB DEFAULT '{}',
  title         TEXT,
  location      TEXT,
  city          TEXT,
  price         NUMERIC(10,2),
  gradient      TEXT,
  tags          TEXT[],
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogue_embeddings_item
  ON catalogue_embeddings(item_id, item_type);

CREATE INDEX IF NOT EXISTS idx_catalogue_embeddings_vector
  ON catalogue_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS user_recommendations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id       UUID,
  item_type     TEXT,
  score         NUMERIC(5,4),
  reason        TEXT,
  generated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_user_recs_user
  ON user_recommendations(user_id, expires_at);

CREATE OR REPLACE FUNCTION match_catalogue(
  query_embedding  vector(1536),
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

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS retrieved_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tokens_used     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model_used      TEXT,
  ADD COLUMN IF NOT EXISTS latency_ms      INT;

ALTER TABLE catalogue_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Embeddings public read" ON catalogue_embeddings;
CREATE POLICY "Embeddings public read"
  ON catalogue_embeddings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "User recs own" ON user_recommendations;
CREATE POLICY "User recs own"
  ON user_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (API) bypasses RLS for INSERT/UPDATE on catalogue_embeddings
--
-- Hybrid RAG (FTS + vector + RRF): run schema_hybrid_search.sql after this file.
-- If you later switch to 768-dim embeddings, run schema_pgvector_ollama_768.sql
-- and keep using hybrid_search_768 from the same hybrid schema file.
