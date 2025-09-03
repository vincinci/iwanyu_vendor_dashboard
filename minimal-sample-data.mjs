import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addMinimalData() {
  console.log('🔧 ADDING MINIMAL SAMPLE DATA FOR TESTING')
  console.log('==========================================')

  try {
    // Get the existing vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .single()

    if (vendorError || !vendor) {
      console.error('No vendor found. Please ensure you have a vendor account.')
      return
    }

    console.log(`✅ Using vendor: ${vendor.full_name} (${vendor.email})`)

    // Clean existing products
    await supabase.from('products').delete().eq('vendor_id', vendor.id)
    console.log('🧹 Cleaned existing products')

    // Try to create just one product first to test the schema
    const testProduct = {
      vendor_id: vendor.id,
      name: 'Test iPhone 15 Pro',
      description: 'Latest iPhone with titanium design',
      price: 1200000.00,
      status: 'active',
      inventory_quantity: 25,
      sku: 'TEST-IP15P-001'
    }

    console.log('📝 Testing product creation with minimal schema...')
    
    const { data: createdProduct, error: productError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()

    if (productError) {
      console.error('Error creating test product:', productError)
      console.log('🔍 Let\'s check the actual products table schema...')
      
      // Try to get the table structure by doing a simple select
      const { data: existingProducts, error: selectError } = await supabase
        .from('products')
        .select('*')
        .limit(1)
      
      if (selectError) {
        console.error('Cannot access products table:', selectError)
      } else {
        console.log('✅ Products table exists and is accessible')
        console.log('Schema test complete. Please check the database schema.')
      }
      return
    }

    console.log('✅ Test product created successfully!')
    
    // If the test worked, create more products
    const moreProducts = [
      {
        vendor_id: vendor.id,
        name: 'Samsung Galaxy S24',
        description: 'Premium Android smartphone',
        price: 950000.00,
        status: 'active',
        inventory_quantity: 15,
        sku: 'SGS24-001'
      },
      {
        vendor_id: vendor.id,
        name: 'MacBook Air M3',
        description: 'Ultra-thin laptop with M3 chip',
        price: 1800000.00,
        status: 'active',
        inventory_quantity: 8,
        sku: 'MBA-M3-001'
      },
      {
        vendor_id: vendor.id,
        name: 'AirPods Pro',
        description: 'Wireless earbuds with noise cancellation',
        price: 350000.00,
        status: 'active',
        inventory_quantity: 50,
        sku: 'APP-001'
      },
      {
        vendor_id: vendor.id,
        name: 'iPad Pro',
        description: 'Professional tablet with M2 chip',
        price: 1400000.00,
        status: 'active',
        inventory_quantity: 3,
        sku: 'IPP-001'
      }
    ]

    const { data: moreCreatedProducts, error: moreProductsError } = await supabase
      .from('products')
      .insert(moreProducts)
      .select()

    if (moreProductsError) {
      console.error('Error creating additional products:', moreProductsError)
      return
    }

    console.log(`✅ Created ${moreCreatedProducts.length + 1} total products`)

    // Create simple orders
    const orders = [
      {
        order_number: 'ORD-2024-001',
        customer_email: vendor.email,
        customer_name: vendor.full_name,
        subtotal: 2550000.00,
        total_amount: 2550000.00,
        status: 'delivered'
      },
      {
        order_number: 'ORD-2024-002',
        customer_email: vendor.email,
        customer_name: vendor.full_name,
        subtotal: 1200000.00,
        total_amount: 1200000.00,
        status: 'processing'
      }
    ]

    const { data: createdOrders, error: orderError } = await supabase
      .from('orders')
      .insert(orders)
      .select()

    if (orderError) {
      console.error('Error creating orders:', orderError)
    } else {
      console.log(`✅ Created ${createdOrders.length} sample orders`)
    }

    console.log('\n🎉 SAMPLE DATA SETUP COMPLETE!')
    console.log('===============================')
    console.log('✅ Products created - your dashboard should show product count')
    console.log('✅ Orders created - your dashboard should show order metrics')
    console.log('✅ Low stock item: iPad Pro (3 units)')
    console.log('\n📊 Check your vendor dashboard at: http://localhost:3000/vendor')

  } catch (error) {
    console.error('❌ Error setting up sample data:', error)
  }
}

addMinimalData().catch(console.error)
