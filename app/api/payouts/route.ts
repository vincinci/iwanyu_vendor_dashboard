import { createClient as createServerClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// Get payouts or create payout request
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // pending, processing, completed, failed
    const limit = parseInt(searchParams.get("limit") || "20")
    
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

    let query = supabase.from("vendor_payouts").select("*")

    // Vendors can only see their own payouts
    if (profile?.role === "vendor") {
      query = query.eq("vendor_id", user.id)
    } else if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: payouts, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching payouts:", error)
      return new NextResponse("Failed to fetch payouts", { status: 500 })
    }

    // If vendor, also get their current balance
    if (profile?.role === "vendor") {
      // Calculate available balance from unpaid order items
      const { data: unpaidItems } = await supabase
        .from("order_items")
        .select("total")
        .eq("vendor_id", user.id)
        .not("id", "in", `(
          SELECT UNNEST(order_items_included::uuid[]) 
          FROM vendor_payouts 
          WHERE vendor_id = '${user.id}' 
          AND status IN ('completed', 'processing')
        )`)

      const availableBalance = unpaidItems?.reduce((sum, item) => sum + Number(item.total), 0) || 0

      return NextResponse.json({
        payouts,
        available_balance: availableBalance,
        currency: "USD" // TODO: Make this configurable
      })
    }

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error("Error in GET /api/payouts:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Create payout request (vendors only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is vendor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "vendor") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { amount, payout_method } = body

    if (!amount || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 })
    }

    // Get unpaid order items for this vendor
    const { data: unpaidItems } = await supabase
      .from("order_items")
      .select("id, total, created_at")
      .eq("vendor_id", user.id)
      .not("id", "in", `(
        SELECT UNNEST(order_items_included::uuid[]) 
        FROM vendor_payouts 
        WHERE vendor_id = '${user.id}' 
        AND status IN ('completed', 'processing')
      )`)

    if (!unpaidItems?.length) {
      return new NextResponse("No unpaid items available", { status: 400 })
    }

    const availableBalance = unpaidItems.reduce((sum, item) => sum + Number(item.total), 0)

    if (amount > availableBalance) {
      return new NextResponse("Insufficient balance", { status: 400 })
    }

    // Select order items to include in payout (up to requested amount)
    let remainingAmount = amount
    const includedItems: string[] = []
    
    for (const item of unpaidItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) {
      if (remainingAmount <= 0) break
      
      includedItems.push(item.id)
      remainingAmount -= Number(item.total)
    }

    // Calculate date range for the payout
    const oldestItem = unpaidItems.find(item => includedItems.includes(item.id))
    const newestItem = unpaidItems.filter(item => includedItems.includes(item.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    const { data: payout, error } = await supabase
      .from("vendor_payouts")
      .insert({
        vendor_id: user.id,
        amount,
        status: "pending",
        payout_method: payout_method || "bank_transfer",
        period_start: oldestItem?.created_at,
        period_end: newestItem?.created_at,
        order_items_included: includedItems,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating payout:", error)
      return new NextResponse("Failed to create payout request", { status: 500 })
    }

    // Create notification for admin
    try {
      await supabase.rpc('create_notification', {
        p_user_id: user.id, // This will be changed to admin ID in a real system
        p_title: 'New Payout Request',
        p_message: `Vendor has requested a payout of $${amount}`,
        p_type: 'payout',
        p_priority: 'normal',
        p_metadata: { payout_id: payout.id, amount, vendor_id: user.id },
        p_action_url: `/admin/payouts/${payout.id}`
      })
    } catch (notificationError) {
      // Ignore notification errors for now
      console.log("Could not create notification - table may not exist yet")
    }

    return NextResponse.json(payout)
  } catch (error) {
    console.error("Error in POST /api/payouts:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
