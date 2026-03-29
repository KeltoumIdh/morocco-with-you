-- Commission PDFs uploaded by the Express API (server/services + admin report route).
-- Run this in Supabase SQL Editor after providers + commission_reports exist.
--
-- How it works:
-- - The Node server uses the Supabase SERVICE ROLE key → bypasses RLS on DB and can upload to Storage.
-- - public = true lets getPublicUrl() return a stable link you can put in emails (anyone with the link can open the PDF).
-- - If you prefer private buckets + signed URLs only, set public = false and change the app to use createSignedUrl.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,
  52428800, -- 50 MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow anonymous + logged-in users to read objects in `reports` (needed for some Supabase versions / RLS on storage.objects)
DROP POLICY IF EXISTS "Public read reports PDFs" ON storage.objects;
CREATE POLICY "Public read reports PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports');

-- Optional: restrict uploads to service role only (clients never upload; API uses service role and may bypass anyway)
-- Uncomment if you also allow authenticated users to upload and want to lock down:
-- DROP POLICY IF EXISTS "Service role uploads reports" ON storage.objects;
-- CREATE POLICY "Service role uploads reports"
--   ON storage.objects FOR INSERT TO service_role
--   WITH CHECK (bucket_id = 'reports');
