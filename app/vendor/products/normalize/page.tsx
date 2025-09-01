"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function NormalizeImagesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/normalize-images", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      setResult(`Updated ${json.updated} products`)
    } catch (e: any) {
      setResult(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-run on mount
  useEffect(() => {
    run()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Normalize Images</h1>
          <p className="text-muted-foreground">Convert legacy image arrays to the new {"{url, path}"} format</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/vendor/products">Back</Link>
        </Button>
      </div>

  <Card>
        <CardHeader>
          <CardTitle>Run Normalizer</CardTitle>
          <CardDescription>Safe, vendor-scoped update using your session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={run} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Running..." : "Normalize Now"}
          </Button>
          {result && <p className="text-sm text-muted-foreground">{result}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

// Kick off normalization automatically when the page loads
// This is placed after the component definition to avoid React rules issues
// but achieves the same effect with a simple hook inside the component.

