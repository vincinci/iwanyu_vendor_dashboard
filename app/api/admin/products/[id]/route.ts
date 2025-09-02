import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/utils/supabase-server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Ensure the caller is an admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const id = params.id

    // Fetch product
    const { data: product, error: productError } = await serviceSupabase
      .from("products")
      .select("id,name,description,price,images,status,inventory_quantity,vendor_id,created_at,updated_at")
      .eq("id", id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: productError?.message || "Not found" }, { status: 404 })
    }

    // Normalize images to array of string URLs
    let imageUrls: string[] = []
    if (Array.isArray(product.images)) {
      imageUrls = product.images.map((img: any) => {
        if (typeof img === "string") return img
        if (img?.url) return img.url
        if (img?.path) {
          const base = process.env.NEXT_PUBLIC_SUPABASE_URL
          if (base) return `${base}/storage/v1/object/public/products/${img.path}`
        }
        return ""
      }).filter(Boolean)
    }

    // Fetch vendor profile for display
    const { data: vendor } = await serviceSupabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", product.vendor_id)
      .single()

    const payload = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price) || 0,
      status: product.status,
      inventory_quantity: product.inventory_quantity || 0,
      vendor: vendor ? { id: vendor.id, name: vendor.full_name || vendor.email, email: vendor.email } : null,
      images: imageUrls,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("GET /api/admin/products/[id] error", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
