import { crmApi } from './api'

export interface Company {
  id?: number
  raisonSociale: string
  matriculeFiscalCountry: string
  matriculeFiscal: string
  secteur: string
  logo?: string | null
  devis: string
  adresse?: string | null
  codePostal?: string | null
  ville?: string | null
  pays?: string | null
  emailPrincipal?: string | null
  emailSecondaire?: string | null
  telephonePrincipalCountry?: string | null
  telephonePrincipal?: string | null
  telephoneSecondaireCountry?: string | null
  telephoneSecondaire?: string | null
  agentResponsableId?: number | null
  equipeResponsableId?: number | null
  affectationType?: 'global' | 'agent' | 'equipe'
  statut?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  contacts?: any[]
}

export const companyApi = {
  getAll: async (): Promise<Company[]> => {
    const response = await crmApi.get('/api/Companies')
    return response.data
  },

  getById: async (id: number): Promise<Company> => {
    const response = await crmApi.get(`/api/Companies/${id}`)
    return response.data
  },

  create: async (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> => {
    const response = await crmApi.post('/api/Companies', data)
    return response.data
  },

  update: async (id: number, data: Partial<Company>): Promise<Company> => {
    const response = await crmApi.put(`/api/Companies/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await crmApi.delete(`/api/Companies/${id}`)
  },
}
