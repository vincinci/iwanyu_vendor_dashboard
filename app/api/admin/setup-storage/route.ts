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

    // Step 1: Create the buckets using the storage API
    const buckets = [
      { 
        id: 'products', 
        options: { 
          public: true, 
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB 
        } 
      },
      { 
        id: 'documents', 
        options: { 
          public: false, 
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          fileSizeLimit: 10485760 
        } 
      },
      { 
        id: 'stores', 
        options: { 
          public: true, 
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 
        } 
      }
    ]

    const results = []

    for (const bucket of buckets) {
      try {
        // Try to create the bucket
        const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucket.id, bucket.options)
        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating bucket ${bucket.id}:`, createError)
          results.push({ bucket: bucket.id, status: 'error', error: createError.message })
        } else {
          results.push({ bucket: bucket.id, status: 'success', created: !createError })
        }
      } catch (error) {
        console.error(`Exception creating bucket ${bucket.id}:`, error)
        results.push({ bucket: bucket.id, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Storage buckets setup completed. You need to manually run the RLS policies in Supabase SQL Editor.',
      buckets: results,
      note: 'Please run the SQL script in supabase_storage_policies.sql in your Supabase SQL Editor to complete the setup.'
    })

  } catch (error) {
    console.error('Setup storage error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Setup failed' 
    }, { status: 500 })
  }
}
