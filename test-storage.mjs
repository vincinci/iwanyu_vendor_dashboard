#!/usr/bin/env node

import { createClient } from './lib/supabase/client.js'

console.log('🔍 TESTING STORAGE BUCKET ACCESS')
console.log('=' * 50)

async function testStorageAccess() {
  try {
    const supabase = createClient()
    
    // Test 1: Check if we can access the bucket
    console.log('\n1. Testing bucket list access...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.log('❌ Bucket list failed:', bucketError.message)
      return
    }
    
    console.log('✅ Available buckets:', buckets?.map(b => b.name) || [])
    
    // Test 2: Check if products bucket exists
    const productsBucket = buckets?.find(b => b.name === 'products')
    if (!productsBucket) {
      console.log('❌ Products bucket not found!')
      return
    }
    
    console.log('✅ Products bucket found:', productsBucket)
    
    // Test 3: Try to list files in the bucket
    console.log('\n2. Testing bucket file listing...')
    const { data: files, error: listError } = await supabase.storage
      .from('products')
      .list('', { limit: 5 })
      
    if (listError) {
      console.log('❌ File listing failed:', listError.message)
    } else {
      console.log('✅ Can list files in bucket:', files?.length || 0, 'files found')
    }
    
    // Test 4: Try to upload a simple test file
    console.log('\n3. Testing file upload...')
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const testPath = `test/test_${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(testPath, testFile)
      
    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message)
      console.log('Error details:', uploadError)
    } else {
      console.log('✅ Upload successful:', uploadData)
      
      // Clean up test file
      await supabase.storage.from('products').remove([testPath])
      console.log('✅ Test file cleaned up')
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testStorageAccess()
