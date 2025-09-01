import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Get orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const customer_id = searchParams.get("customer_id")
    const vendor_id = searchParams.get("vendor_id")
    const date_from = searchParams.get("date_from")
    const date_to = searchParams.get("date_to")
    const sort = searchParams.get("sort") || "created_at"
    const order = searchParams.get("order") || "desc"
    
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
      .from("orders")
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

    // Apply role-based filtering
    if (profile?.role === "vendor") {
      // Vendors only see orders that contain their products
      query = query.filter("order_items.products.vendor_id", "eq", user.id)
    } else if (profile?.role === "customer") {
      query = query.eq("customer_id", user.id)
    } else if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    if (customer_id && profile?.role === "admin") {
      query = query.eq("customer_id", customer_id)
    }

    if (vendor_id && profile?.role === "admin") {
      query = query.filter("order_items.products.vendor_id", "eq", vendor_id)
    }

    if (date_from) {
      query = query.gte("created_at", date_from)
    }

    if (date_to) {
      query = query.lte("created_at", date_to)
    }

    // Get total count for pagination
    const countQuery = supabase
      .from("orders")
      .select("*", { count: "exact", head: true })

    // Apply same filters to count query
    if (profile?.role === "vendor") {
      countQuery.filter("order_items.products.vendor_id", "eq", user.id)
    } else if (profile?.role === "customer") {
      countQuery.eq("customer_id", user.id)
    }

    if (status) countQuery.eq("status", status)
    if (customer_id && profile?.role === "admin") countQuery.eq("customer_id", customer_id)
    if (date_from) countQuery.gte("created_at", date_from)
    if (date_to) countQuery.lte("created_at", date_to)

    const { count } = await countQuery

    // Apply sorting and pagination
    const validSortFields = ["created_at", "updated_at", "total", "status"]
    const sortField = validSortFields.includes(sort) ? sort : "created_at"
    const sortOrder = order === "asc" ? false : true

    const { data: orders, error } = await query
      .order(sortField, { ascending: !sortOrder })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Error fetching orders:", error)
      return new NextResponse("Failed to fetch orders", { status: 500 })
    }

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("Error in GET /api/orders:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Create new order (customers and admins)
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

    if (!["customer", "admin"].includes(profile?.role || "")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const {
      items,
      shipping_address,
      billing_address,
      payment_method,
      notes,
      customer_id
    } = body

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 })
    }

    if (!shipping_address) {
      return new NextResponse("Shipping address is required", { status: 400 })
    }

    // Determine customer_id
    let finalCustomerId = user.id
    if (profile?.role === "admin" && customer_id) {
      finalCustomerId = customer_id
    }

    // Validate products and calculate totals
    let subtotal = 0
    const validatedItems = []

    for (const item of items) {
      const { product_id, quantity } = item

      if (!product_id || !quantity || quantity <= 0) {
        return new NextResponse("Invalid item data", { status: 400 })
      }

      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity, vendor_id, status")
        .eq("id", product_id)
        .eq("status", "active")
        .single()

      if (productError || !product) {
        return new NextResponse(`Product ${product_id} not found or inactive`, { status: 400 })
      }

      if (product.stock_quantity < quantity) {
        return new NextResponse(`Insufficient stock for product ${product.name}`, { status: 400 })
      }

      const itemTotal = product.price * quantity
      subtotal += itemTotal

      validatedItems.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total: itemTotal
      })
    }

    // Calculate taxes and shipping (simplified)
    const taxRate = 0.1 // 10% tax
    const tax = subtotal * taxRate
    const shipping = subtotal > 100 ? 0 : 10 // Free shipping over $100
    const total = subtotal + tax + shipping

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: finalCustomerId,
        status: "pending",
        subtotal,
        tax,
        shipping,
        total,
        shipping_address,
        billing_address: billing_address || shipping_address,
        payment_method: payment_method || "pending",
        notes
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return new NextResponse("Failed to create order", { status: 500 })
    }

    // Create order items
    const orderItemsWithOrderId = validatedItems.map(item => ({
      ...item,
      order_id: order.id
    }))

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId)
      .select()

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      // Rollback order creation
      await supabase.from("orders").delete().eq("id", order.id)
      return new NextResponse("Failed to create order items", { status: 500 })
    }

    // Update product stock quantities
    const stockUpdates = validatedItems.map(async (item) => {
      const { data: currentProduct } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single()

      if (currentProduct) {
        return supabase
          .from("products")
          .update({ 
            stock_quantity: currentProduct.stock_quantity - item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq("id", item.product_id)
      }
    })

    await Promise.all(stockUpdates)

    // Create notifications for vendors
    const vendorNotificationPromises = [...new Set(validatedItems.map(item => item.vendor_id))].map(async (vendor_id) => {
      try {
        await supabase.rpc('create_notification', {
          p_user_id: vendor_id,
          p_title: 'New Order Received',
          p_message: `You have received a new order #${order.id}`,
          p_type: 'order',
          p_priority: 'normal',
          p_metadata: { order_id: order.id, total: order.total },
          p_action_url: `/vendor/orders/${order.id}`
        })
      } catch (notificationError) {
        console.log("Could not create notification - table may not exist yet")
      }
    })

    await Promise.allSettled(vendorNotificationPromises)

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "create",
        table_name: "orders",
        record_id: order.id,
        changes: { created: { order, items: orderItems } },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return NextResponse.json({
      ...order,
      order_items: orderItems
    }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/orders:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
