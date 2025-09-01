#!/bin/bash

echo "🚀 COMPREHENSIVE TABLE CREATION SCRIPT"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database credentials
SUPABASE_URL="https://tviewbuthckejhlogwns.supabase.co"
PROJECT_REF="tviewbuthckejhlogwns"
DB_PASSWORD="eXKfME42BT9v8xJr"

echo -e "${BLUE}📋 Creating complete SQL migration...${NC}"

# Create the complete SQL file
cat << 'EOF' > create_all_tables.sql
-- ===============================================
-- COMPLETE DATABASE SETUP FOR DASHBOARD
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (User Management)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'vendor' CHECK (role IN ('admin', 'vendor', 'customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  phone TEXT,
  address JSONB,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATEGORIES TABLE (Product Organization)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  parent_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PRODUCTS TABLE (Product Management)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  track_inventory BOOLEAN DEFAULT true,
  inventory_quantity INTEGER DEFAULT 0,
  min_inventory_level INTEGER DEFAULT 0,
  weight DECIMAL(8,2),
  dimensions JSONB,
  images JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  brand TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE (Order Management)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  vendor_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  internal_notes TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE (Order Line Items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. NOTIFICATIONS TABLE (System Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'order', 'payment')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MESSAGES TABLE (Communication System)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'support', 'order_inquiry')),
  read BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES public.messages(id),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. VENDOR SETTINGS TABLE (Vendor Configuration)
CREATE TABLE IF NOT EXISTS public.vendor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  business_description TEXT,
  business_logo TEXT,
  business_address JSONB,
  tax_id TEXT,
  bank_details JSONB,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  shipping_zones JSONB DEFAULT '[]'::jsonb,
  business_hours JSONB,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id)
);

-- 9. ANALYTICS TABLE (Dashboard Analytics)
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- ENABLE ROW LEVEL SECURITY
-- ===============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- CREATE SECURITY POLICIES
-- ===============================================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (status = 'active');
CREATE POLICY "Vendors can manage own products" ON public.products FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid() OR vendor_id = auth.uid());
CREATE POLICY "Vendors can manage own orders" ON public.orders FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view own messages" ON public.messages FOR ALL USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Vendors can manage own settings" ON public.vendor_settings FOR ALL USING (vendor_id = auth.uid());

-- ===============================================
-- CREATE TRIGGERS AND FUNCTIONS
-- ===============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create order number generation
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- User registration handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'vendor'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- INSERT DEFAULT CATEGORIES
-- ===============================================
INSERT INTO public.categories (id, name, description, slug, status, sort_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', 'electronics', 'active', 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Clothing & Fashion', 'Fashion and apparel', 'clothing-fashion', 'active', 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Home & Garden', 'Home improvement and gardening items', 'home-garden', 'active', 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Sports & Outdoors', 'Sports equipment and accessories', 'sports-outdoors', 'active', 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Books & Media', 'Books and educational materials', 'books-media', 'active', 5),
  ('550e8400-e29b-41d4-a716-446655440006', 'Health & Beauty', 'Health and beauty products', 'health-beauty', 'active', 6),
  ('550e8400-e29b-41d4-a716-446655440007', 'Automotive', 'Car parts and accessories', 'automotive', 'active', 7),
  ('550e8400-e29b-41d4-a716-446655440008', 'Food & Beverages', 'Food and drink products', 'food-beverages', 'active', 8),
  ('550e8400-e29b-41d4-a716-446655440009', 'Toys & Games', 'Toys and gaming products', 'toys-games', 'active', 9),
  ('550e8400-e29b-41d4-a716-446655440010', 'Other', 'Miscellaneous items', 'other', 'active', 10)
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ===============================================
-- SETUP COMPLETE!
-- ===============================================
EOF

echo -e "${GREEN}✅ SQL file created: create_all_tables.sql${NC}"
echo ""

# Function to attempt different connection methods
attempt_psql_connection() {
    local connection_string=$1
    local method_name=$2
    
    echo -e "${YELLOW}🔌 Trying ${method_name}...${NC}"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if psql "$connection_string" -f create_all_tables.sql > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS: Tables created via ${method_name}!${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed: ${method_name}${NC}"
        return 1
    fi
}

# Try multiple connection methods
echo -e "${BLUE}🚀 Attempting database connections...${NC}"
echo ""

# Method 1: Direct connection
if command -v psql &> /dev/null; then
    echo -e "${BLUE}📡 PostgreSQL client found, attempting connections...${NC}"
    
    # Try different connection strings
    CONNECTION_STRINGS=(
        "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require"
        "postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
        "postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    )
    
    for i in "${!CONNECTION_STRINGS[@]}"; do
        if attempt_psql_connection "${CONNECTION_STRINGS[$i]}" "Method $((i+1))"; then
            echo ""
            echo -e "${GREEN}🎉 DATABASE SETUP COMPLETE!${NC}"
            echo -e "${GREEN}All tables have been created successfully!${NC}"
            echo ""
            echo -e "${BLUE}🔍 Run verification: node verify-database-setup.mjs${NC}"
            exit 0
        fi
    done
    
    echo -e "${RED}❌ All psql connection methods failed${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL client (psql) not found${NC}"
fi

# Method 2: Supabase CLI
echo ""
echo -e "${BLUE}🔧 Trying Supabase CLI methods...${NC}"

if command -v supabase &> /dev/null; then
    echo -e "${YELLOW}🔌 Supabase CLI found, attempting db push...${NC}"
    
    # Try supabase db push
    if npx supabase db push --db-url "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS: Tables created via Supabase CLI!${NC}"
        echo ""
        echo -e "${GREEN}🎉 DATABASE SETUP COMPLETE!${NC}"
        echo -e "${BLUE}🔍 Run verification: node verify-database-setup.mjs${NC}"
        exit 0
    else
        echo -e "${RED}❌ Supabase CLI push failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
fi

# Method 3: Manual instructions
echo ""
echo -e "${YELLOW}📋 MANUAL SETUP REQUIRED${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}Since automated methods failed, please use manual setup:${NC}"
echo ""
echo "1. 🌐 Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/sql"
echo "2. 📄 Copy the contents of: $(pwd)/create_all_tables.sql"
echo "3. 📋 Paste into the SQL Editor and click 'Run'"
echo ""

# Copy to clipboard if available
if command -v pbcopy &> /dev/null; then
    cat create_all_tables.sql | pbcopy
    echo -e "${GREEN}✅ SQL copied to clipboard!${NC}"
    echo -e "${BLUE}📋 Just paste (Cmd+V) in Supabase and run${NC}"
    echo ""
fi

# Open Supabase dashboard
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Opening Supabase SQL Editor...${NC}"
    open "https://supabase.com/dashboard/project/${PROJECT_REF}/sql"
elif command -v xdg-open &> /dev/null; then
    echo -e "${BLUE}🌐 Opening Supabase SQL Editor...${NC}"
    xdg-open "https://supabase.com/dashboard/project/${PROJECT_REF}/sql"
fi

echo ""
echo -e "${BLUE}📊 After running the SQL, verify with: node verify-database-setup.mjs${NC}"
echo ""
echo -e "${GREEN}🎯 This will create:${NC}"
echo "   ✅ 9 Essential tables (profiles, categories, products, orders, etc.)"
echo "   ✅ Row Level Security policies"
echo "   ✅ Automatic triggers and functions"
echo "   ✅ 10 Default product categories"
echo "   ✅ Performance indexes"
echo ""
echo -e "${GREEN}🚀 Your dashboards will work perfectly after this!${NC}"
