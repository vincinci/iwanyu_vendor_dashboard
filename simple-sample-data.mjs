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

async function addSimpleSampleData() {
  console.log('🔧 ADDING SIMPLE SAMPLE DATA')
  console.log('=============================')

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

    // Create a simple vendor store first (required for products)
    const { data: store, error: storeError } = await supabase
      .from('vendor_stores')
      .upsert({
        vendor_id: vendor.id,
        store_name: `${vendor.full_name}'s Store`,
        store_description: 'Premium electronics and gadgets',
        is_verified: true
      }, {
        onConflict: 'vendor_id'
      })
      .select()
      .single()

    if (storeError) {
      console.log('Note: Creating products without store reference')
      // Let's try without store_id if the table structure is different
    } else {
      console.log('✅ Vendor store ready')
    }

    // Create 5 simple products (try with and without store_id)
    const baseProduct = {
      vendor_id: vendor.id,
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone with titanium design',
      price: 1200000.00,
      category: 'Electronics',
      status: 'active',
      inventory_quantity: 25,
      sku: 'IP15P-001'
    }

    // Try with store_id first, then without if it fails
    let products = []
    if (store && !storeError) {
      products = [
        { ...baseProduct, store_id: store.id },
        {
          vendor_id: vendor.id,
          store_id: store.id,
          name: 'Samsung Galaxy S24',
          description: 'Premium Android smartphone',
          price: 950000.00,
          category: 'Electronics',
          status: 'active',
          inventory_quantity: 15,
          sku: 'SGS24-001'
        },
        {
          vendor_id: vendor.id,
          store_id: store.id,
          name: 'MacBook Air M3',
          description: 'Ultra-thin laptop with M3 chip',
          price: 1800000.00,
          category: 'Computers',
          status: 'active',
          inventory_quantity: 8,
          sku: 'MBA-M3-001'
        },
        {
          vendor_id: vendor.id,
          store_id: store.id,
          name: 'AirPods Pro',
          description: 'Wireless earbuds with noise cancellation',
          price: 350000.00,
          category: 'Electronics',
          status: 'active',
          inventory_quantity: 50,
          sku: 'APP-001'
        },
        {
          vendor_id: vendor.id,
          store_id: store.id,
          name: 'iPad Pro',
          description: 'Professional tablet with M2 chip',
          price: 1400000.00,
          category: 'Electronics',
          status: 'active',
          inventory_quantity: 3,
          sku: 'IPP-001'
        }
      ]
    } else {
      products = [
        baseProduct,
        {
          vendor_id: vendor.id,
          name: 'Samsung Galaxy S24',
          description: 'Premium Android smartphone',
          price: 950000.00,
          category: 'Electronics',
          status: 'active',
          inventory_quantity: 15,
          sku: 'SGS24-001'
        },
        {
          vendor_id: vendor.id,
          name: 'MacBook Air M3',
          description: 'Ultra-thin laptop with M3 chip',
          price: 1800000.00,
          category: 'Computers',
          status: 'active',
          inventory_quantity: 8,
          sku: 'MBA-M3-001'
        },
        {
          vendor_id: vendor.id,
          name: 'AirPods Pro',
          description: 'Wireless earbuds with noise cancellation',
          price: 350000.00,
          category: 'Electronics',
          status: 'active',
          inventory_quantity: 50,
          sku: 'APP-001'
        },
        {
          vendor_id: vendor.id,
          name: 'iPad Pro',
          description: 'Professional tablet with M2 chip',
          price: 1400000.00,
          category: 'Electronics',
          status: 'active',
          inventory_quantity: 3,
          sku: 'IPP-001'
        }
      ]
    }

    const { data: createdProducts, error: productError } = await supabase
      .from('products')
      .insert(products)
      .select()

    if (productError) {
      console.error('Error creating products:', productError)
      return
    }

    console.log(`✅ Created ${createdProducts.length} sample products`)

    // Create 3 simple orders
    const orders = [
      {
        order_number: 'ORD-2024-001',
        customer_email: vendor.email,
        customer_name: vendor.full_name,
        customer_phone: vendor.phone || '+250788123456',
        subtotal: 2550000.00,
        total_amount: 2550000.00,
        currency: 'RWF',
        status: 'delivered'
      },
      {
        order_number: 'ORD-2024-002',
        customer_email: vendor.email,
        customer_name: vendor.full_name,
        customer_phone: vendor.phone || '+250788123456',
        subtotal: 1200000.00,
        total_amount: 1200000.00,
        currency: 'RWF',
        status: 'processing'
      },
      {
        order_number: 'ORD-2024-003',
        customer_email: vendor.email,
        customer_name: vendor.full_name,
        customer_phone: vendor.phone || '+250788123456',
        subtotal: 700000.00,
        total_amount: 700000.00,
        currency: 'RWF',
        status: 'pending'
      }
    ]

    const { data: createdOrders, error: orderError } = await supabase
      .from('orders')
      .insert(orders)
      .select()

    if (orderError) {
      console.error('Error creating orders:', orderError)
      return
    }

    console.log(`✅ Created ${createdOrders.length} sample orders`)

    console.log('\n🎉 SAMPLE DATA SETUP COMPLETE!')
    console.log('===============================')
    console.log(`✅ ${createdProducts.length} products created`)
    console.log(`✅ ${createdOrders.length} orders created`)
    console.log('\n📊 Your dashboards should now show:')
    console.log('• Product count and revenue')
    console.log('• Recent orders')
    console.log('• Low stock alerts (iPad Pro has only 3 units)')
    console.log('\n🚀 Test at: http://localhost:3000')

  } catch (error) {
    console.error('❌ Error setting up sample data:', error)
  }
}

addSimpleSampleData().catch(console.error)
