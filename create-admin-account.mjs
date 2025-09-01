import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminAccount() {
  console.log('🔧 Creating admin account with service role...')
  
  try {
    // Create admin user using service role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@iwanyu.com',
      password: 'Admin123!@#',
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      },
      email_confirm: true // Skip email confirmation
    })

    if (authError) {
      console.error('❌ Auth error:', authError)
      return null
    }

    console.log('✅ Admin user created:', authData.user.id)

    // Create profile entry
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'admin@iwanyu.com',
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active'
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
    } else {
      console.log('✅ Admin profile created')
    }

    return authData.user
  } catch (error) {
    console.error('❌ Error creating admin account:', error)
    return null
  }
}

async function createVendorAccount() {
  console.log('🔧 Creating test vendor account...')
  
  try {
    // Create vendor user using service role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'vendor@iwanyu.com',
      password: 'Vendor123!@#',
      user_metadata: {
        full_name: 'Test Vendor',
        role: 'vendor'
      },
      email_confirm: true // Skip email confirmation
    })

    if (authError) {
      console.error('❌ Vendor auth error:', authError)
      return null
    }

    console.log('✅ Vendor user created:', authData.user.id)

    // Create profile entry
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'vendor@iwanyu.com',
        full_name: 'Test Vendor',
        role: 'vendor',
        status: 'active'
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Vendor profile creation error:', profileError)
    } else {
      console.log('✅ Vendor profile created')
    }

    return authData.user
  } catch (error) {
    console.error('❌ Error creating vendor account:', error)
    return null
  }
}

async function main() {
  console.log('🚀 Setting up admin and test accounts...\n')

  const admin = await createAdminAccount()
  const vendor = await createVendorAccount()

  console.log('\n📋 ACCOUNT CREDENTIALS')
  console.log('=======================')
  
  if (admin) {
    console.log('\n👑 ADMIN ACCOUNT:')
    console.log('Email: admin@iwanyu.com')
    console.log('Password: Admin123!@#')
    console.log('Role: admin')
    console.log('Dashboard: http://localhost:3000/admin')
  }

  if (vendor) {
    console.log('\n🏪 VENDOR ACCOUNT:')
    console.log('Email: vendor@iwanyu.com')
    console.log('Password: Vendor123!@#')
    console.log('Role: vendor')
    console.log('Dashboard: http://localhost:3000/vendor')
  }

  console.log('\n🌐 LOGIN PAGE: http://localhost:3000/auth/login')
  console.log('\n✨ Accounts ready for testing!')
}

main().catch(console.error)
