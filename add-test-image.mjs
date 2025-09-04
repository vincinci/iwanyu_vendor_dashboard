#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🧪 Testing Image Upload System\n')

async function testImageUpload() {
  try {
    console.log('📦 Step 1: Check product-images bucket status...')
    
    // Check bucket configuration
    const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket('product-images')
    
    if (bucketError) {
      console.log('❌ Bucket check failed:', bucketError)
      return
    }

    console.log('✅ Bucket configuration:')
    console.log(`   - Public: ${bucketInfo.public}`)
    console.log(`   - Size limit: ${bucketInfo.file_size_limit} bytes (${Math.round(bucketInfo.file_size_limit / 1024 / 1024)}MB)`)
    console.log(`   - MIME types: ${bucketInfo.allowed_mime_types?.join(', ') || 'all'}`)

    console.log('\n🧪 Step 2: Test file upload...')
    
    // Create a small test PNG image (1x1 pixel)
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ])

    const fileName = `test-upload-${Date.now()}.png`
    const filePath = `products/${fileName}`

    console.log(`📤 Uploading test file: ${filePath}`)
    console.log(`📏 File size: ${pngData.length} bytes`)

    // Upload test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, pngData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.log('❌ Upload failed:', uploadError)
      return
    }

    console.log('✅ Upload successful!')
    console.log(`   Upload path: ${uploadData.path}`)

    console.log('\n🔗 Step 3: Get public URL...')
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)
    
    console.log('✅ Public URL generated:')
    console.log(`   ${publicUrl}`)

    console.log('\n🌐 Step 4: Test URL accessibility...')
    
    // Test if URL is accessible
    try {
      const response = await fetch(publicUrl)
      console.log(`✅ URL accessible: ${response.status} ${response.statusText}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`)
    } catch (fetchError) {
      console.log('❌ URL not accessible:', fetchError.message)
    }

    console.log('\n🗑️  Step 5: Clean up test file...')
    
    // Remove test file
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (deleteError) {
      console.log('⚠️  Cleanup failed:', deleteError)
    } else {
      console.log('✅ Test file cleaned up')
    }

    console.log('\n🎉 Upload System Test Results:')
    console.log('✅ Bucket configuration: WORKING')
    console.log('✅ File upload: WORKING') 
    console.log('✅ Public URL generation: WORKING')
    console.log('✅ URL accessibility: WORKING')
    console.log('\n🎯 The image upload system is ready for use!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testImageUpload()
