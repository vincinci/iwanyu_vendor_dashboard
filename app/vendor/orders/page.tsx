import { createClient } from "@/utils/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Package, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      *,
      orders!inner(
        id,
        order_number,
        customer_name,
        customer_email,
        status,
        payment_status,
        total_amount,
        created_at
      ),
      products(name, images)
    `)
    .eq("vendor_id", user?.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage your customer orders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Track and manage all your orders</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search orders..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orderItems?.length ? (
            <div className="space-y-4">
              {orderItems.map((item: any) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        {item.products?.images?.[0] ? (
                          <img
                            src={item.products.images[0] || "/placeholder.svg"}
                            alt={item.products.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">#{item.orders.order_number}</h3>
                        <p className="text-sm text-muted-foreground">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Customer: {item.orders.customer_name || item.orders.customer_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.orders.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(item.orders.status)}>{item.orders.status}</Badge>
                        <Badge variant={item.orders.payment_status === "paid" ? "default" : "secondary"}>
                          {item.orders.payment_status}
                        </Badge>
                      </div>
                      <p className="text-sm">Qty: {item.quantity}</p>
                      <p className="text-lg font-semibold">RWF {Math.round(Number(item.total)).toLocaleString('en-US')}</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/vendor/orders/${item.orders.id}`}>
                          <Eye className="mr-2 h-3 w-3" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">Orders will appear here when customers purchase your products.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
