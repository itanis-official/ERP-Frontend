import api from '../../../core/api/api'

export interface TaskByMember {
  id: number
  titre: string
  statut: string
  dateDebutPrevue: string
  dateFinPrevue: string
  role: string
  phase: string
  projet: string
  sousTaches: Array<{
    id: number
    titre: string
    statut: string
    dureeEstimeeHeures: number
  }>
}

export const getTasksByMember = async (projetId: number, employeId: number): Promise<TaskByMember[]> => {
  try {
    const response = await api.get(`/api/Taches/membre`, {
      params: {
        projetId,
        employeId
      }
    })
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error)
    throw error
  }
}
