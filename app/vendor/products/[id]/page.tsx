import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Package2, MapPin, Calendar, Tag, DollarSign, Boxes } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { DeleteProductButton } from "./delete-button"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ViewProductPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Fetch the product
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name,
        description
      )
    `)
    .eq("id", params.id)
    .eq("vendor_id", user.id)
    .single()

  if (error || !product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/vendor/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/vendor/products/edit/${product.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Link>
          </Button>
          <DeleteProductButton productId={product.id} productName={product.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 ? (
                <div className="grid gap-4">
                  {/* Main Image */}
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <Image
                      src={(product.images[0]?.url ?? product.images[0]) || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Additional Images */}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.slice(1).map((image: any, index: number) => (
                        <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                          <Image
                            src={(image?.url ?? image) || "/placeholder.svg"}
                            alt={`${product.name} - Image ${index + 2}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No images available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={product.status === "active" ? "default" : "secondary"}>
                  {product.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <span className="text-sm text-muted-foreground">
                  {product.categories?.name || "Uncategorized"}
                </span>
              </div>

              {product.sku && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SKU</span>
                  <span className="text-sm text-muted-foreground font-mono">{product.sku}</span>
                </div>
              )}

              {product.brand && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brand</span>
                  <span className="text-sm text-muted-foreground">{product.brand}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Price</span>
                <p className="text-2xl font-bold">
                  RWF {Math.round(Number(product.price)).toLocaleString('en-US')}
                </p>
              </div>
              
              {product.compare_at_price && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Compare at Price</span>
                  <p className="text-lg line-through text-muted-foreground">
                    RWF {Math.round(Number(product.compare_at_price)).toLocaleString('en-US')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Boxes className="h-4 w-4 mr-2" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Stock Quantity</span>
                <p className="text-xl font-semibold">
                  {product.inventory_quantity || 0} units
                </p>
                {product.inventory_quantity && product.inventory_quantity < 10 && (
                  <p className="text-sm text-orange-600">Low stock warning</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Created</span>
                <p className="text-sm">
                  {new Date(product.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                <p className="text-sm">
                  {new Date(product.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          {product.description ? (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No description provided</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
