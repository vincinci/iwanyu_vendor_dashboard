import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

export async function POST(request: NextRequest) {
  console.log('🧪 Test upload endpoint called')
  
  try {
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

    console.log(`📤 Received ${files.length} files for testing`)
    
    // Just return mock success without actually uploading
    const mockUrls = files.map((file, index) => 
      `https://example.com/test-uploads/${Date.now()}-${index}-${file.name}`
    )
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${files.length} files`,
      urls: mockUrls,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    })
    
  } catch (error: any) {
    console.error('❌ Test upload failed:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || "Upload failed" 
    }, { status: 500 })
  }
}
