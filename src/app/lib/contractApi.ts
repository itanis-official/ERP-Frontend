import { crmApi, CRM_API } from './api'

export interface Contract {
  id?: number
  companyId: number
  projectId?: number | null
  reference: string
  version: number
  dateStart?: string | null
  dateEnd?: string | null
  amount: number
  status: string
  uploadedById?: number | null
  uploadDate?: string | null
  notes?: string | null
  filePath?: string | null
  createdAt?: string
  updatedAt?: string
  company?: {
    id: number
    raisonSociale: string
  }
}

export const contractApi = {
  getAll: async (): Promise<Contract[]> => {
    const response = await crmApi.get('/api/contracts')
    return response.data
  },

  getById: async (id: number): Promise<Contract> => {
    const response = await crmApi.get(`/api/contracts/${id}`)
    return response.data
  },

  getByCompany: async (companyId: number): Promise<Contract[]> => {
    const response = await crmApi.get(`/api/contracts/ByCompany/${companyId}`)
    return response.data
  },

  create: async (data: {
    companyId: number
    projectId?: number | null
    reference: string
    version: number
    dateStart?: string | null
    dateEnd?: string | null
    amount: number
    status: string
    notes?: string | null
    file?: File | null
  }): Promise<Contract> => {
    const formData = new FormData()
    formData.append('companyId', String(data.companyId))
    if (data.projectId) formData.append('projectId', String(data.projectId))
    formData.append('reference', data.reference)
    formData.append('version', String(data.version))
    if (data.dateStart) formData.append('dateStart', data.dateStart)
    if (data.dateEnd) formData.append('dateEnd', data.dateEnd)
    formData.append('amount', String(data.amount))
    formData.append('status', data.status || 'draft')
    if (data.notes) formData.append('notes', data.notes)
    if (data.file) formData.append('file', data.file)

    const response = await crmApi.post('/api/contracts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  update: async (id: number, data: Partial<Contract>): Promise<Contract> => {
    const response = await crmApi.put(`/api/contracts/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await crmApi.delete(`/api/contracts/${id}`)
  },

  getDownloadUrl: (id: number) => `${CRM_API}/api/contracts/download/${id}`,
}
