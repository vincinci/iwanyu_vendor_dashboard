import { createClient } from "@/lib/supabase/server"
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

        // Get recent orders (with fallback)
        let recentOrders = []
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

        // Calculate revenue (with fallback)
        let totalRevenue = 0
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
        { data: lowStockProducts }
      ] = await Promise.all([
        // Total products
        supabase.from("products").select("*", { count: "exact", head: true }).eq("vendor_id", user.id),
        
        // Active products
        supabase.from("products").select("*", { count: "exact", head: true })
          .eq("vendor_id", user.id).eq("status", "active"),
        
        // Draft products
        supabase.from("products").select("*", { count: "exact", head: true })
          .eq("vendor_id", user.id).eq("status", "draft"),
        
        // Total orders in period
        supabase.from("order_items").select("*", { count: "exact", head: true })
          .eq("vendor_id", user.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        
        // Revenue data
        supabase.from("order_items").select("total, created_at")
          .eq("vendor_id", user.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        
        // Recent orders
        supabase.from("order_items").select(`
          *,
          orders!inner(order_number, status, customer_name, created_at)
        `).eq("vendor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        
        // Top products by sales
        supabase.from("order_items").select(`
          product_id,
          quantity,
          total,
          products!inner(name, price, inventory_quantity)
        `).eq("vendor_id", user.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        
        // Low stock products (less than 10 units)
        supabase.from("products").select("*")
          .eq("vendor_id", user.id)
          .eq("status", "active")
          .lt("inventory_quantity", 10)
          .order("inventory_quantity", { ascending: true })
          .limit(10)
      ])

      // Calculate total revenue
      const totalRevenue = revenueData?.reduce((sum, item) => sum + Number(item.total), 0) || 0

      // Process product sales data
      const productSales = new Map()
      topProducts?.forEach((item: any) => {
        const productId = item.product_id
        const current = productSales.get(productId) || {
          product_name: item.products?.name || "Unknown",
          total_quantity: 0,
          total_revenue: 0,
          current_stock: item.products?.inventory_quantity || 0
        }
        current.total_quantity += item.quantity
        current.total_revenue += Number(item.total)
        productSales.set(productId, current)
      })

      // Generate daily revenue chart data
      const dailyRevenue = new Map()
      revenueData?.forEach((item: any) => {
        const date = new Date(item.created_at).toISOString().split('T')[0]
        dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + Number(item.total))
      })

      const chartData = Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date))

      return NextResponse.json({
        overview: {
          total_products: totalProducts || 0,
          active_products: activeProducts || 0,
          draft_products: draftProducts || 0,
          total_orders: totalOrders || 0,
          total_revenue: totalRevenue,
          low_stock_count: lowStockProducts?.length || 0,
          period: period
        },
        revenue_chart: chartData,
        top_products: Array.from(productSales.values())
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 10),
        recent_orders: recentOrders?.slice(0, 5) || [],
        low_stock_products: lowStockProducts || []
      })
    }

    if (type === "products") {
      // Get detailed product analytics
      const { data: products } = await supabase.from("products")
        .select(`
          *,
          order_items(quantity, total, created_at)
        `)
        .eq("vendor_id", user.id)

      const productAnalytics = products?.map((product: any) => {
        const totalSold = product.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        const totalRevenue = product.order_items?.reduce((sum: number, item: any) => sum + Number(item.total), 0) || 0
        const recentSales = product.order_items
          ?.filter((item: any) => new Date(item.created_at) >= startDate)
          ?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

        return {
          ...product,
          total_sold: totalSold,
          total_revenue: totalRevenue,
          recent_sales: recentSales,
          stock_status: product.inventory_quantity < 10 ? 'low' : 'good'
        }
      }) || []

      return NextResponse.json({
        products: productAnalytics,
        summary: {
          total_products: productAnalytics.length,
          total_revenue: productAnalytics.reduce((sum, p) => sum + p.total_revenue, 0),
          total_sold: productAnalytics.reduce((sum, p) => sum + p.total_sold, 0)
        }
      })
    }

    return new NextResponse("Invalid type parameter", { status: 400 })
  } catch (error) {
    console.error("Error in GET /api/vendor/analytics:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
