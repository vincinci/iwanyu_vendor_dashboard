-- Create storage bucket for products if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own product images" ON storage.objects;

-- Create storage policies for the products bucket
-- Policy 1: Allow authenticated users to upload to products bucket
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow public read access to product images
CREATE POLICY "Allow public access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Policy 3: Allow users to delete their own uploads (optional)
CREATE POLICY "Allow users to delete their own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to update their own uploads (optional)
CREATE POLICY "Allow users to update their own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
