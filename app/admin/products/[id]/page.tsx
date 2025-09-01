"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ProductDetail = {
  id: string
  name: string
  description?: string
  price: number
  status: string
  inventory_quantity: number
  vendor: { id: string; name: string; email: string } | null
  images: string[]
  created_at: string
  updated_at: string
}

export default function AdminProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params?.id || "")

  const [data, setData] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`)
        if (!res.ok) throw new Error(`Failed to load product (${res.status})`)
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e.message || "Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF" }).format(amount)

  if (loading) return <div className="p-6">Loading…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data) return <div className="p-6">Not found</div>

  return (
    <div className="p-4 space-y-4">
      <Button variant="outline" onClick={() => router.back()}>Back</Button>
      <Card>
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
          <CardDescription>
            {data.vendor ? (
              <span>Vendor: {data.vendor.name} ({data.vendor.email})</span>
            ) : (
              <span>Vendor: Unknown</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {data.images && data.images.length > 0 ? (
              data.images.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={src}
                    alt={`Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-muted-foreground">No images</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Price</span>
              <span>{formatCurrency(data.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Status</span>
              <Badge variant="secondary">{data.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Stock</span>
              <span>{data.inventory_quantity}</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.description || '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
