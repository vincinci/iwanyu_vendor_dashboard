"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { useCallback, useMemo } from "react"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Memoize formatted notifications to prevent unnecessary re-renders
  const formattedNotifications = useMemo(() => 
    notifications.slice(0, 5).map(notification => ({
      ...notification,
      timeAgo: formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    })),
    [notifications]
  )

  const handleNotificationClick = useCallback((notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }, [markAsRead])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-auto p-1">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
        ) : (
          formattedNotifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start space-y-1 p-3 ${
                !notification.is_read ? "bg-blue-50" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{notification.title}</span>
                <span className="text-xs text-muted-foreground">
                  {notification.timeAgo}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full absolute right-2 top-2" />
              )}
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center">
              <span className="text-sm text-muted-foreground">View all notifications</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
