import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface Params {
  id: string
}

// Get specific product
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    let query = supabase
      .from("products")
      .select(`
        *,
        categories(id, name),
        profiles!vendor_id(id, first_name, last_name, business_name),
        product_reviews(id, rating, comment, created_at, profiles(first_name, last_name))
      `)
      .eq("id", id)

    // Vendors can only see their own products
    if (profile?.role === "vendor") {
      query = query.eq("vendor_id", user.id)
    } else if (profile?.role !== "admin") {
      // Regular users only see active products
      query = query.eq("status", "active")
    }

    const { data: product, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse("Product not found", { status: 404 })
      }
      console.error("Error fetching product:", error)
      return new NextResponse("Failed to fetch product", { status: 500 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Update product
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check user role and ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Get existing product to check ownership
    const { data: existingProduct } = await supabase
      .from("products")
      .select("vendor_id")
      .eq("id", id)
      .single()

    if (!existingProduct) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Check permissions
    if (profile?.role === "vendor" && existingProduct.vendor_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    } else if (!["vendor", "admin"].includes(profile?.role || "")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      category_id,
      stock_quantity,
      sku,
      images,
      tags,
      specifications,
      weight,
      dimensions,
      status
    } = body

    // Validation
    if (price !== undefined && price <= 0) {
      return new NextResponse("Price must be greater than 0", { status: 400 })
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
      return new NextResponse("Stock quantity cannot be negative", { status: 400 })
    }

    // Check if SKU already exists for this vendor (if changing SKU)
    if (sku) {
      const { data: skuCheck } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku)
        .eq("vendor_id", existingProduct.vendor_id)
        .neq("id", id)
        .single()

      if (skuCheck) {
        return new NextResponse("SKU already exists for this vendor", { status: 400 })
      }
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (category_id !== undefined) updateData.category_id = category_id
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity
    if (sku !== undefined) updateData.sku = sku
    if (images !== undefined) updateData.images = images
    if (tags !== undefined) updateData.tags = tags
    if (specifications !== undefined) updateData.specifications = specifications
    if (weight !== undefined) updateData.weight = weight
    if (dimensions !== undefined) updateData.dimensions = dimensions
    if (status !== undefined) updateData.status = status

    updateData.updated_at = new Date().toISOString()

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        categories(id, name),
        profiles!vendor_id(id, first_name, last_name, business_name)
      `)
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return new NextResponse("Failed to update product", { status: 500 })
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "update",
        table_name: "products",
        record_id: id,
        changes: { updated: updateData },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in PATCH /api/products/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check user role and ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Get existing product to check ownership
    const { data: existingProduct } = await supabase
      .from("products")
      .select("vendor_id, name")
      .eq("id", id)
      .single()

    if (!existingProduct) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Check permissions
    if (profile?.role === "vendor" && existingProduct.vendor_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    } else if (!["vendor", "admin"].includes(profile?.role || "")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if product has any pending orders
    const { data: pendingOrders } = await supabase
      .from("order_items")
      .select("id, orders!inner(status)")
      .eq("product_id", id)
      .in("orders.status", ["pending", "confirmed", "processing"])
      .limit(1)

    if (pendingOrders && pendingOrders.length > 0) {
      return new NextResponse("Cannot delete product with pending orders", { status: 400 })
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return new NextResponse("Failed to delete product", { status: 500 })
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "delete",
        table_name: "products",
        record_id: id,
        changes: { deleted: existingProduct },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error in DELETE /api/products/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
