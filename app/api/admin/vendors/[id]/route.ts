import { createClient as createServerClient } from "@/utils/supabase-server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication and admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action } = await request.json()
    const vendorId = params.id

    // Use service client to update vendor status
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    let updateData: any = {}
    
    switch (action) {
      case "approve":
        updateData = { status: "active" }
        break
      case "reject":
        updateData = { status: "rejected" }
        break
      case "suspend":
        updateData = { status: "suspended" }
        break
      case "activate":
        updateData = { status: "active" }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { data, error } = await serviceSupabase
      .from("profiles")
      .update(updateData)
      .eq("id", vendorId)
      .eq("role", "vendor")
      .select()
      .single()

    if (error) {
      console.error("Error updating vendor:", error)
      return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      vendor: data,
      message: `Vendor ${action}d successfully`
    })

  } catch (error) {
    console.error("Error updating vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication and admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const vendorId = params.id

    // Use service client to delete vendor and related data
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    // First, delete vendor's products (cascade should handle order_items)
    const { error: productsError } = await serviceSupabase
      .from("products")
      .delete()
      .eq("vendor_id", vendorId)

    if (productsError) {
      console.error("Error deleting vendor products:", productsError)
      return NextResponse.json({ error: "Failed to delete vendor products" }, { status: 500 })
    }

    // Delete vendor profile
    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .delete()
      .eq("id", vendorId)
      .eq("role", "vendor")

    if (profileError) {
      console.error("Error deleting vendor profile:", profileError)
      return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Vendor deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
