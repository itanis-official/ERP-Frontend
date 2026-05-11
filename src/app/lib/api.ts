import axios from 'axios'

export const RH_API = import.meta.env.VITE_RH_API || 'http://localhost:5085'
export const CRM_API = import.meta.env.VITE_CRM_API || 'http://localhost:5095'

export const rhApi = axios.create({ baseURL: RH_API })
export const crmApi = axios.create({ baseURL: CRM_API })

const attachAuth = (config: any) => {
  const stored = localStorage.getItem('auth_user')
  if (stored) {
    try {
      const u = JSON.parse(stored)
      if (u?.token) config.headers.Authorization = `Bearer ${u.token}`
    } catch {}
  }
  return config
}

rhApi.interceptors.request.use(attachAuth)
crmApi.interceptors.request.use(attachAuth)
