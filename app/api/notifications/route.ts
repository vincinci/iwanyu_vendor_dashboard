import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread_only") === "true"
    
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return new NextResponse("Failed to fetch notifications", { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return NextResponse.json({
      notifications,
      unread_count: unreadCount || 0,
    })
  } catch (error) {
    console.error("Error in GET /api/notifications:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is admin (only admins can create notifications for other users)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { user_id, title, message, type, priority, metadata, action_url } = body

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type: type || "info",
        priority: priority || "normal",
        metadata: metadata || {},
        action_url,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return new NextResponse("Failed to create notification", { status: 500 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error in POST /api/notifications:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
