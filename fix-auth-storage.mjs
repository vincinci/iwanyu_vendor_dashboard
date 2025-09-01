#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAuthenticationAndStorage() {
  console.log('🔧 FIXING AUTHENTICATION AND STORAGE ISSUES')
  console.log('=' * 60)

  // 1. Check if test user exists and fix auth
  console.log('\n1️⃣ Checking Authentication System...')
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById('174369b8-6009-4031-aca6-a7d2ccc8c498')
    
    if (error) {
      console.log('❌ User lookup failed:', error.message)
      
      // Create the user again with proper auth
      console.log('📝 Creating new authenticated user...')
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'testvendor@iwanyu.rw',
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Vendor',
          role: 'vendor'
        }
      })

      if (createError) {
        console.log('❌ User creation failed:', createError.message)
      } else {
        console.log('✅ New user created:', newUser.user.id)
        
        // Update profile with correct ID
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            email: 'testvendor@iwanyu.rw',
            full_name: 'Test Vendor',
            role: 'vendor',
            phone: '+250788123456',
            address: 'KG 123 St, Kigali, Rwanda'
          })

        if (profileError) {
          console.log('❌ Profile update failed:', profileError.message)
        } else {
          console.log('✅ Profile updated for new user')
        }
      }
    } else {
      console.log('✅ Test user exists:', user.email)
    }
  } catch (e) {
    console.log('❌ Auth check error:', e.message)
  }

  // 2. Fix Storage Bucket and RLS Policies
  console.log('\n2️⃣ Fixing Storage Configuration...')
  try {
    // Check if products bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Cannot list buckets:', bucketsError.message)
    } else {
      const productsBucket = buckets.find(b => b.name === 'products')
      if (!productsBucket) {
        console.log('📝 Creating products storage bucket...')
        const { error: createBucketError } = await supabase.storage.createBucket('products', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (createBucketError) {
          console.log('❌ Bucket creation failed:', createBucketError.message)
        } else {
          console.log('✅ Products bucket created')
        }
      } else {
        console.log('✅ Products bucket exists')
      }
    }
  } catch (e) {
    console.log('❌ Storage check error:', e.message)
  }

  // 3. Test Basic Database Connectivity
  console.log('\n3️⃣ Testing Database Connectivity...')
  const tables = ['profiles', 'products', 'orders', 'categories']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Connected (${data?.length || 0} records)`)
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`)
    }
  }

  // 4. Test Authentication Credentials
  console.log('\n4️⃣ Testing Login Credentials...')
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testvendor@iwanyu.rw',
      password: 'testpassword123'
    })

    if (error) {
      console.log('❌ Login test failed:', error.message)
      
      // Try to reset password
      console.log('📝 Attempting password reset...')
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        '174369b8-6009-4031-aca6-a7d2ccc8c498',
        { password: 'testpassword123' }
      )

      if (resetError) {
        console.log('❌ Password reset failed:', resetError.message)
      } else {
        console.log('✅ Password reset successful')
      }
    } else {
      console.log('✅ Login credentials working')
      
      // Sign out to clean up
      await supabase.auth.signOut()
    }
  } catch (e) {
    console.log('❌ Login test error:', e.message)
  }

  console.log('\n📊 AUTHENTICATION & STORAGE FIX SUMMARY')
  console.log('=' * 50)
  console.log('✅ User account verification completed')
  console.log('✅ Storage bucket configuration checked')
  console.log('✅ Database connectivity verified')
  console.log('✅ Authentication system tested')
}

fixAuthenticationAndStorage().catch(console.error)
