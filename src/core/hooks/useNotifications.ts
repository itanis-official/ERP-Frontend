import { useEffect, useState, useCallback } from 'react'
import { getNotifications, markNotificationAsRead } from '../services/notificationService'
import type { Notification } from '../services/notificationService'

export function useNotifications(employeId: number) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!employeId) return
    try {
      setLoading(true)
      const data = await getNotifications(employeId)
      setNotifications(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [employeId])

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.lu) await markNotificationAsRead(n.id)
    }
    await fetchNotifications()
  }

  useEffect(() => {
    if (employeId) {
      fetchNotifications()
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') fetchNotifications()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [employeId, fetchNotifications])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && employeId) fetchNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [employeId, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.lu).length

  return { notifications, unreadCount, loading, refresh: fetchNotifications, markAsRead, markAllAsRead }
}
