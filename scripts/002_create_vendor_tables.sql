-- Vendor-specific tables for the e-commerce platform

-- Vendor stores/shops
CREATE TABLE IF NOT EXISTS public.vendor_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  store_banner_url TEXT,
  business_license TEXT,
  tax_id TEXT,
  store_settings JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.vendor_stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  sku TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT TRUE,
  images JSONB DEFAULT '[]',
  category TEXT,
  tags TEXT[],
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (for size, color, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  sku TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  option1 TEXT, -- e.g., "Size"
  option2 TEXT, -- e.g., "Color"
  option3 TEXT, -- e.g., "Material"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on vendor tables
ALTER TABLE public.vendor_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_stores
CREATE POLICY "vendor_stores_select_own" ON public.vendor_stores 
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "vendor_stores_insert_own" ON public.vendor_stores 
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "vendor_stores_update_own" ON public.vendor_stores 
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Admin can view all stores
CREATE POLICY "admin_vendor_stores_select_all" ON public.vendor_stores 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for products
CREATE POLICY "products_select_own" ON public.products 
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "products_insert_own" ON public.products 
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "products_update_own" ON public.products 
  FOR UPDATE USING (auth.uid() = vendor_id);

CREATE POLICY "products_delete_own" ON public.products 
  FOR DELETE USING (auth.uid() = vendor_id);

-- Admin can view all products
CREATE POLICY "admin_products_select_all" ON public.products 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for product_variants
CREATE POLICY "product_variants_select_own" ON public.product_variants 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = product_id AND vendor_id = auth.uid()
    )
  );

CREATE POLICY "product_variants_insert_own" ON public.product_variants 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = product_id AND vendor_id = auth.uid()
    )
  );

CREATE POLICY "product_variants_update_own" ON public.product_variants 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = product_id AND vendor_id = auth.uid()
    )
  );

CREATE POLICY "product_variants_delete_own" ON public.product_variants 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = product_id AND vendor_id = auth.uid()
    )
  );
