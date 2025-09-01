import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        products(name, images),
        profiles(full_name, email)
      )
    `)
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
          <h1 className="text-3xl font-bold text-foreground">All Orders</h1>
          <p className="text-muted-foreground">Platform-wide order management</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>All orders across the platform</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search orders..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders?.length ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">#{order.order_number}</h3>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                          {order.payment_status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.customer_name || order.customer_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Items: {order.order_items?.length || 0} • Total: ${Number(order.total_amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ordered: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.order_items?.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="flex items-center space-x-2 text-xs bg-muted px-2 py-1 rounded">
                            <span>{item.products?.name}</span>
                            <span className="text-muted-foreground">x{item.quantity}</span>
                            <span className="text-muted-foreground">
                              by {item.profiles?.full_name || item.profiles?.email}
                            </span>
                          </div>
                        ))}
                        {order.order_items?.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{order.order_items.length - 3} more items
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-lg font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
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
              <p className="text-muted-foreground">Orders will appear here when customers make purchases.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
