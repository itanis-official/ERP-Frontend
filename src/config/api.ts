import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const createApiClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  })

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // (Optionnel) Vous pouvez aussi ajouter un intercepteur de réponse ici 
  // pour gérer les erreurs 401 (token expiré) globalement
  // instance.interceptors.response.use(...)

  return instance
}

export const crmApi       = createApiClient('/api/crm')
export const rhApi        = createApiClient('/api/rh')
export const biApi        = createApiClient('/api/bi')
export const projetApi    = createApiClient('/api/projet')
export const helpdeskApi  = createApiClient('/api/helpdesk')
export const timesheetApi = createApiClient('/api/timesheet')