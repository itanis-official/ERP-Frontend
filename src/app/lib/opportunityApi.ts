import { crmApi } from './api'

export interface Agent {
  id: string;
  name: string;
  avatar: string;
}

export interface PhaseDetail {
  status: "prospection" | "qualification" | "negociation" | "gagnee" | "perdue" | "completed" | "pending" | "in_progress" | "not_sent" | "sent" | "accepted" | "negotiated" | "refused";
  notes: string;
  dueDate: string;
  progress?: number;
  validated?: boolean;
  hasDate?: boolean;
  date?: string;
  time?: string;
  study?: any; // Further refine if needed
  offer?: any; // Further refine if needed
  costs?: any;
  amount?: string;
  sentDate?: string;
  validUntil?: string;
  feedback?: string;
  contract?: any; // Further refine if needed
  signed?: boolean;
  reference?: string;
  signDate?: string;
}

export interface Opportunity {
  id?: number;
  titre: string;
  description?: string | null;
  valeurEstimee: number;
  probabilite: number;
  pipelineStage: string;
  dateCloturePrevu?: string | null;
  dateCloture?: string | null;
  type?: string;
  subType?: string;
  typeProjet?: string;
  agentCommercialId?: number | null;
  agentCdcId?: number | null;
  echeanceCdc?: string | null;
  cdcFilePath?: string | null;
  raisonPerte?: string | null;
  notes?: string | null;
  companyId: number;
  projectParentId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  company?: {
    id: number;
    raisonSociale: string;
  };
  companyLogo?: string;
  agent?: Agent; // Using the new Agent interface
  sector?: string;
  lastUpdate?: string;
  phases?: Record<string, PhaseDetail>; // Using a Record for phase details
}

export const opportunityApi = {
  getAll: async (): Promise<Opportunity[]> => {
    const response = await crmApi.get('/api/opportunities')
    return response.data
  },

  getById: async (id: number): Promise<Opportunity> => {
    const response = await crmApi.get(`/api/opportunities/${id}`)
    return response.data
  },

  getByCompany: async (companyId: number): Promise<Opportunity[]> => {
    const response = await crmApi.get(`/api/opportunities/ByCompany/${companyId}`)
    return response.data
  },

  create: async (data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Opportunity> => {
    const response = await crmApi.post('/api/opportunities', data)
    return response.data
  },

  update: async (id: number, data: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await crmApi.put(`/api/opportunities/${id}`, data)
    return response.data
  },

  changeStage: async (id: number, stage: string, raisonPerte?: string): Promise<Opportunity> => {
    const response = await crmApi.put(`/api/opportunities/${id}/change-stage?stage=${stage}${raisonPerte ? `&raisonPerte=${raisonPerte}` : ''}`)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await crmApi.delete(`/api/opportunities/${id}`)
  },
}
