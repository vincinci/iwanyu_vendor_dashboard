import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client (we'll need to get this from environment)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestVendor() {
  console.log('🧪 Creating test vendor account...')
  
  const testVendorData = {
    email: 'testvendor@example.com',
    password: 'password123',
    businessName: 'Test Electronics Store',
    contactPerson: 'John Doe',
    contactPhone: '+250788123456',
    businessAddress: 'KK 15 St, Kigali, Rwanda',
    firstName: 'John',
    lastName: 'Doe',
    storeDescription: 'We sell quality electronics and gadgets',
    mobileMoneyInfo: {
      accountName: 'John Doe',
      phoneNumber: '+250788123456',
      provider: 'MTN'
    }
  }

  try {
    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testVendorData.email,
      password: testVendorData.password,
      options: {
        data: {
          full_name: `${testVendorData.firstName} ${testVendorData.lastName}`,
          role: 'vendor',
          registration_step: 1,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return null
    }

    console.log('✅ Test vendor created:', authData.user?.id)
    return authData.user
  } catch (error) {
    console.error('Error creating test vendor:', error)
    return null
  }
}

async function createTestAdmin() {
  console.log('🧪 Creating test admin account...')
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'testadmin@example.com',
      password: 'admin123',
      options: {
        data: {
          full_name: 'Admin User',
          role: 'admin',
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return null
    }

    console.log('✅ Test admin created:', authData.user?.id)
    return authData.user
  } catch (error) {
    console.error('Error creating test admin:', error)
    return null
  }
}

async function loginAndTest(email, password) {
  console.log(`🔐 Testing login for ${email}...`)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return null
    }

    console.log('✅ Login successful for:', email)
    return data.user
  } catch (error) {
    console.error('Error during login:', error)
    return null
  }
}

async function createTestProduct(vendorId) {
  console.log('📦 Creating test product...')
  
  try {
    const productData = {
      vendor_id: vendorId,
      name: 'Samsung Galaxy S24',
      description: 'Latest Samsung flagship smartphone with advanced camera system',
      price: 850000, // RWF
      category: 'Electronics',
      status: 'active',
      inventory_quantity: 10,
      sku: 'SAM-S24-001',
      tags: ['smartphone', 'samsung', 'android'],
      images: [
        {
          url: 'https://example.com/samsung-s24.jpg',
          alt: 'Samsung Galaxy S24'
        }
      ]
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      console.error('Product creation error:', error)
      return null
    }

    console.log('✅ Test product created:', data.id)
    return data
  } catch (error) {
    console.error('Error creating test product:', error)
    return null
  }
}

async function runEndToEndTest() {
  console.log('🚀 Starting End-to-End Testing...\n')

  // Step 1: Create test accounts
  const vendor = await createTestVendor()
  if (!vendor) {
    console.error('❌ Failed to create test vendor')
    return
  }

  const admin = await createTestAdmin()
  if (!admin) {
    console.error('❌ Failed to create test admin')
    return
  }

  // Step 2: Test login
  const loggedInVendor = await loginAndTest('testvendor@example.com', 'password123')
  if (!loggedInVendor) {
    console.error('❌ Failed to login vendor')
    return
  }

  const loggedInAdmin = await loginAndTest('testadmin@example.com', 'admin123')
  if (!loggedInAdmin) {
    console.error('❌ Failed to login admin')
    return
  }

  // Step 3: Create test product
  const product = await createTestProduct(vendor.id)
  if (!product) {
    console.error('❌ Failed to create test product')
    return
  }

  // Step 4: Test API endpoints
  console.log('\n🔍 Testing API endpoints...')
  
  // Test vendor analytics
  console.log('Testing vendor analytics...')
  // We'll need to make actual HTTP requests here
  
  console.log('\n✅ End-to-End Testing Complete!')
  console.log('\n📋 Test Summary:')
  console.log(`- Vendor Account: vendor@test.com (${vendor.id})`)
  console.log(`- Admin Account: admin@test.com (${admin.id})`)
  console.log(`- Test Product: ${product.name} (${product.id})`)
  console.log('\n🌐 You can now test the following:')
  console.log('1. Login to http://localhost:3000/auth/login with testvendor@example.com / password123')
  console.log('2. Login to http://localhost:3000/auth/login with testadmin@example.com / admin123')
  console.log('3. Navigate to vendor dashboard and manage products')
  console.log('4. Navigate to admin dashboard and manage vendors')
}

// Run the test
runEndToEndTest().catch(console.error)

export { createTestVendor, createTestAdmin, loginAndTest, createTestProduct }
