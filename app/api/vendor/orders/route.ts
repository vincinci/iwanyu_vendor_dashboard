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

    // Get orders with pagination
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const status = url.searchParams.get("status") || ""

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items!inner(
          *,
          products!inner(
            name,
            price,
            vendor_id
          )
        ),
        users(email, full_name)
      `)
      .eq("order_items.products.vendor_id", vendor.id)
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
