import { createClient as createServerClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

interface Params {
  id: string
}

// Get specific order
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createServerClient()
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
      .from("orders")
      .select(`
        *,
        profiles!customer_id(id, first_name, last_name, email),
        order_items(
          id,
          quantity,
          unit_price,
          total,
          products(id, name, sku, images, vendor_id),
          profiles!vendor_id(id, first_name, last_name, business_name)
        )
      `)
      .eq("id", id)

    // Apply role-based filtering
    if (profile?.role === "vendor") {
      // Vendors only see orders that contain their products
      query = query.filter("order_items.products.vendor_id", "eq", user.id)
    } else if (profile?.role === "customer") {
      query = query.eq("customer_id", user.id)
    } else if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { data: order, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse("Order not found", { status: 404 })
      }
      console.error("Error fetching order:", error)
      return new NextResponse("Failed to fetch order", { status: 500 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error in GET /api/orders/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Update order status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createServerClient()
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

    // Get existing order to check permissions
    const { data: existingOrder } = await supabase
      .from("orders")
      .select(`
        customer_id,
        status,
        confirmed_at,
        shipped_at,
        delivered_at,
        order_items(vendor_id)
      `)
      .eq("id", id)
      .single()

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 404 })
    }

    const body = await request.json()
    const { status, tracking_number, notes, vendor_notes } = body

    // Check permissions based on role
    if (profile?.role === "customer") {
      // Customers can only cancel their own orders if still pending
      if (existingOrder.customer_id !== user.id) {
        return new NextResponse("Forbidden", { status: 403 })
      }
      if (status !== "cancelled" || existingOrder.status !== "pending") {
        return new NextResponse("Customers can only cancel pending orders", { status: 400 })
      }
    } else if (profile?.role === "vendor") {
      // Vendors can only update orders that contain their products
      const vendorOrderItems = existingOrder.order_items?.filter(
        (item: any) => item.vendor_id === user.id
      )
      if (!vendorOrderItems?.length) {
        return new NextResponse("Forbidden", { status: 403 })
      }
      // Vendors can update to confirmed, processing, shipped
      const allowedStatuses = ["confirmed", "processing", "shipped"]
      if (!allowedStatuses.includes(status)) {
        return new NextResponse("Invalid status for vendor", { status: 400 })
      }
    } else if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Validate status transition
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if (status && !validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    // Build update object
    const updateData: any = {}
    if (status) updateData.status = status
    if (tracking_number) updateData.tracking_number = tracking_number
    if (notes) updateData.notes = notes
    if (vendor_notes) updateData.vendor_notes = vendor_notes

    // Set timestamps based on status
    if (status === "confirmed" && !existingOrder.confirmed_at) {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === "shipped" && !existingOrder.shipped_at) {
      updateData.shipped_at = new Date().toISOString()
    } else if (status === "delivered" && !existingOrder.delivered_at) {
      updateData.delivered_at = new Date().toISOString()
    }

    updateData.updated_at = new Date().toISOString()

    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        profiles!customer_id(id, first_name, last_name, email),
        order_items(
          id,
          quantity,
          unit_price,
          total,
          products(id, name, sku, vendor_id),
          profiles!vendor_id(id, first_name, last_name, business_name)
        )
      `)
      .single()

    if (error) {
      console.error("Error updating order:", error)
      return new NextResponse("Failed to update order", { status: 500 })
    }

    // If order is cancelled, restore product stock
    if (status === "cancelled" && existingOrder.status !== "cancelled") {
      const stockRestorePromises = order.order_items.map(async (item: any) => {
        const { data: currentProduct } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.products.id)
          .single()

        if (currentProduct) {
          return supabase
            .from("products")
            .update({ 
              stock_quantity: currentProduct.stock_quantity + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq("id", item.products.id)
        }
      })

      await Promise.allSettled(stockRestorePromises)
    }

    // Create notification for customer
    try {
      await supabase.rpc('create_notification', {
        p_user_id: order.customer_id,
        p_title: 'Order Status Updated',
        p_message: `Your order #${order.id} is now ${status}`,
        p_type: 'order',
        p_priority: status === 'cancelled' ? 'high' : 'normal',
        p_metadata: { order_id: id, status, total: order.total },
        p_action_url: `/orders/${id}`
      })
    } catch (notificationError) {
      console.log("Could not create notification - table may not exist yet")
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "update",
        table_name: "orders",
        record_id: id,
        changes: { 
          updated: updateData,
          previous_status: existingOrder.status,
          new_status: status 
        },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error in PATCH /api/orders/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Delete order (admin only, and only if pending)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check user role - only admins can delete orders
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Get existing order
    const { data: existingOrder } = await supabase
      .from("orders")
      .select(`
        status,
        order_items(
          quantity,
          products(id, stock_quantity)
        )
      `)
      .eq("id", id)
      .single()

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 404 })
    }

    // Only allow deletion of pending orders
    if (existingOrder.status !== "pending") {
      return new NextResponse("Can only delete pending orders", { status: 400 })
    }

    // Restore product stock before deletion
    const stockRestorePromises = existingOrder.order_items.map(async (item: any) => {
      return supabase
        .from("products")
        .update({ 
          stock_quantity: item.products.stock_quantity + item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.products.id)
    })

    await Promise.allSettled(stockRestorePromises)

    // Delete order (order_items will be deleted by CASCADE)
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting order:", error)
      return new NextResponse("Failed to delete order", { status: 500 })
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "delete",
        table_name: "orders",
        record_id: id,
        changes: { deleted: existingOrder },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error in DELETE /api/orders/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
