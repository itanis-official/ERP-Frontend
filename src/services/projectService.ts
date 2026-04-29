import api from "./api"

export const getMesProjetsChef = async () => {
  const response = await api.get("/Projets/mes-projets-chef")
  return response.data
}
export const getProjetById = async (id: string | number) => {
  const response = await api.get(`/Projets/${id}`)
  return response.data
}
export const updateProjet = async (id: string | number, data: any) => {
  const response = await api.put(`/Projets/${id}`, data)
  return response.data
}
export const addProjectMembers = async (projectId: number, memberIds: number[]) => {
  const response = await api.post(`/Projets/${projectId}/membres`, memberIds)
  return response.data
}

export const removeProjectMember = async (projectId: number, memberId: number) => {
  const response = await api.delete(`/Projets/${projectId}/membres/${memberId}`)
  return response.data
}
export const getAvailableMembers = async () => {
  const response = await api.get("/Employes")
  return response.data
}
export interface ProjetMembre {
  id: number
  nom: string
  description: string
  lieu: string
  dateDebut: string
  dateFinPrevue: string
  dateFinReelle: string | null
  budgetEstime: number
  budgetReel: number
  typeProjet: string
  statut: string
  client: {
    id: number
    nom: string
  }
  groupeEquipe: {
    id: number
    nom: string
    employes: Array<{
      id: number
      nomComplet: string
    }>
  }
  phases: Array<{
    id: number
    typePhase: string
    statut: string
  }>
}
export const getMesProjetsMembre = async (): Promise<ProjetMembre[]> => {
  try {
    const response = await api.get('/Projets/mes-projets-membre')
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    throw error
  }
}