import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTcwODYsImV4cCI6MjA3MjA5MzA4Nn0.8diJpTeXd6WoWroW2CwdbQ6Gfusd2AeCc_r6dshRf78'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🧪 COMPREHENSIVE DASHBOARD TESTING')
console.log('===================================\n')

async function testDatabaseConnection() {
  console.log('🔌 Testing Database Connection...')
  
  try {
    // Test basic connection by attempting to query a system table
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    
    if (error) {
      console.log('❌ Database connection failed:', error.message)
      return false
    } else {
      console.log('✅ Database connection successful')
      return true
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message)
    return false
  }
}

async function testTables() {
  console.log('\n📊 Testing Table Access...')
  
  const tables = ['profiles', 'categories', 'products', 'orders', 'notifications', 'messages']
  const results = {}
  
  for (const table of tables) {
    try {
      // Try to access each table
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table does not exist`)
          results[table] = 'missing'
        } else if (error.message.includes('RLS') || error.message.includes('permission')) {
          console.log(`✅ ${table}: Table exists (protected by RLS)`)
          results[table] = 'exists'
        } else {
          console.log(`⚠️  ${table}: ${error.message}`)
          results[table] = 'error'
        }
      } else {
        console.log(`✅ ${table}: Accessible (${data?.length || 0} records)`)
        results[table] = 'accessible'
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
      results[table] = 'error'
    }
  }
  
  return results
}

async function testCategoriesData() {
  console.log('\n📦 Testing Categories Data...')
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, status')
      .eq('status', 'active')
    
    if (error) {
      console.log('❌ Categories query failed:', error.message)
      return false
    } else {
      console.log(`✅ Categories loaded: ${data.length} active categories`)
      if (data.length > 0) {
        console.log('   Sample categories:', data.slice(0, 3).map(c => c.name).join(', '))
      }
      return data.length > 0
    }
  } catch (err) {
    console.log('❌ Categories test error:', err.message)
    return false
  }
}

async function testStorageBucket() {
  console.log('\n💾 Testing Storage Bucket...')
  
  try {
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log('❌ Storage access failed:', error.message)
      return false
    } else {
      const productsBucket = data.find(bucket => bucket.id === 'products')
      if (productsBucket) {
        console.log('✅ Products storage bucket exists')
        return true
      } else {
        console.log('❌ Products storage bucket missing')
        return false
      }
    }
  } catch (err) {
    console.log('❌ Storage test error:', err.message)
    return false
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Configuration...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  let allPresent = true
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configured`)
    } else {
      console.log(`❌ ${varName}: Missing`)
      allPresent = false
    }
  }
  
  return allPresent
}

async function testApiEndpoints() {
  console.log('\n🔗 Testing API Connectivity...')
  
  try {
    // Test the REST API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ REST API endpoint accessible')
      return true
    } else {
      console.log(`❌ REST API failed: ${response.status} ${response.statusText}`)
      return false
    }
  } catch (err) {
    console.log('❌ API test error:', err.message)
    return false
  }
}

async function generateTestReport(tableResults, connectionTest, categoriesTest, storageTest, envTest, apiTest) {
  console.log('\n📋 COMPREHENSIVE TEST REPORT')
  console.log('=====================================')
  
  const tableCount = Object.values(tableResults).filter(status => 
    status === 'exists' || status === 'accessible'
  ).length
  
  const totalTables = Object.keys(tableResults).length
  
  console.log(`🔌 Database Connection: ${connectionTest ? '✅ Working' : '❌ Failed'}`)
  console.log(`📊 Tables Status: ${tableCount}/${totalTables} accessible`)
  console.log(`📦 Categories Data: ${categoriesTest ? '✅ Loaded' : '❌ Missing'}`)
  console.log(`💾 Storage Bucket: ${storageTest ? '✅ Ready' : '❌ Missing'}`)
  console.log(`🔧 Environment: ${envTest ? '✅ Configured' : '❌ Issues'}`)
  console.log(`🔗 API Endpoints: ${apiTest ? '✅ Working' : '❌ Failed'}`)
  
  console.log('\n📊 TABLE DETAILS:')
  for (const [table, status] of Object.entries(tableResults)) {
    const icon = status === 'accessible' || status === 'exists' ? '✅' : 
                 status === 'missing' ? '❌' : '⚠️ '
    console.log(`   ${icon} ${table}: ${status}`)
  }
  
  console.log('\n🎯 OVERALL STATUS:')
  if (connectionTest && tableCount >= 6 && categoriesTest) {
    console.log('🎉 DASHBOARD READY! Your vendor and admin dashboards should work perfectly.')
    console.log('\n🚀 Next Steps:')
    console.log('1. Start dev server: npm run dev')
    console.log('2. Visit: http://localhost:3000')
    console.log('3. Test vendor and admin dashboards')
    console.log('4. Create test accounts and add products')
  } else if (tableCount > 0) {
    console.log('⚠️  PARTIAL SETUP: Some functionality may work, but complete setup recommended.')
  } else {
    console.log('❌ SETUP INCOMPLETE: Please run the SQL script in Supabase Dashboard.')
    console.log('\nRequired Actions:')
    console.log('1. Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql')
    console.log('2. Paste and run the content from create_all_tables.sql')
  }
}

async function main() {
  const connectionTest = await testDatabaseConnection()
  const tableResults = await testTables()
  const categoriesTest = await testCategoriesData()
  const storageTest = await testStorageBucket()
  const envTest = await testEnvironmentVariables()
  const apiTest = await testApiEndpoints()
  
  await generateTestReport(tableResults, connectionTest, categoriesTest, storageTest, envTest, apiTest)
}

main().catch(console.error)
