import api from "./api"

export interface Notification {
  id: number
  message: string
  type: string
  dateEnvoi: string
  lu: boolean
  employeId: number
}


export const getNotifications = async (employeId: number) => {
  const response = await api.get(`/Notifications/${employeId}`)
  return response.data
}

export const markNotificationAsRead = async (id: number) => {
  const response = await api.put(`/Notifications/read/${id}`)
  return response.data
}