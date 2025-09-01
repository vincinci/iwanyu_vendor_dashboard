"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payout' | 'product' | 'message'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_read: boolean
  metadata?: any
  action_url?: string
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload: any) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload: any) => {
          const updatedNotification = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          )
          // Recalculate unread count
          setUnreadCount((prev) => {
            const oldNotification = payload.old as Notification
            if (oldNotification.is_read !== updatedNotification.is_read) {
              return updatedNotification.is_read ? prev - 1 : prev + 1
            }
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Use the new API endpoint
      const response = await fetch('/api/notifications?limit=50')
      if (!response.ok) {
        if (response.status === 404) {
          // API endpoint doesn't exist yet
          console.log("Notifications API not yet available")
          setNotifications([])
          setUnreadCount(0)
          return
        }
        throw new Error('Failed to fetch notifications')
      }

      const { notifications: data, unread_count } = await response.json()
      setNotifications(data || [])
      setUnreadCount(unread_count || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // Set empty state on any error to prevent UI issues
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      })

      if (!response.ok) throw new Error('Failed to mark notification as read')

      setNotifications((prev) => 
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })

      if (!response.ok) throw new Error('Failed to mark all notifications as read')

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete notification')

      const notification = notifications.find(n => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'> & { user_id: string }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })

      if (!response.ok) throw new Error('Failed to create notification')

      const newNotification = await response.json()
      return newNotification
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications: fetchNotifications,
  }
}
