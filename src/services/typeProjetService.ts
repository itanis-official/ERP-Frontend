// src/services/typeProjetService.ts
import api from './api'

export interface TypeProjet {
  id: number
  typeProjetGuid: string
  value: string
  label: string
  isActive: boolean
  ordre: number
  updatedAt: string
}

// Récupérer tous les types de projet actifs
export const getTypesProjet = async (): Promise<TypeProjet[]> => {
  try {
    const response = await api.get('/TypesProjet')
    // Filtrer seulement les types actifs et trier par ordre
    const activeTypes = response.data.filter((t: TypeProjet) => t.isActive)
    return activeTypes.sort((a: TypeProjet, b: TypeProjet) => a.ordre - b.ordre)
  } catch (error) {
    console.error('Erreur lors de la récupération des types de projet:', error)
    // Fallback en cas d'erreur
    return [
      { id: 1, typeProjetGuid: 'web', value: 'Développement Web', label: 'Développement Web', isActive: true, ordre: 1, updatedAt: '' },
      { id: 2, typeProjetGuid: 'mobile', value: 'Développement Mobile', label: 'Développement Mobile', isActive: true, ordre: 2, updatedAt: '' },
      { id: 3, typeProjetGuid: 'design', value: 'Design UI/UX', label: 'Design UI/UX', isActive: true, ordre: 3, updatedAt: '' },
      { id: 4, typeProjetGuid: 'consulting', value: 'Consulting', label: 'Consulting', isActive: true, ordre: 4, updatedAt: '' },
      { id: 5, typeProjetGuid: 'it', value: 'IT', label: 'IT', isActive: true, ordre: 5, updatedAt: '' },
    ]
  }
}