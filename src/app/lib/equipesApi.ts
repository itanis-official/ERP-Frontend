import { rhApi } from './api'

export interface EquipeCollaborateur {
  id: number
  nom: string
  prenom: string
  email: string
  poste: string
  departement: string
  role: string
  typeEmploye: string
}

export interface EquipeMembre {
  id: number
  equipeId: number
  collaborateurId: number
  roleDansEquipe: string
  dateAffectation: string
  collaborateur: EquipeCollaborateur | null
}

export interface EquipeChefProjet {
  id: number
  nom: string
  prenom: string
  email: string
  poste: string
  role: string
}

export interface Equipe {
  id: number
  nom: string
  domaine: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  chefProjet: EquipeChefProjet | null
  membres: EquipeMembre[]
}

export interface CreateEquipePayload {
  rhId: number
  nom: string
  domaine: string
  description?: string
  chefProjetId?: number
}

export interface UpdateEquipePayload {
  rhId: number
  nom: string
  domaine: string
  description?: string
  isActive: boolean
}

export const equipesApi = {
  getAll: async (): Promise<Equipe[]> => {
    const response = await rhApi.get('/api/Equipes')
    return response.data
  },

  getById: async (id: number): Promise<Equipe> => {
    const response = await rhApi.get(`/api/Equipes/${id}`)
    return response.data
  },

  getDomaines: async (): Promise<string[]> => {
    const response = await rhApi.get('/api/Equipes/domaines')
    return response.data
  },

  create: async (payload: CreateEquipePayload): Promise<Equipe> => {
    const response = await rhApi.post('/api/Equipes', payload)
    return response.data
  },

  update: async (id: number, payload: UpdateEquipePayload): Promise<Equipe> => {
    const response = await rhApi.put(`/api/Equipes/${id}`, payload)
    return response.data
  },

  delete: async (id: number, rhId: number): Promise<void> => {
    await rhApi.delete(`/api/Equipes/${id}`, { params: { rhId } })
  },

  assignChef: async (id: number, rhId: number, chefProjetId: number): Promise<Equipe> => {
    const response = await rhApi.put(`/api/Equipes/${id}/assign-chef`, {
      rhId,
      chefProjetId,
    })
    return response.data
  },

  assignAgents: async (id: number, rhId: number, agentIds: number[]): Promise<Equipe> => {
    const response = await rhApi.post(`/api/Equipes/${id}/assign-agents`, {
      rhId,
      agentIds,
    })
    return response.data
  },

  removeMember: async (id: number, collaborateurId: number, rhId: number): Promise<Equipe> => {
    const response = await rhApi.delete(`/api/Equipes/${id}/members/${collaborateurId}`, {
      data: { rhId },
    })
    return response.data
  },
}
