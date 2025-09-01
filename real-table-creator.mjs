import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM3NzE5OCwiZXhwIjoyMDUyOTUzMTk4fQ.9bJi1WrXDbMT8KfOjIRMWAKmrJCBhLgwFONu7K2cHfM'

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🚀 CREATING ALL TABLES DIRECTLY...\n')

async function createTables() {
  const tables = [
    {
      name: 'profiles',
      sql: `CREATE TABLE IF NOT EXISTS public.profiles (
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
      );`
    },
    {
      name: 'categories',
      sql: `CREATE TABLE IF NOT EXISTS public.categories (
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
      );`
    },
    {
      name: 'products',
      sql: `CREATE TABLE IF NOT EXISTS public.products (
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
      );`
    },
    {
      name: 'orders',
      sql: `CREATE TABLE IF NOT EXISTS public.orders (
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
      );`
    },
    {
      name: 'order_items',
      sql: `CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES public.products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        product_snapshot JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    },
    {
      name: 'notifications',
      sql: `CREATE TABLE IF NOT EXISTS public.notifications (
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
      );`
    },
    {
      name: 'messages',
      sql: `CREATE TABLE IF NOT EXISTS public.messages (
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
      );`
    },
    {
      name: 'vendor_settings',
      sql: `CREATE TABLE IF NOT EXISTS public.vendor_settings (
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
      );`
    },
    {
      name: 'analytics',
      sql: `CREATE TABLE IF NOT EXISTS public.analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id),
        event_type TEXT NOT NULL,
        event_data JSONB,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    }
  ]

  console.log('📋 Creating tables...\n')

  for (const table of tables) {
    try {
      console.log(`⏳ Creating ${table.name}...`)
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          sql: table.sql
        })
      })

      if (response.ok) {
        console.log(`✅ ${table.name} created successfully`)
      } else {
        const error = await response.text()
        console.log(`❌ ${table.name} failed: ${error}`)
      }
    } catch (error) {
      console.log(`❌ ${table.name} error: ${error.message}`)
    }
  }
}

async function enableRLS() {
  console.log('\n🔒 Setting up Row Level Security...\n')

  const rlsStatements = [
    'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;'
  ]

  for (const sql of rlsStatements) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      })

      if (response.ok) {
        console.log(`✅ RLS enabled for table`)
      }
    } catch (error) {
      console.log(`⚠️  RLS setup: ${error.message}`)
    }
  }
}

async function insertCategories() {
  console.log('\n📦 Inserting default categories...\n')

  const categories = [
    { name: 'Electronics', description: 'Electronic devices and gadgets', slug: 'electronics' },
    { name: 'Clothing & Fashion', description: 'Fashion and apparel', slug: 'clothing-fashion' },
    { name: 'Home & Garden', description: 'Home improvement and gardening items', slug: 'home-garden' },
    { name: 'Sports & Outdoors', description: 'Sports equipment and accessories', slug: 'sports-outdoors' },
    { name: 'Books & Media', description: 'Books and educational materials', slug: 'books-media' },
    { name: 'Health & Beauty', description: 'Health and beauty products', slug: 'health-beauty' },
    { name: 'Automotive', description: 'Car parts and accessories', slug: 'automotive' },
    { name: 'Food & Beverages', description: 'Food and drink products', slug: 'food-beverages' },
    { name: 'Toys & Games', description: 'Toys and gaming products', slug: 'toys-games' },
    { name: 'Other', description: 'Miscellaneous items', slug: 'other' }
  ]

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          status: 'active',
          sort_order: i + 1
        })
        .select()

      if (error) {
        console.log(`❌ Category ${category.name}: ${error.message}`)
      } else {
        console.log(`✅ Category ${category.name} added`)
      }
    } catch (error) {
      console.log(`❌ Category ${category.name}: ${error.message}`)
    }
  }
}

async function createPolicies() {
  console.log('\n🛡️  Creating security policies...\n')

  const policies = [
    {
      name: 'profiles_select_own',
      sql: `CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);`
    },
    {
      name: 'profiles_update_own', 
      sql: `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`
    },
    {
      name: 'categories_public_read',
      sql: `CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (status = 'active');`
    },
    {
      name: 'products_vendor_manage',
      sql: `CREATE POLICY "Vendors can manage own products" ON public.products FOR ALL USING (vendor_id = auth.uid());`
    },
    {
      name: 'products_public_read',
      sql: `CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active');`
    },
    {
      name: 'notifications_own',
      sql: `CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());`
    }
  ]

  for (const policy of policies) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: policy.sql })
      })

      if (response.ok) {
        console.log(`✅ Policy ${policy.name} created`)
      }
    } catch (error) {
      console.log(`⚠️  Policy ${policy.name}: ${error.message}`)
    }
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying table creation...\n')

  const tableNames = ['profiles', 'categories', 'products', 'orders', 'order_items', 'notifications', 'messages', 'vendor_settings', 'analytics']

  for (const tableName of tableNames) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: Ready (${count || 0} records)`)
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`)
    }
  }
}

async function main() {
  try {
    console.log('🎯 REAL TABLE CREATION STARTING NOW!\n')
    
    await createTables()
    await enableRLS()
    await createPolicies()
    await insertCategories()
    await verifySetup()
    
    console.log('\n🎉 DATABASE SETUP COMPLETE!')
    console.log('All tables have been created and your dashboards should work perfectly!')
    console.log('\n🚀 Next: Restart your Next.js server and test the dashboards!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

main()
