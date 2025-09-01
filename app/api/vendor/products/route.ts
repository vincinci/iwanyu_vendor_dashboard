import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get products with pagination
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""
    const status = url.searchParams.get("status") || ""

    let query = supabase
      .from("products")
      .select(`
        *,
        product_categories(name),
        order_items(quantity)
      `)
      .eq("vendor_id", vendor.id)
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, price, category_id, stock_quantity, images } = body

    // Validate required fields
    if (!name || !description || !price || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        vendor_id: vendor.id,
        name,
        description,
        price: Number.parseFloat(price),
        category_id,
        stock_quantity: Number.parseInt(stock_quantity) || 0,
        images: images || [],
        status: "active",
      })
      .select()
      .single()

    if (productError) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Create product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
