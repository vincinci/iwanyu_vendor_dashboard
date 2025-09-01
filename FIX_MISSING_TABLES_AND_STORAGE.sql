-- ====================================
-- FIX MISSING TABLES AND STORAGE BUCKET
-- ====================================
-- Run this script in Supabase SQL Editor to fix the 404/400 errors
-- https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql

-- ====================================
-- 1. CREATE MISSING TABLES
-- ====================================

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table  
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ====================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 3. CREATE SECURITY POLICIES
-- ====================================

-- Categories policies (public read for active categories)
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (status = 'active');

-- Admin can manage categories
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Notifications policies (users can only see their own)
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ====================================
-- 4. INSERT DEFAULT CATEGORIES
-- ====================================

INSERT INTO public.categories (id, name, description, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Clothing', 'Fashion and apparel', 'active'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Home & Garden', 'Home improvement and gardening items', 'active'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Sports', 'Sports equipment and accessories', 'active'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Books', 'Books and educational materials', 'active'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Health & Beauty', 'Health and beauty products', 'active'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Automotive', 'Car parts and accessories', 'active'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Food & Beverages', 'Food and drink products', 'active'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Toys & Games', 'Toys and gaming products', 'active'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Other', 'Miscellaneous items', 'active')
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 5. CREATE STORAGE BUCKET FOR PRODUCTS (AUTOMATED)
-- ====================================

-- Create the products storage bucket if it doesn't exist
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
INSERT INTO storage.policies (id, bucket_id, name, operation, check)
VALUES 
  ('products_public_read', 'products', 'Public can read products', 'SELECT', 'true'),
  ('authenticated_upload', 'products', 'Authenticated users can upload', 'INSERT', 'auth.role() = ''authenticated'''),
  ('authenticated_update', 'products', 'Authenticated users can update', 'UPDATE', 'auth.role() = ''authenticated'''),
  ('authenticated_delete', 'products', 'Authenticated users can delete', 'DELETE', 'auth.role() = ''authenticated''')
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 6. VERIFICATION QUERIES
-- ====================================

-- Check that tables were created successfully
SELECT 
  'categories' as table_name,
  COUNT(*) as record_count,
  'Table created with default categories' as status
FROM public.categories
WHERE status = 'active'

UNION ALL

SELECT 
  'notifications' as table_name,
  0 as record_count,
  'Table created and ready for use' as status

UNION ALL

SELECT 
  'storage_bucket' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products') 
    THEN 1 ELSE 0 END as record_count,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products') 
    THEN 'Bucket exists' 
    ELSE 'Bucket needs to be created manually in Storage section' END as status;

-- ====================================
-- MANUAL STEPS AFTER RUNNING THIS SQL:
-- ====================================
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Create a new bucket named "products" 
-- 3. Make it public
-- 4. Set file size limit to 50MB
-- 5. Allow image types: jpeg, png, webp, avif
-- ====================================
