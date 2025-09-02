-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for products if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage bucket for stores if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('stores', 'stores', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own product images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to access their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated users to upload store images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to store images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own store images" ON storage.objects;

-- Create storage policies for the products bucket
-- Policy 1: Allow authenticated users to upload to products bucket
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Policy 2: Allow public read access to product images
CREATE POLICY "Allow public access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy 3: Allow users to delete their own uploads (optional)
CREATE POLICY "Allow users to delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 4: Allow users to update their own uploads (optional)
CREATE POLICY "Allow users to update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for the documents bucket
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow users to access their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for the stores bucket
CREATE POLICY "Allow authenticated users to upload store images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stores');

CREATE POLICY "Allow public access to store images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stores');

CREATE POLICY "Allow users to delete their own store images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1]);
