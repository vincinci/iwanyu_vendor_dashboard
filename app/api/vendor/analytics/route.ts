import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is vendor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "vendor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Calculate date range based on period
    const now = new Date()
    const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))

    // Get vendor's total products
    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", user.id)

    // Get vendor's orders through order_items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        *,
        orders!inner(
          id,
          status,
          created_at,
          customer_id,
          total_amount,
          order_number
        )
      `)
      .eq("vendor_id", user.id)
      .gte("orders.created_at", startDate.toISOString())

    // Calculate metrics
    const totalOrders = orderItems?.length || 0
    const totalRevenue = orderItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get recent orders (last 10)
    const recentOrdersData = orderItems
      ?.sort((a, b) => new Date(b.orders.created_at).getTime() - new Date(a.orders.created_at).getTime())
      ?.slice(0, 10)
      ?.map(item => ({
        id: item.orders.id,
        order_number: item.orders.order_number,
        customer_name: `Customer ${item.orders.customer_id?.substring(0, 8)}`,
        total: item.total_price,
        status: item.orders.status,
        created_at: item.orders.created_at,
        items_count: 1
      })) || []

    // Get top products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, inventory_quantity, price")
      .eq("vendor_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5)

    const topProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      stock_quantity: product.inventory_quantity || 0,
      total_sales: 0, // Would need order data to calculate
      revenue: product.price || 0,
      views: 0 // Would need analytics tracking
    })) || []

    // Get low stock products
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("id, name, inventory_quantity, sku")
      .eq("vendor_id", user.id)
      .eq("status", "active")
      .lt("inventory_quantity", 10)
      .order("inventory_quantity", { ascending: true })
      .limit(10)

    const analyticsData = {
      overview: {
        total_revenue: totalRevenue,
        revenue_change: 0, // Would need historical data to calculate
        total_orders: totalOrders,
        orders_change: 0, // Would need historical data to calculate
        total_products: totalProducts || 0,
        products_change: 0, // Would need historical data to calculate
        avg_order_value: avgOrderValue,
        aov_change: 0 // Would need historical data to calculate
      },
      products: topProducts,
      recent_orders: recentOrdersData,
      low_stock_products: lowStockProducts || [],
      revenue_trend: [] // Would need daily/weekly revenue data
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      period
    })

  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch analytics data",
        data: {
          overview: {
            total_revenue: 0,
            revenue_change: 0,
            total_orders: 0,
            orders_change: 0,
            total_products: 0,
            products_change: 0,
            avg_order_value: 0,
            aov_change: 0
          },
          products: [],
          recent_orders: [],
          low_stock_products: [],
          revenue_trend: []
        }
      },
      { status: 200 }
    )
  }
}
