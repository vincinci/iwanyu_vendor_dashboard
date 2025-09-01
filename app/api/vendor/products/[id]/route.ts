import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // First, verify the product belongs to this vendor
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, vendor_id, images")
      .eq("id", id)
      .eq("vendor_id", user.id)
      .single()

    if (fetchError || !product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Delete associated images from storage if they exist
    if (product.images && Array.isArray(product.images)) {
      const imagePaths = product.images
        .filter((img: any) => img?.path || (typeof img === "string" && img.includes("products/")))
        .map((img: any) => img?.path || img)

      if (imagePaths.length > 0) {
        try {
          // Note: We're using the server client here, so we need to use the service role
          // to delete from storage since the user might not have direct storage permissions
          const { error: storageError } = await supabase.storage
            .from("products")
            .remove(imagePaths)

          if (storageError) {
            console.warn("Error deleting product images:", storageError)
            // Continue with product deletion even if image deletion fails
          }
        } catch (storageError) {
          console.warn("Error deleting product images:", storageError)
          // Continue with product deletion even if image deletion fails
        }
      }
    }

    // Delete the product record
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("vendor_id", user.id)

    if (deleteError) {
      console.error("Error deleting product:", deleteError)
      return new NextResponse("Failed to delete product", { status: 500 })
    }

    return new NextResponse("Product deleted successfully", { status: 200 })
  } catch (error) {
    console.error("Error in DELETE /api/vendor/products/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Fetch the product
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          description
        )
      `)
      .eq("id", id)
      .eq("vendor_id", user.id)
      .single()

    if (fetchError || !product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in GET /api/vendor/products/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      compare_at_price,
      category_id,
      brand,
      sku,
      inventory_quantity,
      status,
      images
    } = body

    // Verify the product belongs to this vendor
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, vendor_id")
      .eq("id", id)
      .eq("vendor_id", user.id)
      .single()

    if (fetchError || !existingProduct) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Update the product
    const { data: product, error: updateError } = await supabase
      .from("products")
      .update({
        name,
        description,
        price: parseFloat(price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        category_id,
        brand,
        sku,
        inventory_quantity: parseInt(inventory_quantity),
        status,
        images,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("vendor_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating product:", updateError)
      return new NextResponse("Failed to update product", { status: 500 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in PATCH /api/vendor/products/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
