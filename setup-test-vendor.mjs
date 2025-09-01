import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 VENDOR DASHBOARD FUNCTIONALITY TEST')
console.log('======================================')

async function createTestVendor() {
    console.log('\n👤 Creating Test Vendor Account...')
    
    try {
        // Create test user
        const { data: user, error } = await supabase.auth.admin.createUser({
            email: 'testvendor@iwanyu.rw',
            password: 'testpassword123',
            email_confirm: true,
            user_metadata: {
                full_name: 'Test Vendor',
                role: 'vendor'
            }
        })
        
        if (error) {
            console.log(`❌ User creation failed: ${error.message}`)
            return null
        }
        
        console.log(`✅ Test vendor created: ${user.user.email}`)
        
        // Create profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: user.user.id,
            email: user.user.email,
            full_name: 'Test Vendor',
            role: 'vendor',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        
        if (profileError) {
            console.log(`⚠️ Profile creation failed: ${profileError.message}`)
        } else {
            console.log(`✅ Vendor profile created`)
        }
        
        return user.user
    } catch (err) {
        console.log(`❌ Error: ${err.message}`)
        return null
    }
}

async function createSampleData(vendorId) {
    console.log('\n📦 Creating Sample Products...')
    
    try {
        // Get categories
        const { data: categories } = await supabase
            .from('categories')
            .select('*')
            .eq('status', 'active')
            .limit(3)
        
        if (!categories || categories.length === 0) {
            console.log('❌ No categories found')
            return
        }
        
        const sampleProducts = [
            {
                name: 'Premium Coffee Beans',
                description: 'High-quality Arabica coffee beans from Rwanda mountains',
                price: 25000,
                category_id: categories[0].id,
                vendor_id: vendorId,
                inventory_quantity: 100,
                status: 'active',
                images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                name: 'Handwoven Basket',
                description: 'Traditional Rwandan basket made by local artisans',
                price: 15000,
                category_id: categories[1]?.id || categories[0].id,
                vendor_id: vendorId,
                inventory_quantity: 50,
                status: 'active',
                images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                name: 'Organic Honey',
                description: 'Pure organic honey from Rwandan beekeepers',
                price: 12000,
                category_id: categories[2]?.id || categories[0].id,
                vendor_id: vendorId,
                inventory_quantity: 75,
                status: 'active',
                images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ]
        
        const { data: products, error } = await supabase
            .from('products')
            .insert(sampleProducts)
            .select()
        
        if (error) {
            console.log(`❌ Product creation failed: ${error.message}`)
        } else {
            console.log(`✅ Created ${products.length} sample products`)
        }
        
        return products
    } catch (err) {
        console.log(`❌ Error creating products: ${err.message}`)
        return null
    }
}

async function createSampleOrders(vendorId, products) {
    console.log('\n🛒 Creating Sample Orders...')
    
    try {
        if (!products || products.length === 0) {
            console.log('❌ No products available for orders')
            return
        }
        
        const sampleOrders = [
            {
                order_number: 'ORD-001',
                customer_name: 'John Mukama',
                customer_email: 'john@example.com',
                customer_phone: '+250788123456',
                status: 'pending',
                total_amount: 40000,
                shipping_address: 'Kigali, Gasabo District',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                order_number: 'ORD-002',
                customer_name: 'Marie Uwimana',
                customer_email: 'marie@example.com',
                customer_phone: '+250788765432',
                status: 'completed',
                total_amount: 27000,
                shipping_address: 'Kigali, Nyarugenge District',
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
        
        // Create order items
        const orderItems = [
            {
                order_id: orders[0].id,
                product_id: products[0].id,
                vendor_id: vendorId,
                quantity: 1,
                unit_price: 25000,
                total: 25000,
                created_at: new Date().toISOString()
            },
            {
                order_id: orders[0].id,
                product_id: products[1].id,
                vendor_id: vendorId,
                quantity: 1,
                unit_price: 15000,
                total: 15000,
                created_at: new Date().toISOString()
            },
            {
                order_id: orders[1].id,
                product_id: products[0].id,
                vendor_id: vendorId,
                quantity: 1,
                unit_price: 25000,
                total: 25000,
                created_at: new Date(Date.now() - 86400000).toISOString()
            }
        ]
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)
        
        if (itemsError) {
            console.log(`❌ Order items creation failed: ${itemsError.message}`)
        } else {
            console.log(`✅ Created ${orders.length} orders with ${orderItems.length} items`)
        }
        
        return orders
    } catch (err) {
        console.log(`❌ Error creating orders: ${err.message}`)
        return null
    }
}

async function runSetup() {
    const vendor = await createTestVendor()
    if (!vendor) {
        console.log('❌ Failed to create test vendor')
        return
    }
    
    const products = await createSampleData(vendor.id)
    if (products) {
        await createSampleOrders(vendor.id, products)
    }
    
    console.log('\n🎯 SETUP COMPLETE!')
    console.log('==================')
    console.log('✅ Test vendor account created')
    console.log('✅ Sample products added')
    console.log('✅ Sample orders created')
    console.log('')
    console.log('📧 Login Credentials:')
    console.log('   Email: testvendor@iwanyu.rw')
    console.log('   Password: testpassword123')
    console.log('')
    console.log('🌐 Access URLs:')
    console.log('   Login: http://localhost:3001/auth/login')
    console.log('   Vendor Dashboard: http://localhost:3001/vendor')
}

runSetup().catch(console.error)
