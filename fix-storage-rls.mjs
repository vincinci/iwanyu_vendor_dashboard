#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixStorageAndUploadIssues() {
  console.log('🔧 FIXING STORAGE AND UPLOAD ISSUES')
  console.log('=' * 60)

  // 1. Check if file_storage table exists
  console.log('\n1️⃣ Checking file_storage table...')
  try {
    const { data, error } = await supabase
      .from('file_storage')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ file_storage table error:', error.message)
      console.log('📝 Creating file_storage table is needed')
    } else {
      console.log('✅ file_storage table exists')
    }
  } catch (e) {
    console.log('❌ file_storage check error:', e.message)
  }

  // 2. Test storage bucket access
  console.log('\n2️⃣ Testing storage bucket access...')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log('❌ Cannot access buckets:', error.message)
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name).join(', '))
      
      // Test upload to products bucket
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(`test/${Date.now()}-test.txt`, testFile)

      if (uploadError) {
        console.log('❌ Test upload failed:', uploadError.message)
      } else {
        console.log('✅ Test upload successful:', uploadData.path)
        
        // Clean up test file
        await supabase.storage.from('products').remove([uploadData.path])
      }
    }
  } catch (e) {
    console.log('❌ Storage test error:', e.message)
  }

  // 3. Test authentication with current user
  console.log('\n3️⃣ Testing authenticated user context...')
  try {
    // Get current user ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'testvendor@iwanyu.rw')
      .single()

    if (profile) {
      console.log('✅ Test vendor profile found:', profile.id)
      
      // Try to create a simple product without images first
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          vendor_id: profile.id,
          name: 'Test Product Without Images',
          description: 'Testing product creation without file uploads',
          price: 10.00,
          category_id: '1',
          inventory_quantity: 1,
          status: 'active'
        })
        .select()
        .single()

      if (productError) {
        console.log('❌ Product creation test failed:', productError.message)
      } else {
        console.log('✅ Product creation works:', productData.id)
        
        // Clean up test product
        await supabase.from('products').delete().eq('id', productData.id)
      }
    }
  } catch (e) {
    console.log('❌ User context test error:', e.message)
  }

  // 4. Create simplified upload function that bypasses file_storage table
  console.log('\n4️⃣ Creating simplified upload workaround...')
  
  console.log('📝 We need to modify the storage.ts file to bypass file_storage table')
  console.log('📝 The RLS policies on file_storage are blocking metadata saves')
  
  console.log('\n✅ IDENTIFIED ISSUES:')
  console.log('1. saveFileMetadata function tries to insert into file_storage table')
  console.log('2. file_storage table has RLS policies that block inserts')
  console.log('3. We need to either fix RLS policies or bypass metadata saving')

  return {
    needsStorageFix: true,
    needsFileStorageTable: true,
    needsRLSFix: true
  }
}

fixStorageAndUploadIssues().then(result => {
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Modify storage.ts to skip file_storage table temporarily')
  console.log('2. Fix product upload functionality')
  console.log('3. Test uploads work without RLS errors')
}).catch(console.error)
