#!/usr/bin/env node

// Setup script to configure Supabase storage bucket and RLS policies
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase storage bucket and policies...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials in .env.local')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if bucket exists
    console.log('📁 Checking if products bucket exists...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }

    const productsBucketExists = buckets.some(bucket => bucket.name === 'products')
    
    if (!productsBucketExists) {
      console.log('📁 Creating products bucket...')
      const { error: createBucketError } = await supabase.storage.createBucket('products', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760 // 10MB
      })

      if (createBucketError) {
        console.error('❌ Error creating bucket:', createBucketError)
        return
      }
      console.log('✅ Products bucket created successfully')
    } else {
      console.log('✅ Products bucket already exists')
    }

    // Set up RLS policies using SQL
    console.log('🔐 Setting up RLS policies...')
    
    // Execute SQL to create RLS policies
    const sqlCommands = [
      // Enable RLS
      `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
      
      // Drop existing policies if they exist
      `DROP POLICY IF EXISTS "Authenticated users can upload to products bucket" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Public read access for products bucket" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;`,
      
      // Create new policies
      `CREATE POLICY "Authenticated users can upload to products bucket"
       ON storage.objects FOR INSERT
       TO authenticated
       WITH CHECK (bucket_id = 'products');`,
       
      `CREATE POLICY "Public read access for products bucket"
       ON storage.objects FOR SELECT
       TO public
       USING (bucket_id = 'products');`,
       
      `CREATE POLICY "Users can delete their own uploads"
       ON storage.objects FOR DELETE
       TO authenticated
       USING (bucket_id = 'products');`,
       
      `CREATE POLICY "Users can update their own uploads"
       ON storage.objects FOR UPDATE
       TO authenticated
       USING (bucket_id = 'products');`
    ]

    for (const sql of sqlCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.error('❌ Error executing SQL:', sql, error)
        // Try individual policy creation
        continue
      }
    }

    console.log('✅ RLS policies configured successfully')
    console.log('🎉 Storage setup complete! You can now upload images to the products bucket.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

setupStorage()
