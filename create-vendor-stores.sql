-- Create vendor_stores table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vendor_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  business_license TEXT,
  tax_id TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Rwanda',
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  mobile_money_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(vendor_id)
);

-- Enable RLS
ALTER TABLE public.vendor_stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "vendor_stores_select_own" ON public.vendor_stores;
DROP POLICY IF EXISTS "vendor_stores_insert_own" ON public.vendor_stores;
DROP POLICY IF EXISTS "vendor_stores_update_own" ON public.vendor_stores;
DROP POLICY IF EXISTS "admin_vendor_stores_select_all" ON public.vendor_stores;

-- RLS policies for vendor_stores
CREATE POLICY "vendor_stores_select_own" ON public.vendor_stores 
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "vendor_stores_insert_own" ON public.vendor_stores 
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "vendor_stores_update_own" ON public.vendor_stores 
  FOR UPDATE USING (auth.uid() = vendor_id);

CREATE POLICY "admin_vendor_stores_select_all" ON public.vendor_stores 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert test data for our test vendor
INSERT INTO public.vendor_stores (
  vendor_id,
  store_name,
  store_description,
  business_license,
  tax_id,
  phone_number,
  email,
  address,
  city,
  state_province,
  postal_code,
  country,
  facebook_url,
  instagram_url,
  tiktok_url,
  mobile_money_info
) 
SELECT 
  '174369b8-6009-4031-aca6-a7d2ccc8c498', -- test vendor ID
  'Test Vendor Store',
  'A professional test store for development and testing purposes',
  'TEST-LICENSE-001',
  'TAX-001',
  '+250788123456',
  'testvendor@iwanyu.rw',
  'KG 123 St, Gasabo District',
  'Kigali',
  'Kigali City',
  '00000',
  'Rwanda',
  'https://facebook.com/testvendorstore',
  'https://instagram.com/testvendorstore',
  'https://tiktok.com/@testvendorstore',
  '{"provider": "MTN MoMo", "phone_number": "+250788123456", "account_name": "Test Vendor Store"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_stores WHERE vendor_id = '174369b8-6009-4031-aca6-a7d2ccc8c498'
);

-- Comment on table
COMMENT ON TABLE public.vendor_stores IS 'Stores information for vendors in the marketplace';
