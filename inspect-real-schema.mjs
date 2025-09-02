#!/usr/bin/env node

/**
 * DATABASE SCHEMA INSPECTOR
 * Inspects the actual database schema to understand the real structure
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSchema() {
  console.log('🔍 Inspecting actual database schema...\n')
  
  // Check what tables exist
  console.log('=== AVAILABLE TABLES ===')
  try {
    const { data: tables, error } = await supabase.rpc('get_all_tables')
    
    if (error) {
      // Fallback method - try to query common tables
      const commonTables = ['profiles', 'products', 'orders', 'order_items', 'notifications', 'vendor_profiles', 'categories']
      
      for (const table of commonTables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1)
          if (!error) {
            console.log(`✅ ${table} - exists`)
          }
        } catch (e) {
          console.log(`❌ ${table} - not found`)
        }
      }
    }
  } catch (e) {
    console.log('Using direct table inspection...')
  }

  // Inspect profiles table
  console.log('\n=== PROFILES TABLE STRUCTURE ===')
  try {
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1)
    if (profiles?.[0]) {
      console.log('Sample profile structure:', Object.keys(profiles[0]))
    }
    
    const { data: allProfiles } = await supabase.from('profiles').select('id, email, role').limit(5)
    console.log(`Found ${allProfiles?.length || 0} profiles`)
    allProfiles?.forEach(p => console.log(`  - ID: ${p.id}, Role: ${p.role}, Email: ${p.email}`))
  } catch (error) {
    console.log('Error inspecting profiles:', error.message)
  }

  // Inspect products table
  console.log('\n=== PRODUCTS TABLE STRUCTURE ===')
  try {
    const { data: products } = await supabase.from('products').select('*').limit(1)
    if (products?.[0]) {
      console.log('Sample product structure:', Object.keys(products[0]))
    }
    
    const { data: allProducts } = await supabase.from('products').select('id, name, price').limit(5)
    console.log(`Found ${allProducts?.length || 0} products`)
    allProducts?.forEach(p => console.log(`  - ID: ${p.id}, Name: ${p.name}, Price: ${p.price}`))
  } catch (error) {
    console.log('Error inspecting products:', error.message)
  }

  // Inspect orders table
  console.log('\n=== ORDERS TABLE STRUCTURE ===')
  try {
    const { data: orders } = await supabase.from('orders').select('*').limit(1)
    if (orders?.[0]) {
      console.log('Sample order structure:', Object.keys(orders[0]))
    }
    
    const { data: allOrders } = await supabase.from('orders').select('id, status, total_amount').limit(5)
    console.log(`Found ${allOrders?.length || 0} orders`)
    allOrders?.forEach(o => console.log(`  - ID: ${o.id}, Status: ${o.status}, Amount: ${o.total_amount}`))
  } catch (error) {
    console.log('Error inspecting orders:', error.message)
  }

  // Inspect order_items table
  console.log('\n=== ORDER_ITEMS TABLE STRUCTURE ===')
  try {
    const { data: orderItems } = await supabase.from('order_items').select('*').limit(1)
    if (orderItems?.[0]) {
      console.log('Sample order_item structure:', Object.keys(orderItems[0]))
    }
    
    const { data: allOrderItems } = await supabase.from('order_items').select('*').limit(3)
    console.log(`Found ${allOrderItems?.length || 0} order items`)
  } catch (error) {
    console.log('Error inspecting order_items:', error.message)
  }

  // Inspect notifications table
  console.log('\n=== NOTIFICATIONS TABLE STRUCTURE ===')
  try {
    const { data: notifications } = await supabase.from('notifications').select('*').limit(1)
    if (notifications?.[0]) {
      console.log('Sample notification structure:', Object.keys(notifications[0]))
    }
    
    const { data: allNotifications } = await supabase.from('notifications').select('id, title, type').limit(3)
    console.log(`Found ${allNotifications?.length || 0} notifications`)
  } catch (error) {
    console.log('Error inspecting notifications:', error.message)
  }

  // Check for vendor_profiles or similar vendor table
  console.log('\n=== VENDOR DATA INSPECTION ===')
  const vendorTables = ['vendor_profiles', 'vendors', 'vendor_info', 'business_profiles']
  
  for (const table of vendorTables) {
    try {
      const { data } = await supabase.from(table).select('*').limit(1)
      if (data) {
        console.log(`✅ ${table} exists`)
        if (data[0]) {
          console.log(`   Structure:`, Object.keys(data[0]))
        }
      }
    } catch (error) {
      console.log(`❌ ${table} - not found`)
    }
  }

  // Test actual data flow with existing data
  console.log('\n=== TESTING DATA RELATIONSHIPS ===')
  try {
    const { data: profileWithVendor } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .limit(1)
      .single()
    
    if (profileWithVendor) {
      console.log('Found vendor profile:', profileWithVendor.id, profileWithVendor.email)
      
      // Try to find products for this vendor
      const { data: vendorProducts } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', profileWithVendor.id)
        .limit(3)
      
      console.log(`Vendor has ${vendorProducts?.length || 0} products`)
    }
  } catch (error) {
    console.log('Error testing relationships:', error.message)
  }
}

inspectSchema().catch(console.error)
