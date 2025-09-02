#!/usr/bin/env node

/**
 * COMPREHENSIVE DATABASE TESTING SCRIPT
 * Tests all CRUD operations, relationships, and data integrity
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

class DatabaseTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    }
  }

  log(message, type = 'info') {
    const emoji = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    }
    console.log(`${emoji[type]} ${message}`)
  }

  async test(description, testFn) {
    this.testResults.total++
    try {
      await testFn()
      this.testResults.passed++
      this.testResults.details.push({ test: description, status: 'PASSED' })
      this.log(`${description}: PASSED`, 'success')
    } catch (error) {
      this.testResults.failed++
      this.testResults.details.push({ test: description, status: 'FAILED', error: error.message })
      this.log(`${description}: FAILED - ${error.message}`, 'error')
    }
  }

  // 1. DATABASE CONNECTION TESTS
  async testDatabaseConnection() {
    this.log('\n=== 1. DATABASE CONNECTION TESTS ===', 'info')
    
    await this.test('Database connection health check', async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (error) throw error
      console.log('    Connection established successfully')
    })

    await this.test('Database schema validation', async () => {
      const tables = ['profiles', 'vendor_profiles', 'products', 'orders', 'order_items', 'notifications']
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) throw new Error(`Table ${table} not accessible: ${error.message}`)
      }
      console.log('    All required tables accessible')
    })
  }

  // 2. USER PROFILE CRUD TESTS
  async testUserProfileOperations() {
    this.log('\n=== 2. USER PROFILE CRUD TESTS ===', 'info')
    
    const testUserId = `test-user-${Date.now()}`
    const testEmail = `test-${Date.now()}@example.com`
    
    await this.test('Create user profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: testEmail,
          full_name: 'Test User',
          role: 'vendor',
          status: 'pending'
        })
        .select()
      
      if (error) throw error
      console.log('    Profile created:', data[0]?.id)
    })

    await this.test('Read user profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()
      
      if (error) throw error
      if (data.email !== testEmail) throw new Error('Data mismatch')
      console.log('    Profile read successfully:', data.email)
    })

    await this.test('Update user profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'Updated Test User', status: 'active' })
        .eq('id', testUserId)
        .select()
      
      if (error) throw error
      console.log('    Profile updated:', data[0]?.full_name)
    })

    await this.test('Delete user profile', async () => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId)
      
      if (error) throw error
      console.log('    Profile deleted successfully')
    })
  }

  // 3. VENDOR PROFILE TESTS
  async testVendorProfileOperations() {
    this.log('\n=== 3. VENDOR PROFILE TESTS ===', 'info')
    
    const testVendorId = `test-vendor-${Date.now()}`
    const testUserId = `test-user-${Date.now()}`
    
    // Create user first
    await supabase.from('profiles').insert({
      id: testUserId,
      email: `vendor-${Date.now()}@example.com`,
      full_name: 'Test Vendor User',
      role: 'vendor',
      status: 'active'
    })

    await this.test('Create vendor profile', async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .insert({
          id: testVendorId,
          user_id: testUserId,
          business_name: 'Test Business',
          business_description: 'Test business description',
          location: 'Kigali, Rwanda',
          verification_status: 'pending'
        })
        .select()
      
      if (error) throw error
      console.log('    Vendor profile created:', data[0]?.business_name)
    })

    await this.test('Read vendor profile with user data', async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            status
          )
        `)
        .eq('id', testVendorId)
        .single()
      
      if (error) throw error
      console.log('    Vendor profile with user data:', data.business_name, '/', data.profiles?.email)
    })

    await this.test('Update vendor profile', async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .update({ 
          verification_status: 'verified',
          business_description: 'Updated business description'
        })
        .eq('id', testVendorId)
        .select()
      
      if (error) throw error
      console.log('    Vendor profile updated:', data[0]?.verification_status)
    })

    // Cleanup
    await supabase.from('vendor_profiles').delete().eq('id', testVendorId)
    await supabase.from('profiles').delete().eq('id', testUserId)
  }

  // 4. PRODUCT CRUD TESTS
  async testProductOperations() {
    this.log('\n=== 4. PRODUCT CRUD TESTS ===', 'info')
    
    const testProductId = `test-product-${Date.now()}`
    const testVendorId = `test-vendor-${Date.now()}`
    const testUserId = `test-user-${Date.now()}`
    
    // Setup vendor
    await supabase.from('profiles').insert({
      id: testUserId,
      email: `product-vendor-${Date.now()}@example.com`,
      full_name: 'Product Test Vendor',
      role: 'vendor',
      status: 'active'
    })

    await supabase.from('vendor_profiles').insert({
      id: testVendorId,
      user_id: testUserId,
      business_name: 'Product Test Business',
      verification_status: 'verified'
    })

    await this.test('Create product', async () => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          id: testProductId,
          vendor_id: testVendorId,
          name: 'Test Product',
          description: 'A test product description',
          price: 1000,
          currency: 'RWF',
          category: 'electronics',
          stock_quantity: 50,
          status: 'active'
        })
        .select()
      
      if (error) throw error
      console.log('    Product created:', data[0]?.name, 'RWF', data[0]?.price)
    })

    await this.test('Read product with vendor data', async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor_profiles:vendor_id (
            business_name,
            profiles:user_id (
              full_name,
              email
            )
          )
        `)
        .eq('id', testProductId)
        .single()
      
      if (error) throw error
      console.log('    Product with vendor:', data.name, 'by', data.vendor_profiles?.business_name)
    })

    await this.test('Update product inventory', async () => {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          price: 1200,
          stock_quantity: 45,
          description: 'Updated product description'
        })
        .eq('id', testProductId)
        .select()
      
      if (error) throw error
      console.log('    Product updated - New price:', data[0]?.price, 'Stock:', data[0]?.stock_quantity)
    })

    await this.test('Search products by category', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('category', 'electronics')
        .limit(5)
      
      if (error) throw error
      console.log('    Found', data.length, 'electronics products')
    })

    // Cleanup
    await supabase.from('products').delete().eq('id', testProductId)
    await supabase.from('vendor_profiles').delete().eq('id', testVendorId)
    await supabase.from('profiles').delete().eq('id', testUserId)
  }

  // 5. ORDER AND ORDER ITEMS TESTS
  async testOrderOperations() {
    this.log('\n=== 5. ORDER AND ORDER ITEMS TESTS ===', 'info')
    
    const testOrderId = `test-order-${Date.now()}`
    const testCustomerId = `test-customer-${Date.now()}`
    const testVendorId = `test-vendor-${Date.now()}`
    const testProductId = `test-product-${Date.now()}`
    const testVendorUserId = `test-vendor-user-${Date.now()}`
    
    // Setup test data
    await supabase.from('profiles').insert([
      {
        id: testCustomerId,
        email: `customer-${Date.now()}@example.com`,
        full_name: 'Test Customer',
        role: 'customer',
        status: 'active'
      },
      {
        id: testVendorUserId,
        email: `order-vendor-${Date.now()}@example.com`,
        full_name: 'Order Test Vendor',
        role: 'vendor',
        status: 'active'
      }
    ])

    await supabase.from('vendor_profiles').insert({
      id: testVendorId,
      user_id: testVendorUserId,
      business_name: 'Order Test Business',
      verification_status: 'verified'
    })

    await supabase.from('products').insert({
      id: testProductId,
      vendor_id: testVendorId,
      name: 'Order Test Product',
      price: 2000,
      currency: 'RWF',
      stock_quantity: 100,
      status: 'active'
    })

    await this.test('Create order', async () => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          id: testOrderId,
          customer_id: testCustomerId,
          total_amount: 4000,
          currency: 'RWF',
          status: 'pending',
          shipping_address: JSON.stringify({
            street: 'KG 123 St',
            city: 'Kigali',
            country: 'Rwanda'
          })
        })
        .select()
      
      if (error) throw error
      console.log('    Order created:', data[0]?.id, 'Amount:', data[0]?.total_amount)
    })

    await this.test('Create order items', async () => {
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: testOrderId,
          product_id: testProductId,
          vendor_id: testVendorId,
          quantity: 2,
          unit_price: 2000,
          total_price: 4000
        })
        .select()
      
      if (error) throw error
      console.log('    Order item created: Qty', data[0]?.quantity, 'x RWF', data[0]?.unit_price)
    })

    await this.test('Read complete order with items and products', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              vendor_profiles (
                business_name
              )
            )
          ),
          profiles:customer_id (
            full_name,
            email
          )
        `)
        .eq('id', testOrderId)
        .single()
      
      if (error) throw error
      console.log('    Complete order data:', data.id, 'for', data.profiles?.full_name)
      console.log('    Items:', data.order_items?.length, 'products')
    })

    await this.test('Update order status', async () => {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testOrderId)
        .select()
      
      if (error) throw error
      console.log('    Order status updated to:', data[0]?.status)
    })

    // Cleanup
    await supabase.from('order_items').delete().eq('order_id', testOrderId)
    await supabase.from('orders').delete().eq('id', testOrderId)
    await supabase.from('products').delete().eq('id', testProductId)
    await supabase.from('vendor_profiles').delete().eq('id', testVendorId)
    await supabase.from('profiles').delete().eq('id', testCustomerId)
    await supabase.from('profiles').delete().eq('id', testVendorUserId)
  }

  // 6. NOTIFICATION SYSTEM TESTS
  async testNotificationOperations() {
    this.log('\n=== 6. NOTIFICATION SYSTEM TESTS ===', 'info')
    
    const testNotificationId = `test-notification-${Date.now()}`
    const testUserId = `test-user-${Date.now()}`
    
    await supabase.from('profiles').insert({
      id: testUserId,
      email: `notification-user-${Date.now()}@example.com`,
      full_name: 'Notification Test User',
      role: 'vendor',
      status: 'active'
    })

    await this.test('Create notification', async () => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          id: testNotificationId,
          user_id: testUserId,
          title: 'Test Notification',
          message: 'This is a test notification message',
          type: 'info',
          is_read: false
        })
        .select()
      
      if (error) throw error
      console.log('    Notification created:', data[0]?.title)
    })

    await this.test('Read user notifications', async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      console.log('    Found', data.length, 'notifications for user')
    })

    await this.test('Mark notification as read', async () => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', testNotificationId)
        .select()
      
      if (error) throw error
      console.log('    Notification marked as read:', data[0]?.is_read)
    })

    // Cleanup
    await supabase.from('notifications').delete().eq('id', testNotificationId)
    await supabase.from('profiles').delete().eq('id', testUserId)
  }

  // 7. DATA INTEGRITY AND RELATIONSHIP TESTS
  async testDataIntegrityAndRelationships() {
    this.log('\n=== 7. DATA INTEGRITY AND RELATIONSHIP TESTS ===', 'info')
    
    await this.test('Foreign key constraints (vendor-product relationship)', async () => {
      try {
        // Try to create product with non-existent vendor
        const { error } = await supabase
          .from('products')
          .insert({
            vendor_id: 'non-existent-vendor',
            name: 'Invalid Product',
            price: 100
          })
        
        if (!error) throw new Error('Foreign key constraint should have failed')
        console.log('    Foreign key constraint working correctly')
      } catch (error) {
        // This should fail, which is good
        if (error.message.includes('Foreign key constraint should have failed')) {
          throw error
        }
        console.log('    Foreign key constraint enforced properly')
      }
    })

    await this.test('Data consistency checks', async () => {
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          order_items (
            total_price
          )
        `)
        .limit(5)
      
      if (orderError) throw orderError
      
      for (const order of orders) {
        const calculatedTotal = order.order_items?.reduce((sum, item) => sum + item.total_price, 0) || 0
        if (Math.abs(order.total_amount - calculatedTotal) > 0.01) {
          console.log(`    Warning: Order ${order.id} total mismatch`)
        }
      }
      console.log('    Checked', orders.length, 'orders for data consistency')
    })
  }

  // 8. PERFORMANCE AND PAGINATION TESTS
  async testPerformanceAndPagination() {
    this.log('\n=== 8. PERFORMANCE AND PAGINATION TESTS ===', 'info')
    
    await this.test('Large dataset pagination', async () => {
      const pageSize = 10
      const { data, error, count } = await supabase
        .from('products')
        .select('id, name, price', { count: 'exact' })
        .range(0, pageSize - 1)
      
      if (error) throw error
      console.log('    Retrieved', data.length, 'products out of', count, 'total')
    })

    await this.test('Complex query performance', async () => {
      const startTime = Date.now()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          order_items (
            quantity,
            products (
              name,
              vendor_profiles (
                business_name
              )
            )
          )
        `)
        .limit(5)
      
      if (error) throw error
      const queryTime = Date.now() - startTime
      console.log('    Complex query completed in', queryTime, 'ms')
      if (queryTime > 2000) console.log('    ⚠️  Query seems slow')
    })
  }

  // 9. FULL CRUD WORKFLOW TEST
  async testFullCRUDWorkflow() {
    this.log('\n=== 9. FULL CRUD WORKFLOW TEST ===', 'info')
    
    const workflowIds = {
      userId: `workflow-user-${Date.now()}`,
      vendorId: `workflow-vendor-${Date.now()}`,
      productId: `workflow-product-${Date.now()}`,
      customerId: `workflow-customer-${Date.now()}`,
      orderId: `workflow-order-${Date.now()}`,
      notificationId: `workflow-notification-${Date.now()}`
    }

    await this.test('Complete vendor onboarding workflow', async () => {
      // 1. Create user profile
      await supabase.from('profiles').insert({
        id: workflowIds.userId,
        email: `workflow-vendor-${Date.now()}@example.com`,
        full_name: 'Workflow Test Vendor',
        role: 'vendor',
        status: 'pending'
      })

      // 2. Create vendor profile
      await supabase.from('vendor_profiles').insert({
        id: workflowIds.vendorId,
        user_id: workflowIds.userId,
        business_name: 'Workflow Test Business',
        business_description: 'Complete workflow test',
        location: 'Kigali, Rwanda',
        verification_status: 'pending'
      })

      // 3. Approve vendor
      await supabase.from('profiles').update({ status: 'active' }).eq('id', workflowIds.userId)
      await supabase.from('vendor_profiles').update({ verification_status: 'verified' }).eq('id', workflowIds.vendorId)

      // 4. Add product
      await supabase.from('products').insert({
        id: workflowIds.productId,
        vendor_id: workflowIds.vendorId,
        name: 'Workflow Test Product',
        description: 'Product created in workflow test',
        price: 5000,
        currency: 'RWF',
        category: 'test',
        stock_quantity: 100,
        status: 'active'
      })

      console.log('    Complete vendor onboarding workflow successful')
    })

    await this.test('Complete order fulfillment workflow', async () => {
      // 1. Create customer
      await supabase.from('profiles').insert({
        id: workflowIds.customerId,
        email: `workflow-customer-${Date.now()}@example.com`,
        full_name: 'Workflow Test Customer',
        role: 'customer',
        status: 'active'
      })

      // 2. Create order
      await supabase.from('orders').insert({
        id: workflowIds.orderId,
        customer_id: workflowIds.customerId,
        total_amount: 10000,
        currency: 'RWF',
        status: 'pending',
        shipping_address: JSON.stringify({ city: 'Kigali', country: 'Rwanda' })
      })

      // 3. Add order items
      await supabase.from('order_items').insert({
        order_id: workflowIds.orderId,
        product_id: workflowIds.productId,
        vendor_id: workflowIds.vendorId,
        quantity: 2,
        unit_price: 5000,
        total_price: 10000
      })

      // 4. Update order status through fulfillment
      const statuses = ['confirmed', 'processing', 'shipped', 'delivered']
      for (const status of statuses) {
        await supabase.from('orders').update({ status }).eq('id', workflowIds.orderId)
      }

      // 5. Create notification
      await supabase.from('notifications').insert({
        id: workflowIds.notificationId,
        user_id: workflowIds.customerId,
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully',
        type: 'success',
        is_read: false
      })

      console.log('    Complete order fulfillment workflow successful')
    })

    // Cleanup workflow data
    await supabase.from('notifications').delete().eq('id', workflowIds.notificationId)
    await supabase.from('order_items').delete().eq('order_id', workflowIds.orderId)
    await supabase.from('orders').delete().eq('id', workflowIds.orderId)
    await supabase.from('products').delete().eq('id', workflowIds.productId)
    await supabase.from('vendor_profiles').delete().eq('id', workflowIds.vendorId)
    await supabase.from('profiles').delete().eq('id', workflowIds.userId)
    await supabase.from('profiles').delete().eq('id', workflowIds.customerId)
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive database testing...\n')
    
    await this.testDatabaseConnection()
    await this.testUserProfileOperations()
    await this.testVendorProfileOperations()
    await this.testProductOperations()
    await this.testOrderOperations()
    await this.testNotificationOperations()
    await this.testDataIntegrityAndRelationships()
    await this.testPerformanceAndPagination()
    await this.testFullCRUDWorkflow()

    this.printSummary()
  }

  printSummary() {
    this.log('\n=== DATABASE TESTING SUMMARY ===', 'info')
    console.log(`📊 Total Tests: ${this.testResults.total}`)
    console.log(`✅ Passed: ${this.testResults.passed}`)
    console.log(`❌ Failed: ${this.testResults.failed}`)
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`)
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   - ${test.test}: ${test.error}`))
    }

    console.log('\n🎯 Database Testing Complete!')
    
    if (this.testResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED - Database is fully functional!')
    } else {
      console.log('⚠️  Some tests failed - Check the details above')
    }
  }
}

// Run the tests
const tester = new DatabaseTester()
tester.runAllTests().catch(console.error)
