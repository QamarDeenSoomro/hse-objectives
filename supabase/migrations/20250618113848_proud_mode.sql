/*
  # Create action-item-media storage bucket

  1. Storage Setup
    - Create `action-item-media` bucket for storing action item closure media files
    - Configure bucket to be publicly accessible for reading
    - Set up appropriate security policies

  2. Security
    - Allow authenticated users to upload files to their own action item folders
    - Allow public read access to uploaded media files
    - Restrict delete operations to file owners or admins
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