import { createClient } from "@/utils/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Users, ShoppingCart } from "lucide-react"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  // Get comprehensive analytics data
  const [
    { count: totalVendors },
    { count: activeVendors },
    { count: totalProducts },
    { count: totalOrders },
    { data: revenueData },
    { data: topVendorsByRevenue },
    { data: topProductsByOrders },
    { data: monthlyGrowth },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vendor"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vendor").eq("status", "active"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount, created_at"),
    supabase
      .from("order_items")
      .select(`
        vendor_id,
        total,
        profiles!vendor_id(full_name, email)
      `)
      .limit(10),
    supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        quantity,
        total
      `)
      .limit(10),
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const monthlyRevenue = monthlyGrowth?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0

  // Calculate vendor revenue rankings
  const vendorRevenue = topVendorsByRevenue?.reduce((acc: any, item: any) => {
    const vendorId = item.vendor_id
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: item.profiles,
        revenue: 0,
        orders: 0,
      }
    }
    acc[vendorId].revenue += Number(item.total)
    acc[vendorId].orders += 1
    return acc
  }, {})

  const topVendors = Object.values(vendorRevenue || {})
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5)

  // Calculate product performance
  const productPerformance = topProductsByOrders?.reduce((acc: any, item: any) => {
    const productId = item.product_id
    if (!acc[productId]) {
      acc[productId] = {
        name: item.product_name,
        quantity: 0,
        revenue: 0,
      }
    }
    acc[productId].quantity += item.quantity
    acc[productId].revenue += Number(item.total)
    return acc
  }, {})

  const topProducts = Object.values(productPerformance || {})
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5)

  const platformStats = [
    {
      title: "Total Revenue",
      value: `RWF ${Math.round(totalRevenue).toLocaleString('en-US')}`,
      icon: DollarSign,
      description: "All time platform revenue",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Monthly Revenue",
      value: `RWF ${Math.round(monthlyRevenue).toLocaleString('en-US')}`,
      icon: TrendingUp,
      description: "Last 30 days",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Vendors",
      value: `${activeVendors}/${totalVendors}`,
      icon: Users,
      description: "Vendor activation rate",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Avg Order Value",
      value: `RWF ${Math.round(averageOrderValue).toLocaleString('en-US')}`,
      icon: ShoppingCart,
      description: "Per order average",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground">Comprehensive platform performance insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Vendors by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
            <CardDescription>Vendors ranked by revenue generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVendors.length ? (
                topVendors.map((vendor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{vendor.vendor?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.vendor?.email}</p>
                      <p className="text-xs text-muted-foreground">{vendor.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">RWF {Math.round(vendor.revenue).toLocaleString('en-US')}</p>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No vendor data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
            <CardDescription>Products ranked by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length ? (
                topProducts.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Sold: {product.quantity} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">RWF {Math.round(product.revenue).toLocaleString('en-US')}</p>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No product data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health Metrics</CardTitle>
          <CardDescription>Key performance indicators and growth metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Vendor Approval Rate</p>
                <p className="text-xs text-muted-foreground">Approved vs total applications</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {(totalVendors && totalVendors > 0 && activeVendors) ? Math.round((activeVendors / totalVendors) * 100) : 0}%
                </p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {(activeVendors && totalVendors && (activeVendors / totalVendors) > 0.8) ? "Excellent" : "Good"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Order Fulfillment Rate</p>
                <p className="text-xs text-muted-foreground">Successfully delivered orders</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{totalOrders}</p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Orders
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Platform Growth</p>
                <p className="text-xs text-muted-foreground">Total products available</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{totalProducts}</p>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Products
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
