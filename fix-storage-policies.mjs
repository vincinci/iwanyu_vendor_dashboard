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

async function setupStoragePolicies() {
  console.log('🔒 SETTING UP STORAGE POLICIES')
  console.log('==============================')

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return
    }

    const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images')
    
    if (!productImagesBucket) {
      console.log('📦 Creating product-images bucket...')
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        console.error('Error creating bucket:', error)
        return
      }
      console.log('✅ Created product-images bucket')
    } else {
      console.log('✅ product-images bucket already exists')
    }

    console.log('\n🔒 Setting up storage policies...')
    console.log('Note: These might need to be set manually in Supabase Dashboard')
    console.log('\n📋 REQUIRED STORAGE POLICIES:')
    console.log('Bucket: product-images')
    console.log('')
    
    console.log('1. SELECT Policy (Public read access):')
    console.log('   Name: "Public read access"')
    console.log('   Operation: SELECT')
    console.log('   Target roles: public')
    console.log('   Policy: true')
    console.log('')
    
    console.log('2. INSERT Policy (Authenticated users can upload):')
    console.log('   Name: "Authenticated users can upload"')
    console.log('   Operation: INSERT')
    console.log('   Target roles: authenticated')
    console.log('   Policy: true')
    console.log('')
    
    console.log('3. UPDATE Policy (Users can update own files):')
    console.log('   Name: "Users can update own files"')
    console.log('   Operation: UPDATE')
    console.log('   Target roles: authenticated')
    console.log('   Policy: true')
    console.log('')
    
    console.log('4. DELETE Policy (Users can delete own files):')
    console.log('   Name: "Users can delete own files"')
    console.log('   Operation: DELETE')
    console.log('   Target roles: authenticated')
    console.log('   Policy: true')

    console.log('\n🚀 QUICK FIX: Try making bucket public')
    console.log('Go to: Supabase Dashboard > Storage > product-images > Settings')
    console.log('Enable: "Public bucket" option')

  } catch (error) {
    console.error('❌ Error setting up storage:', error)
  }
}

setupStoragePolicies().catch(console.error)
