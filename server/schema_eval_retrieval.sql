-- Retrieval quality evaluation (ground-truth queries + run metrics).
-- Run once in Supabase SQL Editor after core tables exist.

CREATE TABLE IF NOT EXISTS eval_queries (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query             TEXT NOT NULL,
  language          TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  category          TEXT,
  expected_item_ids UUID[] NOT NULL DEFAULT '{}',
  expected_types    TEXT[],
  difficulty        TEXT DEFAULT 'medium'
                    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_eval_queries_query ON eval_queries (query);

CREATE TABLE IF NOT EXISTS eval_runs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_name          TEXT NOT NULL,
  search_mode       TEXT CHECK (search_mode IN ('vector', 'hybrid', 'keyword')),
  embedding_model   TEXT,
  vector_weight     NUMERIC(5, 2),
  keyword_weight    NUMERIC(5, 2),
  threshold         NUMERIC(6, 4),
  k                 INT DEFAULT 5,
  precision_at_k    NUMERIC(8, 6),
  recall_at_k       NUMERIC(8, 6),
  mrr               NUMERIC(8, 6),
  ndcg              NUMERIC(8, 6),
  avg_latency_ms    INT,
  total_queries     INT,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eval_results (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id            UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
  query_id          UUID REFERENCES eval_queries(id) ON DELETE SET NULL,
  retrieved_ids     UUID[],
  retrieved_types   TEXT[],
  precision_at_k    NUMERIC(8, 6),
  recall_at_k       NUMERIC(8, 6),
  reciprocal_rank   NUMERIC(8, 6),
  ndcg_at_k         NUMERIC(8, 6),
  latency_ms        INT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_results_run ON eval_results(run_id);

-- Seed queries (UUID ground truth: fill expected_item_ids after you pick real catalogue rows)
INSERT INTO eval_queries (query, language, category, expected_item_ids, expected_types, difficulty)
VALUES
  (
    'Sahara desert overnight camel trek',
    'en',
    'activity',
    ARRAY[]::UUID[],
    ARRAY['activity', 'experience']::TEXT[],
    'easy'
  ),
  (
    'romantic riad Marrakech pool',
    'en',
    'accommodation',
    ARRAY[]::UUID[],
    ARRAY['accommodation']::TEXT[],
    'easy'
  ),
  (
    'Moroccan cooking class medina',
    'en',
    'activity',
    ARRAY[]::UUID[],
    ARRAY['activity', 'experience']::TEXT[],
    'easy'
  ),
  (
    'I want something adventurous in the mountains',
    'en',
    'activity',
    ARRAY[]::UUID[],
    ARRAY['activity', 'experience']::TEXT[],
    'medium'
  ),
  (
    'family-friendly beach destination Atlantic coast',
    'en',
    'mixed',
    ARRAY[]::UUID[],
    ARRAY['accommodation', 'restaurant']::TEXT[],
    'medium'
  ),
  (
    'authentic local food experience not touristy',
    'en',
    'restaurant',
    ARRAY[]::UUID[],
    ARRAY['restaurant', 'activity']::TEXT[],
    'medium'
  ),
  (
    'séjour relaxant côte marocaine',
    'fr',
    'mixed',
    ARRAY[]::UUID[],
    ARRAY['accommodation', 'restaurant']::TEXT[],
    'hard'
  ),
  (
    'شيء مثير للاهتمام في الصحراء',
    'ar',
    'activity',
    ARRAY[]::UUID[],
    ARRAY['activity', 'experience']::TEXT[],
    'hard'
  ),
  (
    'something unique I cannot do anywhere else',
    'en',
    'mixed',
    ARRAY[]::UUID[],
    ARRAY['experience', 'activity']::TEXT[],
    'hard'
  )
ON CONFLICT (query) DO NOTHING;
