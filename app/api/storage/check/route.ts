import { createServerClient } from "@/utils/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Check if products bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return NextResponse.json({ 
        error: `Failed to list buckets: ${listError.message}` 
      }, { status: 500 })
    }

    const productsBucket = buckets?.find(b => b.name === 'products')
    
    if (!productsBucket) {
      // Try to create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('products', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError) {
        return NextResponse.json({ 
          error: `Failed to create products bucket: ${createError.message}` 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Products bucket created successfully',
        bucket: newBucket 
      })
    }

    // Test upload permission
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const testPath = `test/test_${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(testPath, testFile)

    if (uploadError) {
      return NextResponse.json({ 
        error: `Storage upload test failed: ${uploadError.message}`,
        bucket: productsBucket,
        suggestion: 'Check RLS policies on storage.objects table'
      }, { status: 500 })
    }

    // Clean up test file
    await supabase.storage.from('products').remove([testPath])

    return NextResponse.json({ 
      message: 'Storage is working correctly',
      bucket: productsBucket 
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Storage check failed' 
    }, { status: 500 })
  }
}
