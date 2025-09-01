#!/bin/bash

echo "🚀 CREATING TABLES VIA SUPABASE CLI..."

# Create tables using SQL execution
cat << 'EOF' > temp_migration.sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'vendor',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  category_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  customer_id UUID,
  vendor_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, slug, status, sort_order) VALUES
  ('Electronics', 'electronics', 'active', 1),
  ('Clothing & Fashion', 'clothing-fashion', 'active', 2),
  ('Home & Garden', 'home-garden', 'active', 3),
  ('Sports & Outdoors', 'sports-outdoors', 'active', 4),
  ('Books & Media', 'books-media', 'active', 5),
  ('Health & Beauty', 'health-beauty', 'active', 6),
  ('Automotive', 'automotive', 'active', 7),
  ('Food & Beverages', 'food-beverages', 'active', 8),
  ('Toys & Games', 'toys-games', 'active', 9),
  ('Other', 'other', 'active', 10)
ON CONFLICT (slug) DO NOTHING;
EOF

echo "📋 Migration file created: temp_migration.sql"
echo ""
echo "🔧 Now executing via different methods:"
echo ""

# Method 1: Try with psql if available
if command -v psql &> /dev/null; then
    echo "🔌 Attempting PostgreSQL connection..."
    
    # Try the direct connection
    export PGPASSWORD="eXKfME42BT9v8xJr"
    
    psql "postgresql://postgres:eXKfME42BT9v8xJr@db.tviewbuthckejhlogwns.supabase.co:5432/postgres?sslmode=require" -f temp_migration.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Tables created successfully via psql!"
        rm temp_migration.sql
        exit 0
    else
        echo "❌ Direct psql connection failed"
    fi
else
    echo "⚠️  psql not available"
fi

# Method 2: Manual instruction
echo ""
echo "🔧 ALTERNATIVE: Manual Creation Required"
echo "=================================="
echo "Since automated CLI access has limitations, here's what to do:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql"
echo "2. Copy the contents of 'temp_migration.sql' (created above)"
echo "3. Paste and execute in the SQL Editor"
echo ""
echo "📄 Migration file location: $(pwd)/temp_migration.sql"
echo ""

# Copy migration to clipboard if possible
if command -v pbcopy &> /dev/null; then
    cat temp_migration.sql | pbcopy
    echo "✅ Migration SQL copied to clipboard!"
    echo "📋 Just paste (Cmd+V) in Supabase SQL Editor and run"
fi

echo ""
echo "🎯 After running the migration, execute: node verify-database-setup.mjs"
