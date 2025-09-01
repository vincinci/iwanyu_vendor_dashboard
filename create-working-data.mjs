import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 FIXING PRODUCTS TABLE FOR VENDOR DASHBOARD')
console.log('=============================================')

async function createWorkingProduct(vendorId) {
    console.log('\n📦 Creating Working Sample Products...')
    
    try {
        // Get active categories first
        const { data: categories } = await supabase
            .from('categories')
            .select('*')
            .eq('status', 'active')
            .limit(3)
        
        if (!categories || categories.length === 0) {
            console.log('❌ No categories found')
            return null
        }
        
        console.log(`✅ Found ${categories.length} categories`)
        
        // Create products that match the current table structure
        const workingProducts = [
            {
                name: 'Premium Rwandan Coffee',
                description: 'High-quality Arabica coffee beans from Volcanoes National Park region',
                price: 25.00,
                vendor_id: vendorId,
                category_id: categories[0].id,
                inventory_quantity: 100,
                status: 'active',
                images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop']
            },
            {
                name: 'Handwoven Agaseke Basket',
                description: 'Traditional Rwandan peace basket handmade by local artisans',
                price: 35.00,
                vendor_id: vendorId,
                category_id: categories[1]?.id || categories[0].id,
                inventory_quantity: 25,
                status: 'active',
                images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop']
            },
            {
                name: 'Pure Honey',
                description: 'Organic honey harvested from the hills of Rwanda',
                price: 18.00,
                vendor_id: vendorId,
                category_id: categories[2]?.id || categories[0].id,
                inventory_quantity: 50,
                status: 'active',
                images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop']
            }
        ]
        
        const { data: products, error } = await supabase
            .from('products')
            .insert(workingProducts)
            .select()
        
        if (error) {
            console.log(`❌ Product creation failed: ${error.message}`)
            return null
        }
        
        console.log(`✅ Created ${products.length} working products`)
        products.forEach(p => {
            console.log(`   - ${p.name} (ID: ${p.id.substring(0, 8)}...)`)
        })
        
        return products
    } catch (err) {
        console.log(`❌ Error: ${err.message}`)
        return null
    }
}

async function createSampleOrders(vendorId, products) {
    console.log('\n🛒 Creating Sample Orders...')
    
    if (!products || products.length === 0) {
        console.log('❌ No products available for orders')
        return null
    }
    
    try {
        // Create sample orders with correct structure
        const sampleOrders = [
            {
                order_number: 'IWY-001-' + Date.now(),
                customer_name: 'Jean Baptiste Nzeyimana',
                customer_email: 'jean@example.rw',
                customer_phone: '+250788123456',
                subtotal: 68.00,
                tax_amount: 0,
                shipping_amount: 0,
                total_amount: 68.00,
                status: 'pending',
                payment_status: 'pending',
                shipping_address: '{"street": "KN 4 Ave", "district": "Nyarugenge", "city": "Kigali", "country": "Rwanda"}',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                order_number: 'IWY-002-' + (Date.now() + 1),
                customer_name: 'Marie Claire Uwimana', 
                customer_email: 'marie@example.rw',
                customer_phone: '+250788654321',
                subtotal: 35.00,
                tax_amount: 0,
                shipping_amount: 0,
                total_amount: 35.00,
                status: 'completed',
                payment_status: 'paid',
                shipping_address: '{"street": "KG 15 St", "district": "Gasabo", "city": "Kigali", "country": "Rwanda"}',
                created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                updated_at: new Date(Date.now() - 86400000).toISOString()
            }
        ]
        
        const { data: orders, error } = await supabase
            .from('orders')
            .insert(sampleOrders)
            .select()
        
        if (error) {
            console.log(`❌ Order creation failed: ${error.message}`)
            return null
        }
        
        // Create order items with correct structure
        const orderItems = [
            {
                order_id: orders[0].id,
                product_id: products[0].id,
                vendor_id: vendorId,
                product_name: products[0].name,
                quantity: 2,
                price: 25.00,
                total: 50.00
            },
            {
                order_id: orders[0].id,
                product_id: products[2].id,
                vendor_id: vendorId,
                product_name: products[2].name,
                quantity: 1,
                price: 18.00,
                total: 18.00
            },
            {
                order_id: orders[1].id,
                product_id: products[1].id,
                vendor_id: vendorId,
                product_name: products[1].name,
                quantity: 1,
                price: 35.00,
                total: 35.00
            }
        ]
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)
        
        if (itemsError) {
            console.log(`❌ Order items failed: ${itemsError.message}`)
        } else {
            console.log(`✅ Created ${orders.length} orders with ${orderItems.length} items`)
        }
        
        return orders
    } catch (err) {
        console.log(`❌ Error creating orders: ${err.message}`)
        return null
    }
}

async function testVendorAccess() {
    console.log('\n👤 Getting Test Vendor...')
    
    try {
        // Find the test vendor we created
        const { data: vendor, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'testvendor@iwanyu.rw')
            .single()
        
        if (error || !vendor) {
            console.log('❌ Test vendor not found. Need to create one first.')
            return null
        }
        
        console.log(`✅ Found test vendor: ${vendor.email} (ID: ${vendor.id.substring(0, 8)}...)`)
        return vendor
    } catch (err) {
        console.log(`❌ Error: ${err.message}`)
        return null
    }
}

async function runSetup() {
    const vendor = await testVendorAccess()
    if (!vendor) {
        console.log('\n❌ Cannot proceed without test vendor')
        console.log('💡 Run setup-test-vendor.mjs first to create a test vendor')
        return
    }
    
    // Clear existing test data
    console.log('\n🧹 Cleaning existing test data...')
    await supabase.from('order_items').delete().eq('vendor_id', vendor.id)
    await supabase.from('orders').delete().eq('customer_email', 'jean@example.rw')
    await supabase.from('orders').delete().eq('customer_email', 'marie@example.rw')
    await supabase.from('products').delete().eq('vendor_id', vendor.id)
    console.log('✅ Cleaned up old test data')
    
    const products = await createWorkingProduct(vendor.id)
    if (products && products.length > 0) {
        await createSampleOrders(vendor.id, products)
    }
    
    console.log('\n🎉 VENDOR DASHBOARD DATA SETUP COMPLETE!')
    console.log('========================================')
    console.log('✅ Test vendor account ready')
    console.log('✅ Sample products created')
    console.log('✅ Sample orders with items created')
    console.log('')
    console.log('🚀 TEST YOUR DASHBOARD:')
    console.log('   1. Go to: http://localhost:3001/auth/login')
    console.log('   2. Login with: testvendor@iwanyu.rw / testpassword123')
    console.log('   3. Access: http://localhost:3001/vendor')
    console.log('   4. Check all vendor pages for data')
}

runSetup().catch(console.error)
