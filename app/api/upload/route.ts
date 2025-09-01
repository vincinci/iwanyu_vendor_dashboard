import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use service role client for storage operations to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string || 'products'
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${path}/${fileName}`

    // Upload file to storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ 
        error: `Upload failed: ${error.message}` 
      }, { status: 500 })
    }

    // Get public URL using admin client
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        fullPath: filePath,
        publicUrl
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 })
  }
}
