import { createClient as createServerClient } from "@/utils/supabase-server"
import { NextRequest, NextResponse } from "next/server"

// Mark all notifications as read
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

    const body = await request.json()
    const { action, notification_ids } = body

    if (action === "mark_all_read") {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return new NextResponse("Failed to mark notifications as read", { status: 500 })
      }

      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (action === "mark_selected_read" && notification_ids) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .in("id", notification_ids)

      if (error) {
        console.error("Error marking selected notifications as read:", error)
        return new NextResponse("Failed to mark notifications as read", { status: 500 })
      }

      return NextResponse.json({ message: "Selected notifications marked as read" })
    }

    if (action === "delete_selected" && notification_ids) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .in("id", notification_ids)

      if (error) {
        console.error("Error deleting selected notifications:", error)
        return new NextResponse("Failed to delete notifications", { status: 500 })
      }

      return NextResponse.json({ message: "Selected notifications deleted" })
    }

    return new NextResponse("Invalid action", { status: 400 })
  } catch (error) {
    console.error("Error in POST /api/notifications/bulk:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
