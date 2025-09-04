#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Storage Buckets Diagnostic\n')

try {
  // List all buckets
  console.log('📦 Checking buckets...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.log('❌ Error listing buckets:', bucketsError)
    process.exit(1)
  }

  console.log(`✅ Found ${buckets.length} buckets:`)
  buckets.forEach(bucket => {
    console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
  })

  // Check for required buckets
  const requiredBuckets = ['product-images', 'vendor-uploads']
  const missingBuckets = []

  for (const bucketName of requiredBuckets) {
    const exists = buckets.some(b => b.name === bucketName)
    if (!exists) {
      missingBuckets.push(bucketName)
    }
  }

  if (missingBuckets.length > 0) {
    console.log('\n❌ Missing buckets:')
    missingBuckets.forEach(bucket => {
      console.log(`  - ${bucket}`)
    })

    console.log('\n🔧 Creating missing buckets...')
    for (const bucketName of missingBuckets) {
      const { data, error } = await supabase.storage.createBucket(bucketName, { 
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (error) {
        console.log(`❌ Failed to create ${bucketName}:`, error)
      } else {
        console.log(`✅ Created bucket: ${bucketName}`)
      }
    }
  } else {
    console.log('\n✅ All required buckets exist')
  }

  // Test upload to each bucket
  console.log('\n🧪 Testing uploads...')
  const testFile = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // PNG header
  
  for (const bucketName of requiredBuckets) {
    const testFileName = `test-upload-${Date.now()}.png`
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testFile, {
          contentType: 'image/png'
        })

      if (error) {
        console.log(`❌ Upload test failed for ${bucketName}:`, error.message)
      } else {
        console.log(`✅ Upload test passed for ${bucketName}`)
        
        // Clean up test file
        await supabase.storage.from(bucketName).remove([testFileName])
      }
    } catch (testError) {
      console.log(`❌ Upload test error for ${bucketName}:`, testError.message)
    }
  }

  console.log('\n🎯 Diagnosis complete!')

} catch (error) {
  console.error('❌ Diagnostic failed:', error)
  process.exit(1)
}
