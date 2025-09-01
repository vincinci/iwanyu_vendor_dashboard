import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

type ImageItem = string | { url?: string; path?: string }

function derivePathFromUrl(url: string): string {
  try {
    // Try to extract after /object/public/
    const marker = "/object/public/"
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      const rest = url.substring(idx + marker.length)
      // rest e.g. "products/filename.png"
      return decodeURIComponent(rest)
    }
    // Fallback: return as-is
    return url
  } catch {
    return url
  }
}

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fetch this vendor's products
    const { data: products, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, images")
      .eq("vendor_id", user.id)
      .limit(1000)

    if (fetchError) {
      return NextResponse.json({ error: `Fetch failed: ${fetchError.message}` }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ updated: 0, message: "No products found for this vendor" })
    }

    let updated = 0
    for (const p of products) {
      const images = (p.images ?? []) as ImageItem[]

      if (!Array.isArray(images) || images.length === 0) continue

      // Determine if normalization is needed
      const needsNormalization = images.some((it) => typeof it === "string" || (typeof it === "object" && it && !(it as any).path && (it as any).url))
      if (!needsNormalization) continue

      const normalized = images.map((it) => {
        if (typeof it === "string") {
          const url = it
          return { url, path: derivePathFromUrl(url) }
        }
        const url = it.url ?? ""
        const path = it.path ?? (url ? derivePathFromUrl(url) : "")
        return { url, path }
      })

      const { error: updateError } = await supabaseAdmin
        .from("products")
        .update({ images: normalized })
        .eq("id", p.id)

      if (!updateError) updated += 1
    }

    return NextResponse.json({ updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
