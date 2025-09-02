import { createClient as createServerClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

interface Params {
  id: string
}

// Get specific payout details
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    let query = supabase.from("vendor_payouts").select("*").eq("id", id)

    // Vendors can only see their own payouts
    if (profile?.role === "vendor") {
      query = query.eq("vendor_id", user.id)
    } else if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { data: payout, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse("Payout not found", { status: 404 })
      }
      console.error("Error fetching payout:", error)
      return new NextResponse("Failed to fetch payout", { status: 500 })
    }

    // Get order items included in this payout
    if (payout.order_items_included?.length) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, product_name, quantity, unit_price, total, created_at")
        .in("id", payout.order_items_included)

      return NextResponse.json({
        ...payout,
        order_items: orderItems || []
      })
    }

    return NextResponse.json(payout)
  } catch (error) {
    console.error("Error in GET /api/payouts/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Update payout status (admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only admins can update payout status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { status, admin_notes, payment_reference } = body

    const validStatuses = ["pending", "processing", "completed", "failed"]
    if (!validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const updateData: {
      status: string
      admin_notes?: string
      payment_reference?: string
      processed_at?: string
    } = { status }

    if (admin_notes) updateData.admin_notes = admin_notes
    if (payment_reference) updateData.payment_reference = payment_reference

    // Set processed_at when status changes to completed or failed
    if (status === "completed" || status === "failed") {
      updateData.processed_at = new Date().toISOString()
    }

    const { data: payout, error } = await supabase
      .from("vendor_payouts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating payout:", error)
      return new NextResponse("Failed to update payout", { status: 500 })
    }

    // Create notification for vendor
    try {
      await supabase.rpc('create_notification', {
        p_user_id: payout.vendor_id,
        p_title: 'Payout Status Updated',
        p_message: `Your payout request has been ${status}`,
        p_type: 'payout',
        p_priority: status === 'failed' ? 'high' : 'normal',
        p_metadata: { payout_id: id, status, amount: payout.amount },
        p_action_url: `/vendor/payouts/${id}`
      })
    } catch (notificationError) {
      // Ignore notification errors for now
      console.log("Could not create notification - table may not exist yet")
    }

    return NextResponse.json(payout)
  } catch (error) {
    console.error("Error in PATCH /api/payouts/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Cancel payout request (vendor only, if still pending)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is vendor and owns this payout
    const { data: payout } = await supabase
      .from("vendor_payouts")
      .select("vendor_id, status")
      .eq("id", id)
      .eq("vendor_id", user.id)
      .single()

    if (!payout) {
      return new NextResponse("Payout not found or unauthorized", { status: 404 })
    }

    if (payout.status !== "pending") {
      return new NextResponse("Cannot cancel payout that is already being processed", { status: 400 })
    }

    const { error } = await supabase
      .from("vendor_payouts")
      .delete()
      .eq("id", id)
      .eq("vendor_id", user.id)

    if (error) {
      console.error("Error canceling payout:", error)
      return new NextResponse("Failed to cancel payout", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error in DELETE /api/payouts/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
