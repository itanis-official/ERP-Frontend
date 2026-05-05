import api from './api'

export interface Competence {
  id: number
  nom: string
  categorie: string
  niveau: 'Débutant' | 'Intermédiaire' | 'Expert'
  description?: string
}

export interface EmployeCompetence {
  id: number
  employeId: number
  employeNom: string
  competenceId: number
  competenceNom: string
  competenceCategorie: string
  niveau: string
  dateAcquisition: string
  certificat?: string
}

export const getCompetences = async (): Promise<Competence[]> => {
  const response = await api.get('/Competences')
  return response.data
}

export const getCompetencesByEmploye = async (employeId: number): Promise<EmployeCompetence[]> => {
  const response = await api.get(`/Competences/employe/${employeId}`)
  return response.data
}

export const ajouterCompetence = async (competence: Omit<Competence, 'id'>): Promise<Competence> => {
  const response = await api.post('/Competences', competence)
  return response.data
}

export const assignerCompetence = async (employeId: number, competenceId: number, niveau: string, certificat?: string) => {
  const response = await api.post('/Competences/assigner', { employeId, competenceId, niveau, certificat })
  return response.data
}

export const retirerCompetenceEmploye = async (employeId: number, competenceId: number) => {
  const response = await api.delete(`/Competences/employe/${employeId}/competence/${competenceId}`)
  return response.data
}

export const supprimerCompetence = async (id: number) => {
  const response = await api.delete(`/Competences/${id}`)
  return response.data
}