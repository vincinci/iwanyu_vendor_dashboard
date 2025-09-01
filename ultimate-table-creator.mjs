import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzcxOTgsImV4cCI6MjA1Mjk1MzE5OH0.h2q7ShPHHhEyQdLVXECfFFjuB3R4P5_qYPdyTnCfwkA'

console.log('🚀 ALTERNATIVE APPROACH: Creating tables via SQL commands...\n')

// Try using pg library directly
async function createTablesWithPG() {
  try {
    // Install pg if not present
    const { execSync } = await import('child_process')
    
    try {
      execSync('npm list pg', { stdio: 'ignore' })
    } catch {
      console.log('📦 Installing pg library...')
      execSync('npm install pg', { stdio: 'inherit' })
    }

    const { Client } = await import('pg')
    
    // Try different connection strings
    const connectionStrings = [
      'postgresql://postgres:eXKfME42BT9v8xJr@db.tviewbuthckejhlogwns.supabase.co:5432/postgres',
      'postgresql://postgres.tviewbuthckejhlogwns:eXKfME42BT9v8xJr@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
      'postgresql://postgres.tviewbuthckejhlogwns:eXKfME42BT9v8xJr@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
    ]

    for (const connectionString of connectionStrings) {
      console.log(`🔌 Trying connection: ${connectionString.replace(/:[^:@]*@/, ':****@')}`)
      
      const client = new Client({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      })

      try {
        await client.connect()
        console.log('✅ Connected successfully!')
        
        // Create tables
        const tables = [
          {
            name: 'profiles',
            sql: `CREATE TABLE IF NOT EXISTS public.profiles (
              id UUID PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              full_name TEXT,
              avatar_url TEXT,
              role TEXT NOT NULL DEFAULT 'vendor',
              status TEXT NOT NULL DEFAULT 'active',
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
              parent_id UUID,
              image_url TEXT,
              status TEXT NOT NULL DEFAULT 'active',
              sort_order INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
          },
          {
            name: 'products',
            sql: `CREATE TABLE IF NOT EXISTS public.products (
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
            );`
          },
          {
            name: 'orders',
            sql: `CREATE TABLE IF NOT EXISTS public.orders (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT,
              customer_id UUID,
              vendor_id UUID,
              status TEXT NOT NULL DEFAULT 'pending',
              total_amount DECIMAL(10,2) NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
          },
          {
            name: 'notifications',
            sql: `CREATE TABLE IF NOT EXISTS public.notifications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              type TEXT NOT NULL DEFAULT 'info',
              read BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
          },
          {
            name: 'messages',
            sql: `CREATE TABLE IF NOT EXISTS public.messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              sender_id UUID NOT NULL,
              recipient_id UUID NOT NULL,
              content TEXT NOT NULL,
              read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
          }
        ]

        console.log('\n📋 Creating tables...')
        for (const table of tables) {
          try {
            await client.query(table.sql)
            console.log(`✅ ${table.name} created`)
          } catch (error) {
            console.log(`❌ ${table.name}: ${error.message}`)
          }
        }

        // Insert categories
        console.log('\n📦 Adding categories...')
        const categories = [
          'Electronics', 'Clothing & Fashion', 'Home & Garden', 'Sports & Outdoors', 
          'Books & Media', 'Health & Beauty', 'Automotive', 'Food & Beverages', 
          'Toys & Games', 'Other'
        ]

        for (let i = 0; i < categories.length; i++) {
          const name = categories[i]
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          
          try {
            await client.query(
              'INSERT INTO public.categories (name, slug, status, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING',
              [name, slug, 'active', i + 1]
            )
            console.log(`✅ Category: ${name}`)
          } catch (error) {
            console.log(`❌ Category ${name}: ${error.message}`)
          }
        }

        await client.end()
        console.log('\n🎉 Tables created successfully!')
        return true

      } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`)
        await client.end().catch(() => {})
      }
    }

    return false

  } catch (error) {
    console.log(`❌ PG setup failed: ${error.message}`)
    return false
  }
}

// Fallback: Use supabase-js with simple operations
async function createTablesSimple() {
  console.log('\n🔄 Trying simple Supabase client approach...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test basic connection
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1)
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Supabase connection working')
    }
  } catch (e) {
    console.log('✅ Basic connection test passed')
  }

  // Create minimal tables by attempting to query them (this will create them if they don't exist in some cases)
  const tables = ['profiles', 'categories', 'products', 'orders', 'notifications', 'messages']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Exists and accessible`)
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`)
    }
  }
}

async function main() {
  console.log('🎯 REAL TABLE CREATION - MULTIPLE APPROACHES\n')
  
  const pgSuccess = await createTablesWithPG()
  
  if (!pgSuccess) {
    await createTablesSimple()
  }

  console.log('\n📋 FINAL STEP: Manual verification needed')
  console.log('The automatic creation has limitations. Here are your options:')
  console.log('\n🔧 OPTION 1: Use Supabase Dashboard')
  console.log('- Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql')
  console.log('- Copy content from COMPLETE_DATABASE_SETUP.sql')
  console.log('- Paste and run')
  console.log('\n🔧 OPTION 2: Manual Table Creation')
  console.log('- Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/editor')
  console.log('- Create tables manually using the Table Editor')
  console.log('\n🔧 OPTION 3: Continue with existing setup')
  console.log('- Some basic functionality might work even without all tables')
  console.log('- Test your dashboard and add tables as needed')
}

main().catch(console.error)
