-- Update database schema for 3-step vendor registration and file storage

-- Add registration step tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1 CHECK (registration_step IN (1, 2, 3, 4)),
ADD COLUMN IF NOT EXISTS registration_completed_at TIMESTAMP WITH TIME ZONE;

-- Create file storage table for documents and images
CREATE TABLE IF NOT EXISTS public.file_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  bucket_name TEXT NOT NULL DEFAULT 'documents',
  category TEXT NOT NULL CHECK (category IN ('id_document', 'business_license', 'product_image', 'store_logo', 'store_banner', 'other')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update vendor_stores table for enhanced business information
ALTER TABLE public.vendor_stores 
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
ADD COLUMN IF NOT EXISTS business_address JSONB,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bank_account_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create vendor registration steps table
CREATE TABLE IF NOT EXISTS public.vendor_registration_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number IN (1, 2, 3)),
  step_name TEXT NOT NULL,
  step_data JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, step_number)
);

-- Enable RLS on new tables
ALTER TABLE public.file_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_registration_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_storage
CREATE POLICY "file_storage_select_own" ON public.file_storage 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "file_storage_insert_own" ON public.file_storage 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "file_storage_update_own" ON public.file_storage 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "file_storage_delete_own" ON public.file_storage 
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all files
CREATE POLICY "admin_file_storage_select_all" ON public.file_storage 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for vendor_registration_steps
CREATE POLICY "vendor_registration_steps_select_own" ON public.vendor_registration_steps 
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "vendor_registration_steps_insert_own" ON public.vendor_registration_steps 
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "vendor_registration_steps_update_own" ON public.vendor_registration_steps 
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Admin can view all registration steps
CREATE POLICY "admin_vendor_registration_steps_select_all" ON public.vendor_registration_steps 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add trigger for vendor_registration_steps updated_at
CREATE TRIGGER update_vendor_registration_steps_updated_at
  BEFORE UPDATE ON public.vendor_registration_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets (these need to be created in Supabase dashboard or via API)
-- Documents bucket for ID documents, business licenses
-- Products bucket for product images
-- Stores bucket for store logos and banners

-- Function to handle registration step completion
CREATE OR REPLACE FUNCTION public.handle_registration_step_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If step is being marked as completed
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    NEW.completed_at = NOW();
    
    -- Check if all 3 steps are completed for this vendor
    IF (
      SELECT COUNT(*) 
      FROM public.vendor_registration_steps 
      WHERE vendor_id = NEW.vendor_id AND is_completed = TRUE
    ) >= 3 THEN
      -- Update profile registration step to 4 (completed)
      UPDATE public.profiles 
      SET registration_step = 4, registration_completed_at = NOW()
      WHERE id = NEW.vendor_id;
    ELSE
      -- Update profile to next step
      UPDATE public.profiles 
      SET registration_step = (
        SELECT MAX(step_number) + 1 
        FROM public.vendor_registration_steps 
        WHERE vendor_id = NEW.vendor_id AND is_completed = TRUE
      )
      WHERE id = NEW.vendor_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for registration step completion
CREATE TRIGGER handle_registration_step_completion_trigger
  BEFORE UPDATE ON public.vendor_registration_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_registration_step_completion();
