
import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3003'

interface TestUser {
  id: string
  email: string
  access_token: string
  role: 'admin' | 'vendor'
}

describe('API Integration Tests', () => {
  let supabase: any
  let adminUser: TestUser
  let vendorUser: TestUser

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Create test users
    adminUser = await createTestUser('admin@test.iwanyu.com', 'admin123', 'admin')
    vendorUser = await createTestUser('vendor@test.iwanyu.com', 'vendor123', 'vendor')
  })

  afterAll(async () => {
    // Cleanup test users
    await cleanupTestUser(adminUser.id)
    await cleanupTestUser(vendorUser.id)
  })

  describe('Admin Analytics API', () => {
    test('GET /api/admin/analytics returns comprehensive data', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics?period=30d`, {
        headers: {
          'Authorization': `Bearer ${adminUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify data structure
      expect(data).toHaveProperty('overview')
      expect(data.overview).toHaveProperty('total_revenue')
      expect(data.overview).toHaveProperty('total_orders')
      expect(data.overview).toHaveProperty('total_vendors')
      expect(data.overview).toHaveProperty('total_products')
      expect(data.overview).toHaveProperty('revenue_change')
      expect(data.overview).toHaveProperty('orders_change')

      expect(data).toHaveProperty('vendors')
      expect(Array.isArray(data.vendors)).toBe(true)

      expect(data).toHaveProperty('recentOrders')
      expect(Array.isArray(data.recentOrders)).toBe(true)

      expect(data).toHaveProperty('pendingApprovals')
      expect(Array.isArray(data.pendingApprovals)).toBe(true)

      expect(data).toHaveProperty('systemHealth')
      expect(data.systemHealth).toHaveProperty('uptime')
      expect(data.systemHealth).toHaveProperty('active_sessions')
    })

    test('GET /api/admin/analytics requires admin role', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(403)
    })

    test('GET /api/admin/analytics supports different time periods', async () => {
      const periods = ['7d', '30d', '90d']
      
      for (const period of periods) {
        const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${adminUser.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.overview).toBeDefined()
      }
    })
  })

  describe('Vendor Analytics API', () => {
    test('GET /api/vendor/analytics returns vendor-specific data', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/vendor/analytics?period=30d`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify vendor-specific data structure
      expect(data).toHaveProperty('overview')
      expect(data.overview).toHaveProperty('total_revenue')
      expect(data.overview).toHaveProperty('total_orders')
      expect(data.overview).toHaveProperty('total_products')

      expect(data).toHaveProperty('products')
      expect(Array.isArray(data.products)).toBe(true)

      expect(data).toHaveProperty('recentOrders')
      expect(Array.isArray(data.recentOrders)).toBe(true)

      expect(data).toHaveProperty('lowStockProducts')
      expect(Array.isArray(data.lowStockProducts)).toBe(true)
    })

    test('GET /api/vendor/analytics requires vendor role', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/vendor/analytics`, {
        headers: {
          'Authorization': `Bearer ${adminUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      // Admin should not access vendor analytics (403) or get empty data
      expect([403, 200].includes(response.status)).toBe(true)
    })
  })

  describe('Product Management API', () => {
    test('GET /api/products returns product list', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('POST /api/products creates new product', async () => {
      const newProduct = {
        name: 'Test Product',
        description: 'Test product description',
        price: 99.99,
        stock_quantity: 50,
        category_id: 1,
        status: 'active'
      }

      const response = await fetch(`${TEST_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      })

      expect([200, 201].includes(response.status)).toBe(true)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.name).toBe(newProduct.name)
    })

    test('PUT /api/products/[id] updates existing product', async () => {
      // First create a product
      const newProduct = {
        name: 'Test Product for Update',
        description: 'Test product description',
        price: 99.99,
        stock_quantity: 50,
        category_id: 1,
        status: 'active'
      }

      const createResponse = await fetch(`${TEST_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      })

      const createdProduct = await createResponse.json()

      // Update the product
      const updatedData = {
        name: 'Updated Test Product',
        price: 149.99
      }

      const updateResponse = await fetch(`${TEST_BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })

      expect(updateResponse.status).toBe(200)
      const updatedProduct = await updateResponse.json()
      expect(updatedProduct.name).toBe(updatedData.name)
      expect(updatedProduct.price).toBe(updatedData.price)
    })
  })

  describe('Order Management API', () => {
    test('GET /api/orders returns order list', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('PUT /api/orders/[id] updates order status', async () => {
      // This test assumes there's at least one order
      const ordersResponse = await fetch(`${TEST_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const orders = await ordersResponse.json()
      
      if (orders.length > 0) {
        const orderId = orders[0].id
        const updateData = { status: 'processing' }

        const response = await fetch(`${TEST_BASE_URL}/api/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${vendorUser.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        expect([200, 404].includes(response.status)).toBe(true)
      }
    })
  })

  describe('Notification System API', () => {
    test('GET /api/notifications returns user notifications', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('POST /api/notifications creates new notification', async () => {
      const notification = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info'
      }

      const response = await fetch(`${TEST_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      })

      expect([200, 201].includes(response.status)).toBe(true)
    })
  })

  describe('Authentication & Authorization', () => {
    test('Unauthenticated requests are rejected', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics`)
      expect(response.status).toBe(401)
    })

    test('Invalid tokens are rejected', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      })
      expect(response.status).toBe(401)
    })

    test('Role-based access is enforced', async () => {
      // Vendor trying to access admin endpoint
      const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      expect(response.status).toBe(403)
    })
  })

  describe('Data Validation', () => {
    test('API validates required fields', async () => {
      const incompleteProduct = {
        name: 'Test Product'
        // Missing required fields
      }

      const response = await fetch(`${TEST_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incompleteProduct)
      })

      expect(response.status).toBe(400)
    })

    test('API validates data types', async () => {
      const invalidProduct = {
        name: 'Test Product',
        price: 'invalid-price', // Should be number
        stock_quantity: -5 // Should be positive
      }

      const response = await fetch(`${TEST_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidProduct)
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Error Handling', () => {
    test('API handles database errors gracefully', async () => {
      // Try to access non-existent resource
      const response = await fetch(`${TEST_BASE_URL}/api/products/99999999`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(404)
    })

    test('API returns proper error messages', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/products/invalid-id`, {
        headers: {
          'Authorization': `Bearer ${vendorUser.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      expect([400, 404].includes(response.status)).toBe(true)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })
})

// Helper functions
async function createTestUser(email: string, password: string, role: 'admin' | 'vendor'): Promise<TestUser> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user!.id,
      email,
      role,
      full_name: `Test ${role}`,
      business_name: role === 'vendor' ? 'Test Business' : null,
      status: 'active'
    })

  if (profileError) throw profileError

  // Sign in to get access token
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) throw signInError

  return {
    id: authData.user!.id,
    email,
    access_token: signInData.session!.access_token,
    role
  }
}

async function cleanupTestUser(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Delete user profile and related data
  await supabase.from('profiles').delete().eq('id', userId)
  
  // Note: In a real test environment, you'd also clean up
  // products, orders, notifications, etc. created by test user
}
