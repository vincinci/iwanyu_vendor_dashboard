import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzcxOTgsImV4cCI6MjA1Mjk1MzE5OH0.h2q7ShPHHhEyQdLVXECfFFjuB3R4P5_qYPdyTnCfwkA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 VERIFYING TABLE CREATION...\n')

async function checkTables() {
  const tables = [
    'profiles',
    'categories', 
    'products',
    'orders',
    'order_items',
    'notifications',
    'messages',
    'vendor_settings',
    'analytics'
  ]

  const results = []

  for (const table of tables) {
    try {
      console.log(`⏳ Checking ${table}...`)
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table} - Table does not exist`)
          results.push({ table, status: 'missing', error: 'Table does not exist' })
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.log(`✅ ${table} - Table exists (RLS protected)`)
          results.push({ table, status: 'exists', count: 'protected' })
        } else {
          console.log(`⚠️  ${table} - ${error.message}`)
          results.push({ table, status: 'error', error: error.message })
        }
      } else {
        console.log(`✅ ${table} - Ready (${count || 0} records)`)
        results.push({ table, status: 'ready', count: count || 0 })
      }
    } catch (err) {
      console.log(`❌ ${table} - ${err.message}`)
      results.push({ table, status: 'error', error: err.message })
    }
  }

  return results
}

async function checkCategories() {
  try {
    console.log(`\n📦 Checking categories data...`)
    
    const { data, error } = await supabase
      .from('categories')
      .select('name, slug')
      .limit(5)
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ Categories table missing`)
        return { status: 'missing' }
      } else {
        console.log(`⚠️  Categories error: ${error.message}`)
        return { status: 'error', error: error.message }
      }
    } else {
      console.log(`✅ Categories data loaded (${data.length} sample records)`)
      if (data.length > 0) {
        console.log(`   Sample: ${data.map(c => c.name).join(', ')}`)
      }
      return { status: 'ready', count: data.length }
    }
  } catch (err) {
    console.log(`❌ Categories check failed: ${err.message}`)
    return { status: 'error', error: err.message }
  }
}

async function main() {
  console.log('📊 TABLE VERIFICATION RESULTS')
  console.log('=====================================')
  
  const tableResults = await checkTables()
  const categoriesResult = await checkCategories()
  
  console.log('\n📋 SUMMARY:')
  console.log('=====================================')
  
  const existingTables = tableResults.filter(r => r.status === 'exists' || r.status === 'ready').length
  const missingTables = tableResults.filter(r => r.status === 'missing').length
  const totalTables = tableResults.length
  
  console.log(`Tables Found: ${existingTables}/${totalTables}`)
  console.log(`Tables Missing: ${missingTables}/${totalTables}`)
  
  if (existingTables === totalTables) {
    console.log('\n🎉 ALL TABLES CREATED SUCCESSFULLY!')
    console.log('✅ Your vendor and admin dashboards should now work perfectly!')
    console.log('\n🚀 Next Steps:')
    console.log('1. Restart your Next.js development server')
    console.log('2. Test the dashboards - console errors should be gone')
    console.log('3. Try creating a vendor account and adding products')
  } else if (existingTables > 0) {
    console.log('\n⚠️  PARTIAL SETUP DETECTED')
    console.log(`${existingTables} tables exist, ${missingTables} are missing.`)
    console.log('Some functionality may work, but complete setup is recommended.')
  } else {
    console.log('\n❌ NO TABLES FOUND')
    console.log('Please run the SQL script in Supabase Dashboard:')
    console.log('1. Go to: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql')
    console.log('2. Copy content from create_all_tables.sql')
    console.log('3. Paste and execute')
  }
  
  console.log('\n' + '='.repeat(50))
}

main().catch(console.error)
