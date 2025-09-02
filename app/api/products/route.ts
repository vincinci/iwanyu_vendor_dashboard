import { createClient as createServerClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// Get products with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status") // active, inactive, out_of_stock
    const sort = searchParams.get("sort") || "created_at"
    const order = searchParams.get("order") || "desc"
    const vendor_id = searchParams.get("vendor_id")
    const min_price = searchParams.get("min_price")
    const max_price = searchParams.get("max_price")
    
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        profiles!vendor_id(id, first_name, last_name, business_name)
      `)

    // Vendors can only see their own products
    if (profile?.role === "vendor") {
      query = query.eq("vendor_id", user.id)
    } else if (profile?.role !== "admin") {
      // Regular users only see active products
      query = query.eq("status", "active")
    }

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category_id", category)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (vendor_id && profile?.role === "admin") {
      query = query.eq("vendor_id", vendor_id)
    }

    if (min_price) {
      query = query.gte("price", parseFloat(min_price))
    }

    if (max_price) {
      query = query.lte("price", parseFloat(max_price))
    }

    // Get total count for pagination
    const countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    // Apply same filters to count query
    if (profile?.role === "vendor") {
      countQuery.eq("vendor_id", user.id)
    } else if (profile?.role !== "admin") {
      countQuery.eq("status", "active")
    }

    if (search) {
      countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      countQuery.eq("category_id", category)
    }

    if (status) {
      countQuery.eq("status", status)
    }

    if (vendor_id && profile?.role === "admin") {
      countQuery.eq("vendor_id", vendor_id)
    }

    if (min_price) {
      countQuery.gte("price", parseFloat(min_price))
    }

    if (max_price) {
      countQuery.lte("price", parseFloat(max_price))
    }

    const { count } = await countQuery

    // Apply sorting and pagination
    const validSortFields = ["name", "price", "stock_quantity", "created_at", "updated_at"]
    const sortField = validSortFields.includes(sort) ? sort : "created_at"
    const sortOrder = order === "asc" ? false : true

    const { data: products, error } = await query
      .order(sortField, { ascending: !sortOrder })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("Error in GET /api/products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create new product (vendors and admins)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!["vendor", "admin"].includes(profile?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      compare_at_price,
      category_id,
      inventory_quantity,
      stock_quantity,
      sku,
      brand,
      images,
      tags,
      specifications,
      weight,
      dimensions,
      status = "active",
      featured,
      seo_title,
      seo_description,
      track_inventory,
      vendor_id
    } = body

    // Use inventory_quantity if provided, otherwise fall back to stock_quantity
    const finalStockQuantity = inventory_quantity !== undefined ? inventory_quantity : (stock_quantity || 0)

    // Validation
    if (!name || !description || !price || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 })
    }

    if (finalStockQuantity < 0) {
      return NextResponse.json({ error: "Stock quantity cannot be negative" }, { status: 400 })
    }

    // Determine vendor_id
    let finalVendorId = user.id
    if (profile?.role === "admin" && vendor_id) {
      finalVendorId = vendor_id
    }

    // Check if SKU already exists for this vendor
    if (sku) {
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku)
        .eq("vendor_id", finalVendorId)
        .single()

      if (existingProduct) {
        return NextResponse.json({ error: "SKU already exists for this vendor" }, { status: 400 })
      }
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        description,
        price,
        compare_at_price,
        category_id,
        stock_quantity: finalStockQuantity,
        sku: sku || `PRD-${Date.now()}`,
        brand,
        images: images || [],
        tags: tags || [],
        specifications: specifications || {},
        weight,
        dimensions,
        status,
        featured: featured || false,
        seo_title,
        seo_description,
        track_inventory: track_inventory || false,
        vendor_id: finalVendorId,
      })
      .select(`
        *,
        categories(id, name),
        profiles!vendor_id(id, first_name, last_name, business_name)
      `)
      .single()

    if (error) {
      console.error("Error creating product:", error)
      console.error("Product data that failed:", {
        name,
        description,
        price,
        compare_at_price,
        category_id,
        stock_quantity: finalStockQuantity,
        sku: sku || `PRD-${Date.now()}`,
        brand,
        images: images || [],
        tags: tags || [],
        specifications: specifications || {},
        weight,
        dimensions,
        status,
        featured: featured || false,
        seo_title,
        seo_description,
        track_inventory: track_inventory || false,
        vendor_id: finalVendorId,
      })
      return NextResponse.json({ 
        error: "Failed to create product", 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "create",
        table_name: "products",
        record_id: product.id,
        changes: { created: product },
        ip_address: request.headers.get("x-forwarded-for") || "unknown"
      })
    } catch (auditError) {
      console.log("Could not create audit log:", auditError)
    }

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
