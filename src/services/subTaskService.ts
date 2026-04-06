import api from './api'

export interface SubTaskFromApi {
  id: number
  titre: string
  dureeEstimeeHeures: number
  tacheId: number
  tacheTitre: string
  projetId: number
  projetNom: string
  statut?: string
  dateDebutPrevue?: string
  dateFinPrevue?: string
  description?: string
  priorite?: string
  employeId?: number
  employeNom?: string
  heuresConsommees?: number
   raisonRejet?: string
  rejetPar?: string
  rejetDate?: string
}

export interface TimeEntry {
  id: number
  sousTacheId: number
  employeId: number
  date: string
  dureeHeures: number
  type: string
}
export interface Commentaire {
  id: number
  commentaire: string
  dateTest: string
}


export const getMySubTasks = async (projetId?: number): Promise<SubTaskFromApi[]> => {
  try {
    const params = projetId ? { projetId } : {}
    const response = await api.get('/Projets/mes-sous-taches', { params })
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des sous-tâches:', error)
    throw error
  }
}

export const getTimeEntries = async (subTaskId: number): Promise<TimeEntry[]> => {
  try {
    const response = await api.get(`/SousTaches/sous-tache/${subTaskId}`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des temps:', error)
    return []
  }
}
export const getSubTaskComments = async (subTaskId: number): Promise<Commentaire[]> => {
  try {
    const response = await api.get(`/SousTaches/${subTaskId}/commentaires`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error)
    return []
  }
}

export const getSubTaskDetails = async (subTaskId: number): Promise<SubTaskFromApi> => {
  try {
    // Essayer plusieurs endpoints possibles
    const endpoints = [
      `/SousTaches/${subTaskId}`,
      `/SousTaches/details/${subTaskId}`,
      `/SousTaches/${subTaskId}/details`
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint)
        return response.data
      } catch (err) {
        // Continuer vers l'endpoint suivant
      }
    }
    
    // Si aucun endpoint ne fonctionne, retourner un objet vide avec l'ID
    console.warn(`Aucun endpoint trouvé pour les détails de la tâche ${subTaskId}`)
    return { id: subTaskId, titre: '', dureeEstimeeHeures: 0, tacheId: 0, tacheTitre: '', projetId: 0, projetNom: '' }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error)
    throw error
  }
}

export const updateSubTaskStatus = async (subTaskId: number, status: string): Promise<void> => {
  try {
    await api.patch(`/SousTaches/${subTaskId}/statut`, { statut: status })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    throw error
  }
}

export const addTimeEntry = async (subTaskId: number, hours: number, date: string): Promise<void> => {
  try {
    await api.post('/DeclarationTemps', {
      sousTacheId: subTaskId,
      dureeHeures: hours,
      date,
      type: 'Travail'
    })
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la déclaration de temps:', error)
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

export const validateSubTask = async (subTaskId: number): Promise<void> => {
  try {
    await api.post(`/SousTaches/${subTaskId}/valider`)
  } catch (error) {
    console.error('Erreur lors de la validation de la sous-tâche:', error)
    throw error
  }
}

