import { createClient } from "@/utils/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductCardActions } from "@/components/vendor/product-card-actions"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/vendor/products/normalize">Normalize Images</Link>
          </Button>
          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>All your products in one place</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search products..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products?.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product: any) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                        <div>
              <p className="text-lg font-bold">RWF {Math.round(Number(product.price)).toLocaleString('en-US')}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.inventory_quantity}</p>
                        </div>
                        <ProductCardActions productId={product.id} productName={product.name} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first product to your store.</p>
              <Button asChild>
                <Link href="/vendor/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
