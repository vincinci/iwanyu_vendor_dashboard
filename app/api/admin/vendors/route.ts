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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get vendors with pagination
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const status = url.searchParams.get("status") || ""

    let query = supabase
      .from("vendor_profiles")
      .select(`
        *,
        users(email, full_name),
        products(count),
        orders(count)
      `)
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: vendors, error: vendorsError } = await query

    if (vendorsError) {
      return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
    }

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error("Vendors API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
