import api from '../api/api'

export interface Notification {
  id: number
  message: string
  type: string
  dateEnvoi: string
  lu: boolean
  employeId: number
}

export const getNotifications = async (employeId: number): Promise<Notification[]> => {
  const response = await api.get(`/Notifications/${employeId}`)
  return response.data
}

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await api.put(`/Notifications/read/${id}`)
}
