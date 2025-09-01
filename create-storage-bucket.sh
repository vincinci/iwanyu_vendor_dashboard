#!/bin/bash

# ==============================================
# SUPABASE STORAGE BUCKET CREATION SCRIPT
# ==============================================
# This script creates the "products" storage bucket
# and sets up the necessary policies for image uploads

echo "🚀 Creating Supabase Storage Bucket for Products..."
echo "=================================================="

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in a Supabase project directory"
    echo "Please run 'supabase init' first or navigate to your project directory"
    exit 1
fi

# Create the storage bucket using SQL
echo "📦 Creating 'products' storage bucket..."

supabase sql --db-url="postgresql://postgres:[YOUR_PASSWORD]@db.tviewbuthckejhlogwns.supabase.co:5432/postgres" <<EOF
-- Create the products storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products', 
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

-- Create storage policies for the products bucket
INSERT INTO storage.policies (id, bucket_id, name, operation, check_expression)
VALUES 
  ('products_public_read', 'products', 'Public can read products', 'SELECT', 'true'),
  ('authenticated_upload', 'products', 'Authenticated users can upload', 'INSERT', 'auth.role() = ''authenticated'''),
  ('authenticated_update', 'products', 'Authenticated users can update', 'UPDATE', 'auth.role() = ''authenticated'''),
  ('authenticated_delete', 'products', 'Authenticated users can delete', 'DELETE', 'auth.role() = ''authenticated''')
ON CONFLICT (id) DO NOTHING;

-- Verify bucket creation
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'products';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Storage bucket 'products' created successfully!"
    echo "✅ Storage policies configured"
    echo ""
    echo "📋 Bucket Configuration:"
    echo "   • Name: products"
    echo "   • Public: Yes"
    echo "   • File size limit: 50MB"
    echo "   • Allowed types: JPEG, PNG, WebP, AVIF, GIF"
    echo ""
    echo "🎉 You can now upload product images!"
else
    echo "❌ Error creating storage bucket"
    echo "Please check your database connection and try again"
    exit 1
fi
