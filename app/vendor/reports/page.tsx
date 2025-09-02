import { createClient } from "@/utils/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react"

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get analytics data
  const [{ count: totalProducts }, { count: totalOrders }, { data: revenueData }, { data: topProducts }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("vendor_id", user?.id),
      supabase.from("order_items").select("*", { count: "exact", head: true }).eq("vendor_id", user?.id),
      supabase.from("order_items").select("total, created_at").eq("vendor_id", user?.id),
      supabase
        .from("order_items")
        .select(`
        product_id,
        product_name,
        quantity,
        total,
        products(name, price)
      `)
        .eq("vendor_id", user?.id),
    ])

  const totalRevenue = revenueData?.reduce((sum, item) => sum + Number(item.total), 0) || 0
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0

  // Calculate top products by quantity sold
  const productSales = topProducts?.reduce((acc: any, item: any) => {
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

  const topSellingProducts = Object.values(productSales || {})
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Insights into your store performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {Math.round(totalRevenue).toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Orders received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {Math.round(averageOrderValue).toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">In your catalog</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Your best performing products by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSellingProducts.length ? (
                topSellingProducts.map((product: any, index: number) => (
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
                <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Recent sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-xs text-muted-foreground">All time earnings</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">RWF {Math.round(totalRevenue).toLocaleString('en-US')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Average Order Value</p>
                  <p className="text-xs text-muted-foreground">Revenue per order</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">RWF {Math.round(averageOrderValue).toLocaleString('en-US')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Orders</p>
                  <p className="text-xs text-muted-foreground">Orders received</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{totalOrders}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
