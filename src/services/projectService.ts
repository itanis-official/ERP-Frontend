// services/projectService.ts - Version complète avec gestion du CDC

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

// ==================== CAHIER DES CHARGES ====================

/**
 * Upload d'un fichier de cahier des charges
 * @param projectId - ID du projet
 * @param file - Fichier à uploader (PDF ou DOCX)
 * @param onProgress - Callback de progression (0-100)
 * @returns URL du fichier uploadé
 */
export const uploadCdcFile = async (
  projectId: number, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ fileUrl: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    // Progression de l'upload
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })
    
    // Réponse reçue
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          // La réponse peut contenir cdcFileUrl ou fileUrl
          resolve({ fileUrl: response.cdcFileUrl || response.fileUrl })
        } catch {
          resolve({ fileUrl: xhr.responseText })
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })
    
    // Erreur réseau
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    
    // Configuration de la requête
    const token = localStorage.getItem('token')
    xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:5101'}/api/Projets/upload-cdc/${projectId}`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

/**
 * Supprimer le fichier de cahier des charges
 * @param projectId - ID du projet
 */
export const deleteCdcFile = async (projectId: number): Promise<void> => {
  try {
    await api.delete(`/Projets/${projectId}/cdc`)
  } catch (error) {
    console.error('Erreur lors de la suppression du CDC:', error)
    throw error
  }
}
export const downloadCdcFile = async (projectId: number): Promise<void> => {
  try {
    const response = await api.get(`/Projets/${projectId}/cdc/download`, {
      responseType: 'blob'
    })
    
    console.log('Headers:', response.headers)
    console.log('Content-Type:', response.headers['content-type'])
    console.log('Content-Disposition:', response.headers['content-disposition'])
    console.log('Taille du blob:', response.data.size)
    console.log('Type du blob (avant):', response.data.type)
    
    let filename = 'cahier-des-charges'
    const contentDisposition = response.headers['content-disposition']
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '')
      }
    }
    
    const extension = filename.split('.').pop()?.toLowerCase()
    
    // 🔥 Pour les fichiers Word, ne pas changer le blob si c'est déjà le bon type
    let blob = response.data
    
    if (extension === 'docx' && (!blob.type || blob.type === 'application/octet-stream')) {
      // Le blob est correct même sans type MIME explicite
      console.log('Fichier DOCX détecté, téléchargement direct...')
    } else if (extension === 'pdf' && (!blob.type || blob.type === 'application/octet-stream')) {
      // Recréer le blob avec le bon type pour PDF si nécessaire
      blob = new Blob([response.data], { type: 'application/pdf' })
    }
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    throw new Error('Impossible de télécharger le fichier')
  }
}
/**
 * Vérifier si un projet a un cahier des charges
 * @param projectId - ID du projet
 */
export const checkCdcExists = async (projectId: number): Promise<boolean> => {
  try {
    const response = await api.get(`/Projets/${projectId}/cdc/exists`)
    return response.data.exists
  } catch (error) {
    console.error('Erreur lors de la vérification du CDC:', error)
    return false
  }
}