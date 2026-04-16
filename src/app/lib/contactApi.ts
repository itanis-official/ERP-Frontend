import { crmApi } from './api'

export interface Contact {
  id?: number
  companyId: number
  nom: string
  prenom: string
  poste?: string | null
  email: string
  telephone?: string | null
  telephoneCountry?: string
  login: string
  passwordHash?: string
  sendEmail?: boolean
  forcePasswordChange?: boolean
  isActive?: boolean
  lastLogin?: string | null
  createdAt?: string
  updatedAt?: string
  company?: {
    id: number
    raisonSociale: string
  }
}

export const contactApi = {
  getAll: async (): Promise<Contact[]> => {
    const response = await crmApi.get('/api/contacts')
    return response.data
  },

  getById: async (id: number): Promise<Contact> => {
    const response = await crmApi.get(`/api/contacts/${id}`)
    return response.data
  },

  getByCompany: async (companyId: number): Promise<Contact[]> => {
    const response = await crmApi.get(`/api/contacts/ByCompany/${companyId}`)
    return response.data
  },

  create: async (data: Partial<Contact>): Promise<Contact> => {
    const response = await crmApi.post('/api/contacts', data)
    return response.data
  },

  update: async (id: number, data: Partial<Contact>): Promise<Contact> => {
    const response = await crmApi.put(`/api/contacts/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await crmApi.delete(`/api/contacts/${id}`)
  },
}
