import { createClient } from '@supabase/supabase-js'

// Use service role key for admin access
const supabaseUrl = 'https://tviewbuthckejhlogwns.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNzA4NiwiZXhwIjoyMDcyMDkzMDg2fQ.hTzYBZNh9o_6o0e4XcKPRa-C9Jd69I1ICOQRxxZ2W-Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseStorageIssue() {
  console.log('🔍 Diagnosing Image Storage Issues...\n')
  
  try {
    // 1. Check storage buckets
    console.log('1️⃣ Checking Storage Buckets:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }
    
    console.log(`📦 Found ${buckets.length} buckets:`)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
    })
    
    // 2. Check product-images bucket specifically
    const productBucket = buckets.find(b => b.name === 'product-images')
    if (!productBucket) {
      console.log('\n❌ product-images bucket NOT found! Need to create it.')
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage
        .createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError)
      } else {
        console.log('✅ Created product-images bucket')
      }
    } else {
      console.log('\n✅ product-images bucket exists')
    }
    
    // 3. Check existing files in storage
    console.log('\n3️⃣ Checking Stored Files:')
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 20 })
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError)
    } else {
      console.log(`📁 Found ${files.length} files in products folder:`)
      files.forEach(file => {
        const { data: publicUrl } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${file.name}`)
        console.log(`   - ${file.name} → ${publicUrl.publicUrl}`)
      })
    }
    
    // 4. Check products in database
    console.log('\n4️⃣ Checking Products in Database:')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images')
      .limit(5)
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
    } else {
      console.log(`📊 Found ${products.length} products:`)
      products.forEach(product => {
        console.log(`   - ${product.name}:`)
        console.log(`     ID: ${product.id}`)
        console.log(`     Images: ${JSON.stringify(product.images)}`)
        console.log(`     Image count: ${Array.isArray(product.images) ? product.images.length : 'Not an array'}`)
      })
    }
    
    // 5. Test upload functionality
    console.log('\n5️⃣ Testing Upload Process:')
    
    // Create a simple test file
    const testContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAJ9ILI5tgAAAABJRU5ErkJggg=='
    const testBuffer = Buffer.from(testContent, 'base64')
    const testFile = new File([testBuffer], 'test-upload.png', { type: 'image/png' })
    
    const fileName = `test-${Date.now()}.png`
    const filePath = `products/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, testFile)
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError)
    } else {
      console.log('✅ Test upload successful:', uploadData)
      
      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      
      console.log(`🔗 Test file URL: ${publicUrl.publicUrl}`)
      
      // Clean up test file
      await supabase.storage
        .from('product-images')
        .remove([filePath])
      console.log('🧹 Cleaned up test file')
    }
    
  } catch (error) {
    console.error('❌ Error in diagnosis:', error)
  }
}

diagnoseStorageIssue()
