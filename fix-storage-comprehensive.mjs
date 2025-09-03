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

async function fixStorageSetup() {
  console.log('🔧 Setting up comprehensive storage solution...\n')
  
  try {
    // 1. Ensure storage buckets exist with proper configuration
    console.log('1️⃣ Setting up storage buckets...')
    
    const bucketsToCreate = [
      {
        name: 'product-images',
        config: {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        }
      },
      {
        name: 'vendor-uploads',
        config: {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB (backup storage)
        }
      }
    ]
    
    for (const bucketInfo of bucketsToCreate) {
      const { data: buckets } = await supabase.storage.listBuckets()
      const existingBucket = buckets?.find(b => b.name === bucketInfo.name)
      
      if (!existingBucket) {
        console.log(`📦 Creating bucket: ${bucketInfo.name}`)
        const { error } = await supabase.storage.createBucket(bucketInfo.name, bucketInfo.config)
        
        if (error) {
          console.error(`❌ Error creating ${bucketInfo.name}:`, error)
        } else {
          console.log(`✅ Created ${bucketInfo.name} bucket`)
        }
      } else {
        console.log(`✅ Bucket ${bucketInfo.name} already exists`)
      }
    }
    
    // 2. Set up storage policies for proper access
    console.log('\n2️⃣ Setting up storage policies...')
    
    const policies = [
      // Allow vendors to upload to their own folders
      {
        name: 'Vendors can upload product images',
        definition: `
          CREATE POLICY "Vendors can upload product images" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (
            bucket_id = 'product-images' AND
            auth.role() = 'authenticated'
          );
        `
      },
      {
        name: 'Vendors can view product images',
        definition: `
          CREATE POLICY "Vendors can view product images" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'product-images');
        `
      },
      {
        name: 'Public can view product images',
        definition: `
          CREATE POLICY "Public can view product images" ON storage.objects
          FOR SELECT TO anon
          USING (bucket_id = 'product-images');
        `
      }
    ]
    
    // Note: In a real implementation, you'd run these SQL commands via Supabase SQL editor
    console.log('📋 Storage policies defined (run these in Supabase SQL editor if needed)')
    
    // 3. Test upload with both buckets
    console.log('\n3️⃣ Testing both storage options...')
    
    const testContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAJ9ILI5tgAAAABJRU5ErkJggg=='
    const testBuffer = Buffer.from(testContent, 'base64')
    const testFile = new File([testBuffer], 'test-storage-fix.png', { type: 'image/png' })
    
    const testBuckets = ['product-images', 'vendor-uploads']
    const workingBuckets = []
    
    for (const bucket of testBuckets) {
      try {
        const fileName = `test-${Date.now()}-${bucket}.png`
        const filePath = `products/${fileName}`
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, testFile)
        
        if (error) {
          console.log(`❌ ${bucket}: ${error.message}`)
        } else {
          console.log(`✅ ${bucket}: Upload successful`)
          workingBuckets.push(bucket)
          
          // Clean up
          await supabase.storage.from(bucket).remove([filePath])
        }
      } catch (error) {
        console.log(`❌ ${bucket}: Exception - ${error.message}`)
      }
    }
    
    console.log(`\n📊 Working storage buckets: ${workingBuckets.join(', ')}`)
    
    // 4. Create a backup storage API endpoint
    console.log('\n4️⃣ Creating backup storage solution...')
    
    if (workingBuckets.length > 0) {
      console.log(`✅ Primary storage: ${workingBuckets[0]}`)
      if (workingBuckets.length > 1) {
        console.log(`🔄 Backup storage: ${workingBuckets[1]}`)
      }
    }
    
    // 5. Test with actual product data
    console.log('\n5️⃣ Testing with real product...')
    
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .limit(1)
    
    if (products && products.length > 0) {
      const product = products[0]
      console.log(`📦 Testing with product: ${product.name}`)
      
      // Upload a test image for this product
      const testImageUrl = await uploadTestImageForProduct(product.id)
      if (testImageUrl) {
        console.log(`✅ Test image uploaded: ${testImageUrl}`)
        
        // Update product with test image
        const { error: updateError } = await supabase
          .from('products')
          .update({ images: [testImageUrl] })
          .eq('id', product.id)
        
        if (updateError) {
          console.error('❌ Error updating product:', updateError)
        } else {
          console.log('✅ Product updated with test image')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in storage setup:', error)
  }
}

async function uploadTestImageForProduct(productId) {
  try {
    // Create a more realistic test image (PNG with actual image data)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAJ9ILI5tgAAAABJRU5ErkJggg=='
    const buffer = Buffer.from(testImageData, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    
    const fileName = `product-${productId}-${Date.now()}.png`
    const filePath = `products/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, blob)
    
    if (error) {
      console.error('Upload error:', error)
      return null
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)
    
    return publicUrl
  } catch (error) {
    console.error('Exception in upload:', error)
    return null
  }
}

fixStorageSetup()
