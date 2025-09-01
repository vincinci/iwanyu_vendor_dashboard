-- Core user management tables for Iwanyu e-commerce platform
-- Create profiles table that references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'admin')) DEFAULT 'vendor',
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'pending')) DEFAULT 'pending',
  avatar_url TEXT,
  phone TEXT,
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "admin_profiles_select_all" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all profiles
CREATE POLICY "admin_profiles_update_all" ON public.profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
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
-- Triggers and functions for the Iwanyu platform

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'vendor')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_stores_updated_at
  BEFORE UPDATE ON public.vendor_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  new_number := 'IWY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  
  -- Get count of orders today + 1
  SELECT COUNT(*) + 1 INTO counter
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Pad with zeros to make it 4 digits
  new_number := new_number || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Function to auto-generate order number on insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to set order number
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();
