-- ==============================================================================
-- PRO ALUMN — Supabase Storage Buckets & Public Access Policies
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Create Public Storage Buckets if not already created
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('resumes', 'resumes', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('certificates', 'certificates', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('stories', 'stories', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']),
  ('documents', 'documents', true, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable Public Read Access for all 5 buckets
CREATE POLICY "Public Read Access for Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Public Read Access for Resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');

CREATE POLICY "Public Read Access for Certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Public Read Access for Stories"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Public Read Access for Documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- 3. Enable Upload Access for Service Role & Authenticated Users
CREATE POLICY "Allow Upload to Storage Buckets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('avatars', 'resumes', 'certificates', 'stories', 'documents'));

CREATE POLICY "Allow Update in Storage Buckets"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('avatars', 'resumes', 'certificates', 'stories', 'documents'));

CREATE POLICY "Allow Delete in Storage Buckets"
ON storage.objects FOR DELETE
USING (bucket_id IN ('avatars', 'resumes', 'certificates', 'stories', 'documents'));
