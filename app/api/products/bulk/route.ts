import { createClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// Bulk operations for products
export async function POST(request: NextRequest) {
  try {
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

    if (!["vendor", "admin"].includes(profile?.role || "")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { operation, product_ids, data: updateData } = body

    if (!operation || !product_ids || !Array.isArray(product_ids)) {
      return new NextResponse("Invalid request format", { status: 400 })
    }

    let baseQuery = supabase.from("products")

    // Vendors can only operate on their own products
    if (profile?.role === "vendor") {
      // For operations that need filtering, we'll add the vendor constraint later
    }

    let result: any = {}

    switch (operation) {
      case "update_status":
        if (!updateData?.status) {
          return new NextResponse("Status is required for bulk status update", { status: 400 })
        }

        let updateQuery = baseQuery
          .update({ 
            status: updateData.status, 
            updated_at: new Date().toISOString() 
          })
          .in("id", product_ids)

        if (profile?.role === "vendor") {
          updateQuery = updateQuery.eq("vendor_id", user.id)
        }

        const { data: updatedProducts, error: updateError } = await updateQuery
          .select("id, name, status")

        if (updateError) {
          console.error("Error updating products:", updateError)
          return new NextResponse("Failed to update products", { status: 500 })
        }

        result = { 
          operation: "update_status", 
          updated_count: updatedProducts?.length || 0,
          updated_products: updatedProducts 
        }
        break

      case "update_stock":
        if (updateData?.stock_quantity === undefined) {
          return new NextResponse("Stock quantity is required for bulk stock update", { status: 400 })
        }

        let stockQuery = baseQuery
          .update({ 
            stock_quantity: updateData.stock_quantity,
            updated_at: new Date().toISOString() 
          })
          .in("id", product_ids)

        if (profile?.role === "vendor") {
          stockQuery = stockQuery.eq("vendor_id", user.id)
        }

        const { data: stockUpdatedProducts, error: stockError } = await stockQuery
          .select("id, name, stock_quantity")

        if (stockError) {
          console.error("Error updating stock:", stockError)
          return new NextResponse("Failed to update stock", { status: 500 })
        }

        result = { 
          operation: "update_stock", 
          updated_count: stockUpdatedProducts?.length || 0,
          updated_products: stockUpdatedProducts 
        }
        break

      case "update_category":
        if (!updateData?.category_id) {
          return new NextResponse("Category ID is required for bulk category update", { status: 400 })
        }

        let categoryQuery = baseQuery
          .update({ 
            category_id: updateData.category_id,
            updated_at: new Date().toISOString() 
          })
          .in("id", product_ids)

        if (profile?.role === "vendor") {
          categoryQuery = categoryQuery.eq("vendor_id", user.id)
        }

        const { data: categoryUpdatedProducts, error: categoryError } = await categoryQuery
          .select("id, name, category_id")

        if (categoryError) {
          console.error("Error updating categories:", categoryError)
          return new NextResponse("Failed to update categories", { status: 500 })
        }

        result = { 
          operation: "update_category", 
          updated_count: categoryUpdatedProducts?.length || 0,
          updated_products: categoryUpdatedProducts 
        }
        break

      case "delete":
        // Check for pending orders before deletion
        const { data: productsWithOrders } = await supabase
          .from("order_items")
          .select("product_id, orders!inner(status)")
          .in("product_id", product_ids)
          .in("orders.status", ["pending", "confirmed", "processing"])

        if (productsWithOrders && productsWithOrders.length > 0) {
          const conflictingProductIds = [...new Set(productsWithOrders.map((item: any) => item.product_id))]
          return NextResponse.json({
            error: "Some products have pending orders and cannot be deleted",
            conflicting_products: conflictingProductIds
          }, { status: 400 })
        }

        let deleteQuery = baseQuery
          .delete()
          .in("id", product_ids)

        if (profile?.role === "vendor") {
          deleteQuery = deleteQuery.eq("vendor_id", user.id)
        }

        const { data: deletedProducts, error: deleteError } = await deleteQuery
          .select("id, name")

        if (deleteError) {
          console.error("Error deleting products:", deleteError)
          return new NextResponse("Failed to delete products", { status: 500 })
        }

        result = { 
          operation: "delete", 
          deleted_count: deletedProducts?.length || 0,
          deleted_products: deletedProducts 
        }
        break

      case "duplicate":
        // Get products to duplicate
        let selectQuery = baseQuery
          .select("*")
          .in("id", product_ids)

        if (profile?.role === "vendor") {
          selectQuery = selectQuery.eq("vendor_id", user.id)
        }

        const { data: productsToDuplicate, error: fetchError } = await selectQuery

        if (fetchError || !productsToDuplicate?.length) {
          return new NextResponse("Failed to fetch products for duplication", { status: 500 })
        }

        // Create duplicates with modified names and new SKUs
        const duplicateData = productsToDuplicate.map((product: any) => ({
          ...product,
          id: undefined, // Let DB generate new ID
          name: `${product.name} (Copy)`,
          sku: `${product.sku}-COPY-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { data: duplicatedProducts, error: duplicateError } = await supabase
          .from("products")
          .insert(duplicateData)
          .select("id, name, sku")

        if (duplicateError) {
          console.error("Error duplicating products:", duplicateError)
          return new NextResponse("Failed to duplicate products", { status: 500 })
        }

        result = { 
          operation: "duplicate", 
          duplicated_count: duplicatedProducts?.length || 0,
          duplicated_products: duplicatedProducts 
        }
        break

      case "update_prices":
        if (!updateData?.price_adjustment) {
          return new NextResponse("Price adjustment is required", { status: 400 })
        }

        const { type, value } = updateData.price_adjustment
        if (!["percentage", "fixed"].includes(type) || typeof value !== "number") {
          return new NextResponse("Invalid price adjustment format", { status: 400 })
        }

        // Get current products to calculate new prices
        let pricesQuery = baseQuery
          .select("id, name, price")
          .in("id", product_ids)

        if (profile?.role === "vendor") {
          pricesQuery = pricesQuery.eq("vendor_id", user.id)
        }

        const { data: currentProducts, error: pricesFetchError } = await pricesQuery

        if (pricesFetchError || !currentProducts?.length) {
          return new NextResponse("Failed to fetch products for price update", { status: 500 })
        }

        // Calculate new prices
        const priceUpdates = currentProducts.map((product: any) => {
          let newPrice: number
          if (type === "percentage") {
            newPrice = product.price * (1 + value / 100)
          } else {
            newPrice = product.price + value
          }
          
          // Ensure price doesn't go below 0
          newPrice = Math.max(0.01, newPrice)
          
          return {
            id: product.id,
            price: Math.round(newPrice * 100) / 100 // Round to 2 decimal places
          }
        })

        // Update each product individually (Supabase doesn't support bulk updates with different values)
        const priceUpdatePromises = priceUpdates.map((update: any) =>
          supabase
            .from("products")
            .update({ 
              price: update.price, 
              updated_at: new Date().toISOString() 
            })
            .eq("id", update.id)
            .select("id, name, price")
            .single()
        )

        const priceResults = await Promise.allSettled(priceUpdatePromises)
        const successfulUpdates = priceResults
          .filter((result: any) => result.status === "fulfilled")
          .map((result: any) => (result as PromiseFulfilledResult<any>).value.data)

        result = { 
          operation: "update_prices", 
          updated_count: successfulUpdates.length,
          updated_products: successfulUpdates,
          adjustment: updateData.price_adjustment
        }
        break

      default:
        return new NextResponse("Invalid operation", { status: 400 })
    }

    // Create audit log for bulk operation
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "bulk_operation",
        table_name: "products",
        record_id: null,
        changes: { 
          operation, 
          product_ids, 
          data: updateData,
          result 
        },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in POST /api/products/bulk:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
