
import api from './api'

export interface SubTaskToTest {
  id: number
  titre: string
  statut: string
  dureeEstimeeHeures: number
  tache: string
  phase: string
  projet: string
}


export const getSubTasksToTest = async (projetId?: number): Promise<SubTaskToTest[]> => {
  try {
    const params = projetId ? { projetId } : {}
    const response = await api.get('/SousTaches/a-tester', { params })
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches à tester:', error)
    throw error
  }
}

export const validateSubTask = async (subTaskId: number): Promise<void> => {
  try {
    await api.post(`/SousTaches/${subTaskId}/valider`)
  } catch (error) {
    console.error('Erreur lors de la validation de la sous-tâche:', error)
    throw error
  }
}

export const rejectSubTask = async (subTaskId: number, reason: string): Promise<void> => {
  try {
    await api.post(`/SousTaches/${subTaskId}/rejeter`, { raisonRejet: reason })
  } catch (error) {
    console.error('Erreur lors du rejet de la sous-tâche:', error)
    throw error
  }
}

