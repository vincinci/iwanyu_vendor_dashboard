import { Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Search, Filter, Eye, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AdminProductsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">All Products</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-8" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsList />
      </Suspense>
    </div>
  )
}

async function ProductsList() {
  // In a real app, this would fetch from your database
  // For now, showing placeholder content
  const products = [
    {
      id: 1,
      name: "Premium Coffee Beans",
      vendor: "Mountain Coffee Co.",
      category: "Food & Beverages",
      price: 2500,
      stock: 150,
      status: "active",
      image: "/placeholder.jpg"
    },
    {
      id: 2,
      name: "Handwoven Basket",
      vendor: "Artisan Crafts",
      category: "Home & Garden",
      price: 8000,
      stock: 25,
      status: "active",
      image: "/placeholder.jpg"
    },
    {
      id: 3,
      name: "Organic Honey",
      vendor: "Nature's Best",
      category: "Food & Beverages",
      price: 3500,
      stock: 0,
      status: "out_of_stock",
      image: "/placeholder.jpg"
    }
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                <Badge variant={product.status === "active" ? "default" : "destructive"}>
                  {product.status === "active" ? "Active" : "Out of Stock"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Vendor: {product.vendor}</p>
                <p>Category: {product.category}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold">RWF {Math.round(product.price).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Stock: {product.stock} units</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${product.id}`}>
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              There are no products in the system yet.
            </p>
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
