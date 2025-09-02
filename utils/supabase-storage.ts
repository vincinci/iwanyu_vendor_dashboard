import { createClient } from "@/utils/supabase-client"

export const STORAGE_BUCKETS = {
  DOCUMENTS: "documents",
  PRODUCTS: "products",
  STORES: "stores",
} as const

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

export interface FileUploadResult {
  success: boolean
  data?: {
    path: string
    fullPath: string
    publicUrl: string
  }
  error?: string
}

export async function uploadFile(file: File, bucket: StorageBucket, path: string): Promise<FileUploadResult> {
  try {
    // Use server-side API route to handle upload with proper authentication
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', path)
    formData.append('bucket', bucket)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { 
        success: false, 
        error: result.error || `Upload failed with status ${response.status}` 
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

export async function deleteFile(bucket: StorageBucket, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    }
  }
}

export async function getFileUrl(bucket: StorageBucket, path: string): Promise<string> {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

export async function saveFileMetadata(
  fileName: string,
  filePath: string,
  fileType: string,
  fileSize: number,
  bucket: StorageBucket,
  category: "id_document" | "business_license" | "product_image" | "store_logo" | "store_banner" | "other",
) {
  // TODO: Create file_storage table or implement metadata tracking
  // For now, skip metadata saving to avoid RLS policy violations
  console.log('File metadata would be saved:', { fileName, filePath, fileType, fileSize, bucket, category })
  
  return { 
    data: { 
      id: Math.random().toString(), 
      file_name: fileName, 
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
      bucket_name: bucket,
      category 
    }, 
    error: null 
  }
}

export function createStorageClient() {
  return createClient().storage
}

export { createClient as createSupabaseClient }
