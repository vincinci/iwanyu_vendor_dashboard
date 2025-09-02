import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"
    
    const analyticsData = {
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
      revenue_trend: []
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
          revenue_trend: []
        }
      },
      { status: 200 }
    )
  }
}
