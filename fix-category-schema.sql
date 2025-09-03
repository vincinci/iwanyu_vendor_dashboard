-- Fix products table to use category_id instead of category text
-- This will add proper foreign key relationship to categories table

-- Step 1: Add category_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Step 2: Try to map existing category text values to category IDs
UPDATE public.products 
SET category_id = (
  SELECT c.id 
  FROM public.categories c 
  WHERE LOWER(c.name) = LOWER(products.category) 
  OR LOWER(c.slug) = LOWER(products.category)
  LIMIT 1
)
WHERE category IS NOT NULL 
AND category_id IS NULL;

-- Step 3: For any remaining unmapped categories, create them
DO $$
BEGIN
  -- Insert any unique category values that don't exist in categories table
  INSERT INTO public.categories (name, slug, description, is_active)
  SELECT DISTINCT 
    INITCAP(category) as name,
    LOWER(REPLACE(REPLACE(category, ' ', '-'), '&', 'and')) as slug,
    'Auto-created from existing product data' as description,
    true as is_active
  FROM public.products 
  WHERE category IS NOT NULL 
  AND category != ''
  AND category_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categories c 
    WHERE LOWER(c.name) = LOWER(products.category)
    OR LOWER(c.slug) = LOWER(REPLACE(REPLACE(products.category, ' ', '-'), '&', 'and'))
  )
  ON CONFLICT (slug) DO NOTHING;
  
  -- Now update products with the newly created category IDs
  UPDATE public.products 
  SET category_id = (
    SELECT c.id 
    FROM public.categories c 
    WHERE LOWER(c.name) = LOWER(products.category) 
    OR LOWER(c.slug) = LOWER(REPLACE(REPLACE(products.category, ' ', '-'), '&', 'and'))
    LIMIT 1
  )
  WHERE category IS NOT NULL 
  AND category_id IS NULL;
END $$;

-- Step 4: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Note: We're keeping the category column for now to avoid breaking existing code
-- In a future migration, we can remove it after confirming everything works with category_id
