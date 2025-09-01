-- ====================================
-- QUICK DATABASE SETUP VIA SUPABASE DASHBOARD
-- ====================================
-- Copy and paste this into: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql

-- 1. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE NOTIFICATIONS TABLE
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

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SECURITY POLICIES
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- 5. INSERT DEFAULT CATEGORIES
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

-- 6. VERIFICATION
SELECT 
  'categories' as table_name,
  COUNT(*) as record_count
FROM public.categories
WHERE status = 'active'

UNION ALL

SELECT 
  'notifications' as table_name,
  COUNT(*) as record_count
FROM public.notifications

UNION ALL

SELECT 
  'storage_bucket' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products') 
    THEN 1 ELSE 0 END as record_count;
