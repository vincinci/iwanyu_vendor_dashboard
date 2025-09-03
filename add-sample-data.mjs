#!/usr/bin/env node

/**
 * ADD REAL SAMPLE DATA FOR TESTING
 * Creates sample products and orders to test dashboard functionality
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { randomUUID } from 'crypto'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleData() {
  console.log('🔧 ADDING SAMPLE DATA FOR DASHBOARD TESTING')
  console.log('==============================================')

  try {
    // Find existing vendor or create one
    let { data: vendor } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .single()

    if (!vendor) {
      console.log('Creating test vendor...')
      const { data: newVendor, error } = await supabase
        .from('profiles')
        .insert({
          id: randomUUID(),
          email: 'testvendor@iwanyu.rw',
          full_name: 'Test Vendor',
          role: 'vendor',
          status: 'active'
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating vendor:', error)
        return
      }
      vendor = newVendor
    }

    console.log(`✅ Using vendor: ${vendor.full_name} (${vendor.email})`)

    // Clear existing products for this vendor
    await supabase.from('products').delete().eq('vendor_id', vendor.id)
    console.log('🧹 Cleaned existing products')

    // Create sample products
    const sampleProducts = [
      {
        id: randomUUID(),
        vendor_id: vendor.id,
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with Pro camera system and titanium design',
        price: 1200000,
        inventory_quantity: 5,
        status: 'active'
      },
      {
        id: randomUUID(),
        vendor_id: vendor.id,
        name: 'Samsung Galaxy S24',
        description: 'Samsung flagship with AI-powered photography',
        price: 950000,
        inventory_quantity: 8,
        status: 'active'
      },
      {
        id: randomUUID(),
        vendor_id: vendor.id,
        name: 'MacBook Air M3',
        description: 'Ultra-thin laptop with M3 chip for ultimate performance',
        price: 1800000,
        inventory_quantity: 3,
        status: 'active'
      },
      {
        id: randomUUID(),
        vendor_id: vendor.id,
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        price: 350000,
        inventory_quantity: 12,
        status: 'active'
      },
      {
        id: randomUUID(),
        vendor_id: vendor.id,
        name: 'iPad Pro 12.9"',
        description: 'Professional tablet with M2 chip and Liquid Retina display',
        price: 1400000,
        inventory_quantity: 2,
        status: 'active'
      }
    ]

    const { data: products, error: productError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select()

    if (productError) {
      console.error('Error creating products:', productError)
      return
    }

    console.log(`✅ Created ${products.length} sample products`)

    // Use existing vendor as customer for sample orders (simplifies auth constraints)
    const customer = vendor
    console.log('📝 Using existing vendor as customer for sample orders...')

    // Create sample orders
    const sampleOrders = [
      {
        id: randomUUID(),
        customer_id: customer.id,
        vendor_id: vendor.id,
        order_number: `ORD-${Date.now()}-1`,
        total_amount: 1200000,
        status: 'confirmed',
        payment_status: 'paid',
        currency: 'RWF',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: randomUUID(),
        customer_id: customer.id,
        vendor_id: vendor.id,
        order_number: `ORD-${Date.now()}-2`,
        total_amount: 950000,
        status: 'processing',
        payment_status: 'paid',
        currency: 'RWF',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: randomUUID(),
        customer_id: customer.id,
        vendor_id: vendor.id,
        order_number: `ORD-${Date.now()}-3`,
        total_amount: 700000,
        status: 'delivered',
        payment_status: 'paid',
        currency: 'RWF',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      }
    ]

    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .insert(sampleOrders)
      .select()

    if (orderError) {
      console.error('Error creating orders:', orderError)
      return
    }

    // Create order items
    const orderItems = [
      {
        order_id: orders[0].id,
        product_id: products[0].id, // iPhone 15 Pro
        vendor_id: vendor.id,
        quantity: 1,
        unit_price: 1200000,
        total_price: 1200000
      },
      {
        order_id: orders[1].id,
        product_id: products[1].id, // Samsung Galaxy S24
        vendor_id: vendor.id,
        quantity: 1,
        unit_price: 950000,
        total_price: 950000
      },
      {
        order_id: orders[2].id,
        product_id: products[3].id, // AirPods Pro
        vendor_id: vendor.id,
        quantity: 2,
        unit_price: 350000,
        total_price: 700000
      }
    ]

    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemError) {
      console.error('Error creating order items:', itemError)
      return
    }

    console.log(`✅ Created ${orders.length} sample orders with items`)

    // Create admin user if doesn't exist
    let { data: admin } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .single()

    if (!admin) {
      const { data: newAdmin, error } = await supabase
        .from('profiles')
        .insert({
          id: randomUUID(),
          email: 'admin@iwanyu.rw',
          full_name: 'Admin User',
          role: 'admin',
          status: 'active'
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating admin:', error)
      } else {
        console.log(`✅ Created admin user: ${newAdmin.email}`)
      }
    }

    console.log('\n🎉 SAMPLE DATA CREATION COMPLETE!')
    console.log('=================================')
    console.log('✅ Sample products added')
    console.log('✅ Sample orders created')
    console.log('✅ Dashboard should now show real data')
    console.log('')
    console.log('🚀 TEST YOUR DASHBOARD:')
    console.log(`   Vendor Login: ${vendor.email}`)
    console.log('   Admin Login: admin@iwanyu.rw')
    console.log('   URL: http://localhost:3001')

  } catch (error) {
    console.error('Error adding sample data:', error)
  }
}

addSampleData().catch(console.error)
