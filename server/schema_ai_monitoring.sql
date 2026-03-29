-- AI observability: run once in Supabase SQL editor (after ai_logs exists)
-- Enhances ai_logs + view for dashboards

ALTER TABLE ai_logs
  ADD COLUMN IF NOT EXISTS feature TEXT DEFAULT 'chat',
  ADD COLUMN IF NOT EXISTS latency_ms INT,
  ADD COLUMN IF NOT EXISTS error_msg TEXT,
  ADD COLUMN IF NOT EXISTS retrieval_mode TEXT,
  ADD COLUMN IF NOT EXISTS items_retrieved INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(12, 8);

-- Optional: enforce feature values in application layer (avoids migration pain on existing rows)

CREATE OR REPLACE VIEW ai_metrics AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  feature,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  ROUND(AVG(latency_ms))::INT AS avg_latency_ms,
  SUM(COALESCE(tokens_used, 0)) AS total_tokens,
  ROUND(
    SUM(COALESCE(cost_usd, COALESCE(tokens_used, 0) * 0.00000015))::numeric,
    6
  ) AS estimated_cost_usd
FROM ai_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

CREATE OR REPLACE FUNCTION get_ai_metrics_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'total_calls', COUNT(*)::bigint,
      'successes', COUNT(*) FILTER (WHERE status = 'success')::bigint,
      'errors', COUNT(*) FILTER (WHERE status = 'error')::bigint,
      'avg_latency_ms', ROUND(AVG(latency_ms))::numeric,
      'total_tokens', COALESCE(SUM(tokens_used), 0)::bigint,
      'estimated_cost_usd', ROUND(
        SUM(COALESCE(cost_usd, COALESCE(tokens_used, 0) * 0.00000015))::numeric,
        6
      )
    ),
    '{}'::jsonb
  )
  FROM ai_logs
  WHERE created_at > NOW() - INTERVAL '30 days';
$$;
