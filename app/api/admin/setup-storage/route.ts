import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Use service role key for administrative operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, ensure the bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 })
    }

    const productsBucketExists = buckets.some(bucket => bucket.name === 'products')
    
    if (!productsBucketExists) {
      // Create the products bucket
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('products', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760 // 10MB
      })

      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError)
        return NextResponse.json({ error: 'Failed to create bucket' }, { status: 500 })
      }
    }

    // Execute SQL to create RLS policies
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Enable RLS on storage.objects if not already enabled
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Authenticated users can upload to products bucket" ON storage.objects;
        DROP POLICY IF EXISTS "Public read access for products bucket" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;

        -- Create policies for products bucket
        CREATE POLICY "Authenticated users can upload to products bucket"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'products');

        CREATE POLICY "Public read access for products bucket"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'products');

        CREATE POLICY "Users can delete their own uploads"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

        CREATE POLICY "Users can update their own uploads"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
      `
    })

    if (sqlError) {
      console.error('Error executing SQL:', sqlError)
      return NextResponse.json({ error: 'Failed to create policies' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Storage bucket and policies configured successfully',
      bucketExists: productsBucketExists
    })

  } catch (error) {
    console.error('Setup storage error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Setup failed' 
    }, { status: 500 })
  }
}
