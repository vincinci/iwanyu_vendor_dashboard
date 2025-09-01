import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 DATABASE SCHEMA INSPECTION')
console.log('=============================')

async function inspectProductsTable() {
    console.log('\n📊 Products Table Structure:')
    
    try {
        // Get table schema using PostgreSQL system tables
        const { data, error } = await supabase
            .rpc('get_table_columns', { table_name: 'products' })
            .catch(async () => {
                // Fallback: try to get table info through a simple query
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .limit(0)
                
                if (error) {
                    throw error
                }
                
                return { data: 'Schema query not available, but table exists' }
            })
        
        if (error) {
            console.log(`❌ Error: ${error.message}`)
            
            // Try to create a test product to see what columns are expected
            console.log('\n🧪 Testing with minimal product data...')
            const { data: testData, error: testError } = await supabase
                .from('products')
                .insert({
                    name: 'Test Product',
                    price: 1000,
                    vendor_id: '00000000-0000-0000-0000-000000000000', // This will fail, but shows required columns
                    status: 'draft'
                })
                .select()
            
            if (testError) {
                console.log(`Test error: ${testError.message}`)
                console.log('This tells us about required columns and constraints')
            }
        } else {
            console.log('✅ Schema data:', data)
        }
    } catch (err) {
        console.log(`❌ Schema inspection failed: ${err.message}`)
    }
}

async function checkTableColumns() {
    console.log('\n📋 Checking Required Columns:')
    
    // Check what columns exist by trying different variations
    const testColumns = [
        { name: 'name', required: true },
        { name: 'description', required: false },
        { name: 'price', required: true },
        { name: 'vendor_id', required: true },
        { name: 'category_id', required: false },
        { name: 'stock_quantity', required: false },
        { name: 'inventory_quantity', required: false },
        { name: 'status', required: true },
        { name: 'images', required: false },
        { name: 'created_at', required: false },
        { name: 'updated_at', required: false }
    ]
    
    for (const col of testColumns) {
        try {
            const { error } = await supabase
                .from('products')
                .select(col.name)
                .limit(1)
            
            if (error) {
                console.log(`❌ ${col.name}: Column does not exist`)
            } else {
                console.log(`✅ ${col.name}: Column exists`)
            }
        } catch (err) {
            console.log(`❌ ${col.name}: Error - ${err.message}`)
        }
    }
}

async function createSimpleProduct() {
    console.log('\n🧪 Creating Minimal Test Product:')
    
    const minimalProduct = {
        name: 'Test Product Simple',
        price: 1000,
        status: 'draft'
    }
    
    try {
        const { data, error } = await supabase
            .from('products')
            .insert(minimalProduct)
            .select()
        
        if (error) {
            console.log(`❌ Failed: ${error.message}`)
            console.log('This shows us what required fields are missing')
        } else {
            console.log(`✅ Created test product: ${data[0].id}`)
            
            // Clean up
            await supabase.from('products').delete().eq('id', data[0].id)
            console.log('✅ Cleaned up test product')
        }
    } catch (err) {
        console.log(`❌ Error: ${err.message}`)
    }
}

async function run() {
    await inspectProductsTable()
    await checkTableColumns()
    await createSimpleProduct()
}

run().catch(console.error)
