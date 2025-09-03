import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedUrls: string[] = []
    const errors: string[] = []
    
    // Primary and backup storage buckets
    const primaryBucket = 'product-images'
    const backupBucket = 'vendor-uploads'

    for (const file of files) {
      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Not an image file`)
          continue
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          errors.push(`${file.name}: File too large (max 10MB)`)
          continue
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        let uploadSuccess = false
        let publicUrl = ''

        // Try primary storage first
        try {
          const { data, error } = await supabase.storage
            .from(primaryBucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (!error) {
            const { data: { publicUrl: primaryUrl } } = supabase.storage
              .from(primaryBucket)
              .getPublicUrl(filePath)
            
            publicUrl = primaryUrl
            uploadSuccess = true
            console.log(`✅ Primary upload successful: ${fileName}`)
          } else {
            console.log(`⚠️ Primary storage failed for ${fileName}: ${error.message}`)
          }
        } catch (primaryError) {
          console.log(`⚠️ Primary storage exception for ${fileName}:`, primaryError)
        }

        // If primary failed, try backup storage
        if (!uploadSuccess) {
          try {
            const { data, error } = await supabase.storage
              .from(backupBucket)
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              })

            if (!error) {
              const { data: { publicUrl: backupUrl } } = supabase.storage
                .from(backupBucket)
                .getPublicUrl(filePath)
              
              publicUrl = backupUrl
              uploadSuccess = true
              console.log(`✅ Backup upload successful: ${fileName}`)
            } else {
              console.log(`❌ Backup storage also failed for ${fileName}: ${error.message}`)
            }
          } catch (backupError) {
            console.log(`❌ Backup storage exception for ${fileName}:`, backupError)
          }
        }

        if (uploadSuccess) {
          uploadedUrls.push(publicUrl)
        } else {
          errors.push(`${file.name}: Upload failed to both primary and backup storage`)
        }

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        errors.push(`${file.name}: Processing error`)
      }
    }

    const response = {
      success: uploadedUrls.length > 0,
      uploadedUrls,
      totalUploaded: uploadedUrls.length,
      totalFiles: files.length,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('📊 Upload summary:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error in POST /api/upload-images:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
