import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTcwODYsImV4cCI6MjA3MjA5MzA4Nn0.8diJpTeXd6WoWroW2CwdbQ6Gfusd2AeCc_r6dshRf78'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('🧪 Testing login process...')
  
  try {
    // Test vendor login
    console.log('\n🏪 Testing vendor login...')
    const { data: vendorData, error: vendorError } = await supabase.auth.signInWithPassword({
      email: 'vendor@iwanyu.com',
      password: 'Vendor123!@#'
    })

    if (vendorError) {
      console.error('❌ Vendor login error:', vendorError)
    } else {
      console.log('✅ Vendor login successful:', vendorData.user.id)
      
      // Test profile query
      const { data: vendorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status')
        .eq('id', vendorData.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Vendor profile query error:', profileError)
      } else {
        console.log('✅ Vendor profile found:', vendorProfile)
      }
      
      // Sign out
      await supabase.auth.signOut()
    }

    // Test admin login
    console.log('\n👑 Testing admin login...')
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@iwanyu.com',
      password: 'Admin123!@#'
    })

    if (adminError) {
      console.error('❌ Admin login error:', adminError)
    } else {
      console.log('✅ Admin login successful:', adminData.user.id)
      
      // Test profile query
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status')
        .eq('id', adminData.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Admin profile query error:', profileError)
      } else {
        console.log('✅ Admin profile found:', adminProfile)
      }
      
      // Sign out
      await supabase.auth.signOut()
    }

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testLogin()
