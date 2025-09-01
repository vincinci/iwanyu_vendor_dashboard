-- Product categories and enhanced features
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product reviews and ratings
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_content TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product analytics tracking
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'add_to_cart', 'purchase', 'search')),
  customer_email TEXT,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced vendor settings
CREATE TABLE IF NOT EXISTS public.vendor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  business_description TEXT,
  business_type TEXT,
  business_address JSONB,
  tax_id TEXT,
  business_license_url TEXT,
  business_hours JSONB,
  bank_details JSONB,
  mobile_money_details JSONB,
  social_media JSONB,
  notification_settings JSONB DEFAULT '{}',
  shipping_settings JSONB DEFAULT '{}',
  return_policy TEXT,
  terms_of_service TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories (public read)
CREATE POLICY "categories_select_all" ON public.categories 
  FOR SELECT USING (is_active = true);

-- Admin can manage categories
CREATE POLICY "admin_categories_all" ON public.categories 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for product reviews
CREATE POLICY "product_reviews_select_approved" ON public.product_reviews 
  FOR SELECT USING (is_approved = true);

-- Admin can see all reviews
CREATE POLICY "admin_product_reviews_all" ON public.product_reviews 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vendors can see reviews for their products
CREATE POLICY "vendor_product_reviews_select_own" ON public.product_reviews 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.vendor_id = auth.uid()
    )
  );

-- RLS policies for vendor settings
CREATE POLICY "vendor_settings_select_own" ON public.vendor_settings 
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "vendor_settings_insert_own" ON public.vendor_settings 
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "vendor_settings_update_own" ON public.vendor_settings 
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Admin can see all vendor settings
CREATE POLICY "admin_vendor_settings_select_all" ON public.vendor_settings 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event_type ON public.product_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_product_analytics_created_at ON public.product_analytics(created_at);

-- Insert default categories
INSERT INTO public.categories (name, slug, description, is_active) VALUES
  ('Electronics', 'electronics', 'Electronic devices and accessories', true),
  ('Fashion', 'fashion', 'Clothing, shoes and accessories', true),
  ('Home & Garden', 'home-garden', 'Home improvement and garden items', true),
  ('Sports & Recreation', 'sports-recreation', 'Sports equipment and recreational items', true),
  ('Books & Media', 'books-media', 'Books, movies, music and media', true),
  ('Health & Beauty', 'health-beauty', 'Health and beauty products', true),
  ('Food & Beverages', 'food-beverages', 'Food and drink products', true),
  ('Automotive', 'automotive', 'Car parts and automotive accessories', true),
  ('Baby & Kids', 'baby-kids', 'Products for babies and children', true),
  ('Office & Business', 'office-business', 'Office supplies and business equipment', true)
ON CONFLICT (slug) DO NOTHING;
