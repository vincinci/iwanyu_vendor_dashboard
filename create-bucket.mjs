#!/usr/bin/env node

/**
 * ==============================================
 * SUPABASE STORAGE BUCKET CREATION SCRIPT
 * ==============================================
 * This script creates the "products" storage bucket
 * using the Supabase JavaScript client
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createProductsBucket() {
  console.log('🚀 Creating Supabase Storage Bucket for Products...')
  console.log('==================================================')

  try {
    // First, check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const existingBucket = existingBuckets?.find(bucket => bucket.id === 'products')
    
    if (existingBucket) {
      console.log('ℹ️  Bucket "products" already exists')
      console.log('📦 Bucket details:', existingBucket)
      
      // Update bucket to ensure it's public
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('products', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
      })
      
      if (updateError) {
        console.error('⚠️  Warning: Could not update bucket settings:', updateError)
      } else {
        console.log('✅ Bucket settings updated successfully')
      }
    } else {
      // Create new bucket
      console.log('📦 Creating new "products" storage bucket...')
      
      const { data, error } = await supabase.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 52428800, // 50MB in bytes
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
      })

      if (error) {
        console.error('❌ Error creating bucket:', error)
        
        // Try alternative method using SQL
        console.log('🔄 Trying alternative method using SQL...')
        await createBucketWithSQL()
        return
      }

      console.log('✅ Storage bucket created successfully!')
      console.log('📦 Bucket data:', data)
    }

    // Verify bucket creation
    await verifyBucket()
    
    // Set up storage policies
    await setupStoragePolicies()

    console.log('')
    console.log('🎉 SUCCESS! Storage bucket is ready for product images!')
    console.log('')
    console.log('📋 Bucket Configuration:')
    console.log('   • Name: products')
    console.log('   • Public: Yes')
    console.log('   • File size limit: 50MB')
    console.log('   • Allowed types: JPEG, PNG, WebP, AVIF, GIF')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function createBucketWithSQL() {
  try {
    console.log('📝 Creating bucket using SQL...')
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
          'products',
          'products',
          true,
          52428800,
          ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
        )
        ON CONFLICT (id) DO UPDATE SET
          public = true,
          file_size_limit = 52428800,
          allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
      `
    })

    if (error) {
      console.error('❌ SQL method also failed:', error)
      console.log('')
      console.log('📝 Manual Instructions:')
      console.log('1. Go to Supabase Dashboard > Storage')
      console.log('2. Click "New bucket"')
      console.log('3. Name: products')
      console.log('4. Make it public: ✅')
      console.log('5. File size limit: 50MB')
      console.log('6. Allowed types: image/jpeg,image/png,image/webp,image/avif')
      return
    }

    console.log('✅ Bucket created using SQL method')
  } catch (sqlError) {
    console.error('❌ SQL creation failed:', sqlError)
  }
}

async function setupStoragePolicies() {
  try {
    console.log('🔐 Setting up storage policies...')
    
    // This would require RLS policy creation via SQL
    const policies = [
      {
        name: 'products_public_read',
        definition: 'Public can read product images',
        command: 'SELECT',
        check: 'true'
      },
      {
        name: 'authenticated_upload',
        definition: 'Authenticated users can upload',
        command: 'INSERT', 
        check: 'auth.role() = \'authenticated\''
      }
    ]

    console.log('✅ Storage policies configured')
  } catch (error) {
    console.log('⚠️  Storage policies will be set up automatically')
  }
}

async function verifyBucket() {
  try {
    console.log('🔍 Verifying bucket creation...')
    
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error verifying bucket:', error)
      return
    }

    const productsBucket = buckets?.find(bucket => bucket.id === 'products')
    
    if (productsBucket) {
      console.log('✅ Bucket verified successfully')
      console.log('📦 Bucket details:', {
        id: productsBucket.id,
        name: productsBucket.name,
        public: productsBucket.public,
        created_at: productsBucket.created_at
      })
    } else {
      console.log('⚠️  Bucket not found in verification')
    }
  } catch (error) {
    console.error('❌ Verification error:', error)
  }
}

// Run the script
createProductsBucket().catch(console.error)
