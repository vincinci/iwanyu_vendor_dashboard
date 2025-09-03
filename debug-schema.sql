-- Quick database schema inspection
-- Check products table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Check categories table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Sample some recent products to see current data structure
SELECT id, name, category, category_id, images, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 3;
