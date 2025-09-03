#!/usr/bin/env node

/**
 * SETUP STORAGE BUCKETS FOR PRODUCT IMAGES
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorageBuckets() {
  console.log('🗂️  SETTING UP STORAGE BUCKETS')
  console.log('==============================')

  try {
    // Create product-images bucket if it doesn't exist
    const { data: existingBucket } = await supabase.storage.getBucket('product-images')
    
    if (!existingBucket) {
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        return
      }
      
      console.log('✅ Created product-images bucket')
    } else {
      console.log('✅ product-images bucket already exists')
    }

    // Set up storage policy for public access
    console.log('🔒 Setting up storage policies...')
    
    // Note: These policies would normally be set up in the Supabase dashboard
    // For now, we'll just log what needs to be done
    console.log('')
    console.log('📝 MANUAL STEP REQUIRED:')
    console.log('Go to Supabase Dashboard > Storage > Policies')
    console.log('Add these policies for the product-images bucket:')
    console.log('')
    console.log('1. SELECT Policy:')
    console.log('   Name: "Public read access"')
    console.log('   Target roles: public')
    console.log('   Operation: SELECT')
    console.log('')
    console.log('2. INSERT Policy:')
    console.log('   Name: "Authenticated users can upload"')
    console.log('   Target roles: authenticated')
    console.log('   Operation: INSERT')
    console.log('')
    console.log('3. UPDATE Policy:')
    console.log('   Name: "Users can update own files"')
    console.log('   Target roles: authenticated')
    console.log('   Operation: UPDATE')
    console.log('')
    console.log('4. DELETE Policy:')
    console.log('   Name: "Users can delete own files"')
    console.log('   Target roles: authenticated')
    console.log('   Operation: DELETE')

  } catch (error) {
    console.error('Error setting up storage:', error)
  }
}

setupStorageBuckets().catch(console.error)
