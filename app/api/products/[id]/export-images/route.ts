import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productId = params.id

    // Get the product with its images
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("vendor_id", user.id) // Ensure user owns the product
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.images || product.images.length === 0) {
      return NextResponse.json({ error: "No images found for this product" }, { status: 404 })
    }

    // Return the image URLs for download
    const imageData = product.images.map((imageUrl: string, index: number) => {
      const fileName = imageUrl.split('/').pop() || `image-${index + 1}`
      return {
        url: imageUrl,
        filename: fileName,
        originalName: `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_image_${index + 1}.${fileName.split('.').pop() || 'jpg'}`
      }
    })

    return NextResponse.json({
      productName: product.name,
      images: imageData,
      totalImages: imageData.length
    })

  } catch (error) {
    console.error("Error in GET /api/products/[id]/export-images:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
