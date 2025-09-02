import { createClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// Get vendor-specific analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, 1y
    const type = searchParams.get("type") || "overview" // overview, products, orders, revenue
    
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Auth error or no user:', authError, user?.id)
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is vendor
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.log('Profile query error:', profileError)
      return new NextResponse("Profile not found", { status: 404 })
    }

    if (profile?.role !== "vendor") {
      console.log('User role is not vendor:', profile?.role)
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    if (type === "overview") {
      try {
        // Get product counts
        const { count: totalProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", user.id)

        const { count: activeProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", user.id)
          .eq("status", "active")

        const { count: draftProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", user.id)
          .eq("status", "draft")

        // Get order count (with fallback if orders table doesn't exist)
        let totalOrders = 0
        let recentOrders: any[] = []
        let totalRevenue = 0

        try {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("vendor_id", user.id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
          totalOrders = count || 0
        } catch (orderError) {
          console.log('Orders table not available:', orderError)
        }

        try {
          const { data } = await supabase
            .from("orders")
            .select(`
              id,
              order_number,
              total,
              status,
              created_at,
              customer_name
            `)
            .eq("vendor_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5)
          recentOrders = data || []
        } catch (orderError) {
          console.log('Recent orders query failed:', orderError)
        }

        try {
          const { data: revenueData } = await supabase
            .from("orders")
            .select("total")
            .eq("vendor_id", user.id)
            .eq("status", "completed")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())

          totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0) || 0
        } catch (revenueError) {
          console.log('Revenue calculation failed:', revenueError)
        }

        // Get top products
        const { data: topProducts } = await supabase
          .from("products")
          .select(`
            id,
            name,
            price,
            inventory_quantity,
            status
          `)
          .eq("vendor_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(5)

        return NextResponse.json({
          overview: {
            total_products: totalProducts || 0,
            active_products: activeProducts || 0,
            draft_products: draftProducts || 0,
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          },
          recent_orders: recentOrders,
          top_products: topProducts || [],
          period,
        })

      } catch (error) {
        console.error('Error fetching analytics data:', error)
        
        // Return default empty data structure
        return NextResponse.json({
          overview: {
            total_products: 0,
            active_products: 0,
            draft_products: 0,
            total_orders: 0,
            total_revenue: 0,
            avg_order_value: 0,
          },
          recent_orders: [],
          top_products: [],
          period,
        })
      }
    }

    // Default response for unknown type
    return NextResponse.json({ 
      error: "Unknown analytics type",
      available_types: ["overview"],
      period 
    })

  } catch (error) {
    console.error("Analytics API error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
