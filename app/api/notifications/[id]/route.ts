import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { is_read } = body

    const { data: notification, error } = await supabase
      .from("notifications")
      .update({ is_read })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating notification:", error)
      return new NextResponse("Failed to update notification", { status: 500 })
    }

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error in PATCH /api/notifications/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

// Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting notification:", error)
      return new NextResponse("Failed to delete notification", { status: 500 })
    }

    return new NextResponse("Notification deleted successfully", { status: 200 })
  } catch (error) {
    console.error("Error in DELETE /api/notifications/[id]:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
