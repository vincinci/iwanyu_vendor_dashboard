import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

// Runtime configuration
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  console.log('� Image upload request received')
  
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Authentication failed')
      return NextResponse.json({ 
        success: false,
        error: "Authentication required" 
      }, { status: 401 })
    }

    console.log(`✅ User authenticated: ${user.id}`)

    // Parse form data
    const formData = await request.formData()
    
    // Support both field formats: "files" and "image_0", "image_1", etc.
    let files: File[] = []
    
    // Try "files" field first (standard)
    const filesField = formData.getAll("files") as File[]
    if (filesField.length > 0) {
      files = filesField
    } else {
      // Try "image_0", "image_1", etc. format
      const entries = Array.from(formData.entries())
      files = entries
        .filter(([key, value]) => key.startsWith('image_') && value instanceof File)
        .map(([key, value]) => value as File)
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "No files provided" 
      }, { status: 400 })
    }

    console.log(`� Processing ${files.length} files`)

    const results = []
    const errors = []

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`� Processing file ${i + 1}: ${file.name} (${Math.round(file.size / 1024)}KB)`)

      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          errors.push({ file: file.name, error: validation.error })
          continue
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name, user.id)
        const filePath = `products/${filename}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.log(`❌ Upload failed for ${file.name}:`, uploadError.message)
          errors.push({ file: file.name, error: uploadError.message })
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        // Verify the URL is accessible
        try {
          const response = await fetch(publicUrl, { method: 'HEAD' })
          if (!response.ok) {
            throw new Error(`URL not accessible: ${response.status}`)
          }
        } catch (urlError) {
          console.log(`⚠️ URL verification failed for ${file.name}`)
        }

        results.push({
          filename: file.name,
          url: publicUrl,
          path: filePath,
          size: file.size,
          type: file.type
        })

        console.log(`✅ Successfully uploaded: ${file.name} → ${publicUrl}`)

      } catch (fileError) {
        console.log(`❌ Error processing ${file.name}:`, fileError)
        errors.push({ 
          file: file.name, 
          error: fileError instanceof Error ? fileError.message : 'Unknown error' 
        })
      }
    }

    // Return comprehensive response
    const response = {
      success: results.length > 0,
      uploaded: results.length,
      total: files.length,
      files: results,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log(`🎯 Upload complete: ${results.length}/${files.length} files successful`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Upload endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// File validation function
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Only JPG, PNG, WebP, and GIF are allowed.` }
  }

  // Check file size (3MB limit)
  const maxSize = 3 * 1024 * 1024 // 3MB
  if (file.size > maxSize) {
    return { valid: false, error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size is 3MB.` }
  }

  // Check minimum size (1KB)
  if (file.size < 1024) {
    return { valid: false, error: 'File too small. Minimum size is 1KB.' }
  }

  return { valid: true }
}

// Generate unique filename
function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
  
  return `${timestamp}-${sanitizedUserId}-${random}.${extension}`
}
