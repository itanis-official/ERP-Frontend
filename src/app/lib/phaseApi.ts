import { crmApi } from './api'

export interface Phase {
  id?: number
  opportunityId: number
  type: string
  status: string
  notes?: string | null
  meetingDate?: string | null
  meetingTime?: string | null
  agentEtudeId?: number | null
  dueDate?: string | null
  progress: number
  validated: boolean
  montant?: number | null
  dateEnvoi?: string | null
  dateValidite?: string | null
  feedbackClient?: string | null
  reference?: string | null
  dateSignature?: string | null
  signed: boolean
  documentPath?: string | null
  createdAt?: string
  updatedAt?: string
}

export const phaseApi = {
  getByOpportunity: async (opportunityId: number): Promise<Phase[]> => {
    const response = await crmApi.get(`/api/phases/by-opportunity/${opportunityId}`)
    return response.data
  },

  create: async (data: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>): Promise<Phase> => {
    const response = await crmApi.post('/api/phases', data)
    return response.data
  },

  update: async (id: number, data: Partial<Phase>): Promise<Phase> => {
    const response = await crmApi.put(`/api/phases/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await crmApi.delete(`/api/phases/${id}`)
  },

  initForOpportunity: async (opportunityId: number): Promise<Phase[]> => {
    const response = await crmApi.post(`/api/phases/InitForOpportunity/${opportunityId}`)
    return response.data
  },

  complete: async (id: number): Promise<Phase> => {
    const response = await crmApi.put(`/api/phases/${id}/complete`)
    return response.data
  },

  changeStatus: async (id: number, status: string): Promise<Phase> => {
    const response = await crmApi.put(`/api/phases/${id}/change-status?status=${status}`)
    return response.data
  },

  getAll: async (): Promise<Phase[]> => {
    const response = await crmApi.get('/api/phases')
    return response.data
  },
}
