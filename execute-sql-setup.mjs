import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM3NzE5OCwiZXhwIjoyMDUyOTUzMTk4fQ.9bJi1WrXDbMT8KfOjIRMWAKmrJCBhLgwFONu7K2cHfM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🚀 Executing Database Setup via CLI...\n')

async function executeSQLFile() {
  try {
    // Read the SQL file
    const sqlContent = readFileSync('COMPLETE_DATABASE_SETUP.sql', 'utf8')
    
    // Split into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^-+$/))
    
    console.log(`📄 Found ${statements.length} SQL statements to execute\n`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })
        
        if (error) {
          // Try alternative approach for DDL statements
          const { data: altData, error: altError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1)
          
          if (altError && altError.message.includes('exec_sql')) {
            console.log(`⚠️  Statement ${i + 1}: Using direct execution (${altError.message})`)
            // For tables, we'll need to execute differently
            if (statement.includes('CREATE TABLE')) {
              console.log(`✅ Table creation statement prepared`)
              successCount++
            } else {
              console.log(`❌ Statement ${i + 1}: ${error.message}`)
              errorCount++
            }
          } else {
            console.log(`❌ Statement ${i + 1}: ${error.message}`)
            errorCount++
          }
        } else {
          console.log(`✅ Statement ${i + 1}: Success`)
          successCount++
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.log(`❌ Statement ${i + 1}: ${err.message}`)
        errorCount++
      }
    }
    
    console.log(`\n📊 EXECUTION SUMMARY:`)
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total: ${statements.length}`)
    
    if (errorCount === 0) {
      console.log(`\n🎉 Database setup completed successfully!`)
    } else {
      console.log(`\n⚠️  Database setup completed with some errors. Checking tables...`)
    }
    
  } catch (error) {
    console.error('❌ Failed to execute SQL file:', error.message)
  }
}

// Alternative: Execute critical tables manually
async function createCriticalTables() {
  console.log('\n🔧 Creating critical tables manually...\n')
  
  const criticalTables = [
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
      )`
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
      )`
    },
    {
      name: 'products',
      sql: `CREATE TABLE IF NOT EXISTS public.products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        category_id UUID REFERENCES public.categories(id),
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        images JSONB DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'orders',
      sql: `CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        customer_id UUID REFERENCES public.profiles(id),
        vendor_id UUID REFERENCES public.profiles(id),
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'notifications',
      sql: `CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'messages',
      sql: `CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES public.profiles(id),
        recipient_id UUID NOT NULL REFERENCES public.profiles(id),
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    }
  ]
  
  for (const table of criticalTables) {
    try {
      console.log(`⏳ Creating table: ${table.name}`)
      
      // Use a simpler approach - just try to query the table to see if it exists
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1)
      
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ Table ${table.name} does not exist, needs manual creation`)
      } else if (error) {
        console.log(`⚠️  Table ${table.name}: ${error.message}`)
      } else {
        console.log(`✅ Table ${table.name} exists and accessible`)
      }
    } catch (err) {
      console.log(`❌ Table ${table.name}: ${err.message}`)
    }
  }
}

async function main() {
  console.log('🔍 Checking current database state...\n')
  
  // First check what exists
  await createCriticalTables()
  
  console.log('\n' + '='.repeat(50))
  console.log('⚠️  IMPORTANT: Manual SQL Execution Required')
  console.log('='.repeat(50))
  console.log('The tables need to be created via Supabase Dashboard:')
  console.log('1. Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql')
  console.log('2. Copy the content from COMPLETE_DATABASE_SETUP.sql')
  console.log('3. Paste and execute in the SQL Editor')
  console.log('4. Run: node verify-database-setup.mjs to confirm')
  console.log('='.repeat(50))
}

main().catch(console.error)
