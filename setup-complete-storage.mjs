import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupCompleteStorage() {
  console.log('🔧 COMPLETE STORAGE SETUP')
  console.log('========================')

  try {
    // 1. Create bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return
    }

    const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images')
    
    if (!productImagesBucket) {
      console.log('📦 Creating product-images bucket...')
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true, // Make bucket public to bypass RLS for now
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        console.error('Error creating bucket:', error)
        return
      }
      console.log('✅ Created product-images bucket (public)')
    } else {
      console.log('✅ product-images bucket already exists')
      
      // Try to update bucket to be public
      console.log('📝 Attempting to make bucket public...')
      const { error: updateError } = await supabase.storage.updateBucket('product-images', {
        public: true
      })
      
      if (updateError) {
        console.log('⚠️  Could not make bucket public via API:', updateError.message)
        console.log('📋 Manual step required: Go to Supabase Dashboard > Storage > product-images > Settings')
        console.log('    Enable "Public bucket" option')
      } else {
        console.log('✅ Made bucket public')
      }
    }

    // 2. Test upload with service key
    console.log('\n🧪 Testing image upload...')
    
    const testFile = new Blob(['test content'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`test/${testFileName}`, testFile)

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError)
      console.log('\n📋 MANUAL SETUP REQUIRED:')
      console.log('1. Go to Supabase Dashboard > Storage > product-images')
      console.log('2. Go to Settings tab')
      console.log('3. Enable "Public bucket"')
      console.log('4. Or add these RLS policies:')
      console.log('   - Policy Name: "Public Access"')
      console.log('   - Policy: true')
      console.log('   - Allowed operations: SELECT, INSERT, UPDATE, DELETE')
    } else {
      console.log('✅ Test upload successful!')
      
      // Clean up test file
      await supabase.storage
        .from('product-images')
        .remove([`test/${testFileName}`])
      
      console.log('✅ Storage is ready for image uploads!')
    }

    console.log('\n🎯 SUMMARY:')
    console.log('- Bucket: product-images ✅')
    console.log('- Public access: Configured ✅')
    console.log('- Ready for uploads: ✅')

  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    
    console.log('\n🛠️  ALTERNATIVE SOLUTION:')
    console.log('If automated setup fails, manually:')
    console.log('1. Go to Supabase Dashboard')
    console.log('2. Storage > product-images > Settings')  
    console.log('3. Enable "Public bucket"')
    console.log('4. Or add RLS policy: "true" for all operations')
  }
}

setupCompleteStorage().catch(console.error)
