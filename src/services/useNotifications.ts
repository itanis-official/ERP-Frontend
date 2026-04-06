import { useEffect, useState } from "react"
import { getNotifications, markNotificationAsRead } from "./notificationService"
import type { Notification } from "./notificationService"
export function useNotifications(employeId: number) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications(employeId)
      setNotifications(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.lu) {
        await markNotificationAsRead(n.id)
      }
    }
    fetchNotifications()
  }

  useEffect(() => {
    if (employeId) fetchNotifications()
  }, [employeId])

  const unreadCount = notifications.filter(n => !n.lu).length

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}