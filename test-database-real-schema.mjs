#!/usr/bin/env node

/**
 * COMPREHENSIVE DATABASE TESTING SCRIPT - CORRECTED FOR REAL SCHEMA
 * Tests all CRUD operations based on actual database structure
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { randomUUID } from 'crypto'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

    await this.test('Database tables accessibility', async () => {
      const tables = ['profiles', 'products', 'orders', 'order_items', 'notifications', 'categories']
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
    
    const testUserId = randomUUID()
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
      console.log('    Profile created:', data[0]?.id.substring(0, 8) + '...')
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

  // 3. PRODUCT CRUD TESTS
  async testProductOperations() {
    this.log('\n=== 3. PRODUCT CRUD TESTS ===', 'info')
    
    const testProductId = randomUUID()
    const testVendorId = randomUUID()
    
    // Setup vendor
    await supabase.from('profiles').insert({
      id: testVendorId,
      email: `product-vendor-${Date.now()}@example.com`,
      full_name: 'Product Test Vendor',
      role: 'vendor',
      status: 'active'
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
          inventory_quantity: 50,
          status: 'active'
        })
        .select()
      
      if (error) throw error
      console.log('    Product created:', data[0]?.name, 'Price:', data[0]?.price)
    })

    await this.test('Read product with vendor relationship', async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:vendor_id (
            full_name,
            email
          )
        `)
        .eq('id', testProductId)
        .single()
      
      if (error) throw error
      console.log('    Product with vendor:', data.name, 'by', data.profiles?.full_name)
    })

    await this.test('Update product inventory', async () => {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          price: 1200,
          inventory_quantity: 45,
          description: 'Updated product description'
        })
        .eq('id', testProductId)
        .select()
      
      if (error) throw error
      console.log('    Product updated - New price:', data[0]?.price, 'Stock:', data[0]?.inventory_quantity)
    })

    await this.test('Search products by status', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, status')
        .eq('status', 'active')
        .limit(5)
      
      if (error) throw error
      console.log('    Found', data.length, 'active products')
    })

    // Cleanup
    await supabase.from('products').delete().eq('id', testProductId)
    await supabase.from('profiles').delete().eq('id', testVendorId)
  }

  // 4. ORDER AND ORDER ITEMS TESTS
  async testOrderOperations() {
    this.log('\n=== 4. ORDER AND ORDER ITEMS TESTS ===', 'info')
    
    const testOrderId = randomUUID()
    const testCustomerId = randomUUID()
    const testVendorId = randomUUID()
    const testProductId = randomUUID()
    
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
        id: testVendorId,
        email: `order-vendor-${Date.now()}@example.com`,
        full_name: 'Order Test Vendor',
        role: 'vendor',
        status: 'active'
      }
    ])

    await supabase.from('products').insert({
      id: testProductId,
      vendor_id: testVendorId,
      name: 'Order Test Product',
      price: 2000,
      inventory_quantity: 100,
      status: 'active'
    })

    await this.test('Create order', async () => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          id: testOrderId,
          customer_id: testCustomerId,
          vendor_id: testVendorId,
          order_number: `ORD-${Date.now()}`,
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
      console.log('    Order created:', data[0]?.order_number, 'Amount:', data[0]?.total_amount)
    })

    await this.test('Create order items', async () => {
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: testOrderId,
          product_id: testProductId,
          quantity: 2,
          unit_price: 2000,
          total_price: 4000
        })
        .select()
      
      if (error) throw error
      console.log('    Order item created: Qty', data[0]?.quantity, 'x', data[0]?.unit_price)
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
              profiles:vendor_id (
                full_name
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
      console.log('    Complete order data:', data.order_number, 'for', data.profiles?.full_name)
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
    await supabase.from('profiles').delete().eq('id', testCustomerId)
    await supabase.from('profiles').delete().eq('id', testVendorId)
  }

  // 5. NOTIFICATION SYSTEM TESTS
  async testNotificationOperations() {
    this.log('\n=== 5. NOTIFICATION SYSTEM TESTS ===', 'info')
    
    const testNotificationId = randomUUID()
    const testUserId = randomUUID()
    
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
          read: false
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
        .update({ read: true })
        .eq('id', testNotificationId)
        .select()
      
      if (error) throw error
      console.log('    Notification marked as read:', data[0]?.read)
    })

    // Cleanup
    await supabase.from('notifications').delete().eq('id', testNotificationId)
    await supabase.from('profiles').delete().eq('id', testUserId)
  }

  // 6. CATEGORIES TESTS
  async testCategoryOperations() {
    this.log('\n=== 6. CATEGORY SYSTEM TESTS ===', 'info')
    
    const testCategoryId = randomUUID()
    
    await this.test('Create category', async () => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: testCategoryId,
          name: 'Test Category',
          description: 'A test category',
          slug: `test-category-${Date.now()}`
        })
        .select()
      
      if (error) throw error
      console.log('    Category created:', data[0]?.name)
    })

    await this.test('Read categories', async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .limit(5)
      
      if (error) throw error
      console.log('    Found', data.length, 'categories')
    })

    await this.test('Update category', async () => {
      const { data, error } = await supabase
        .from('categories')
        .update({ description: 'Updated test category description' })
        .eq('id', testCategoryId)
        .select()
      
      if (error) throw error
      console.log('    Category updated:', data[0]?.description)
    })

    // Cleanup
    await supabase.from('categories').delete().eq('id', testCategoryId)
  }

  // 7. PERFORMANCE AND PAGINATION TESTS
  async testPerformanceAndPagination() {
    this.log('\n=== 7. PERFORMANCE AND PAGINATION TESTS ===', 'info')
    
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
              profiles:vendor_id (
                full_name
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

  // 8. REAL DATA VALIDATION
  async testRealDataValidation() {
    this.log('\n=== 8. REAL DATA VALIDATION ===', 'info')
    
    await this.test('Existing user profiles validation', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, status')
        .limit(10)
      
      if (error) throw error
      console.log('    Found', data.length, 'existing profiles')
      
      const roles = [...new Set(data.map(p => p.role))]
      const statuses = [...new Set(data.map(p => p.status))]
      console.log('    Roles:', roles.join(', '))
      console.log('    Statuses:', statuses.join(', '))
    })

    await this.test('Existing products validation', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, vendor_id, price, status')
        .limit(10)
      
      if (error) throw error
      console.log('    Found', data.length, 'existing products')
      
      if (data.length > 0) {
        const avgPrice = data.reduce((sum, p) => sum + (p.price || 0), 0) / data.length
        console.log('    Average price:', avgPrice.toFixed(2))
      }
    })

    await this.test('Existing orders validation', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total_amount, customer_id, vendor_id')
        .limit(10)
      
      if (error) throw error
      console.log('    Found', data.length, 'existing orders')
      
      if (data.length > 0) {
        const totalRevenue = data.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        console.log('    Total revenue from sample:', totalRevenue)
      }
    })
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive database testing with real schema...\n')
    
    await this.testDatabaseConnection()
    await this.testUserProfileOperations()
    await this.testProductOperations()
    await this.testOrderOperations()
    await this.testNotificationOperations()
    await this.testCategoryOperations()
    await this.testPerformanceAndPagination()
    await this.testRealDataValidation()

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
    } else if (this.testResults.passed > this.testResults.failed) {
      console.log('✅ MOSTLY SUCCESSFUL - Minor issues detected')
    } else {
      console.log('⚠️  SIGNIFICANT ISSUES - Check the details above')
    }
  }
}

// Run the tests
const tester = new DatabaseTester()
tester.runAllTests().catch(console.error)
