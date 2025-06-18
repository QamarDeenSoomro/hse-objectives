/*
  # Create Action Item Media Storage Bucket

  1. Storage Setup
    - Create action-item-media bucket for file uploads
    - Set appropriate file size limits and MIME types
    - Configure public access for reading

  2. Security Policies
    - Allow authenticated users to upload files to their own folders
    - Allow public read access to all files
    - Allow users to delete their own files
    - Allow admins to delete any files
*/

-- Create the action-item-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'action-item-media',
  'action-item-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload action item media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to action item media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own action item media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete any action item media" ON storage.objects;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload action item media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'action-item-media' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow public read access to action item media
CREATE POLICY "Allow public read access to action item media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'action-item-media');

-- Policy to allow users to delete their own uploaded files
CREATE POLICY "Allow users to delete their own action item media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'action-item-media' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow admins to delete any action item media
CREATE POLICY "Allow admins to delete any action item media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'action-item-media' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);