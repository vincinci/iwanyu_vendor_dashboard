import { NextRequest, NextResponse } from "next/server"

// Simple cloud storage backup using base64 encoding
// This can be enhanced to use services like Cloudinary, AWS S3, etc.

interface ImageBackup {
  id: string
  originalName: string
  mimeType: string
  size: number
  base64Data: string
  uploadedAt: string
  productId?: string
}

// In-memory backup storage (in production, use a database or external service)
const imageBackups = new Map<string, ImageBackup>()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const productId = formData.get("productId") as string
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const backupIds: string[] = []
    const errors: string[] = []

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

        // Convert to base64 for backup storage
        const arrayBuffer = await file.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')
        
        const backupId = `backup-${Date.now()}-${Math.random().toString(36).substring(2)}`
        
        const backup: ImageBackup = {
          id: backupId,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          base64Data,
          uploadedAt: new Date().toISOString(),
          productId
        }

        backupIds.push(backupId)

      } catch (error) {
        console.error(`Error backing up ${file.name}:`, error)
        errors.push(`${file.name}: Backup failed`)
      }
    }

    return NextResponse.json({
      success: backupIds.length > 0,
      backupIds,
      totalBacked: backupIds.length,
      totalFiles: files.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Error in POST /api/backup-images:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('id')
    
    if (!backupId) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 })
    }

    const backup = imageBackups.get(backupId)
    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    // Convert base64 back to image
    const imageBuffer = Buffer.from(backup.base64Data, 'base64')
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': backup.mimeType,
        'Content-Length': backup.size.toString(),
        'Content-Disposition': `attachment; filename="${backup.originalName}"`
      }
    })

  } catch (error) {
    console.error("Error in GET /api/backup-images:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
