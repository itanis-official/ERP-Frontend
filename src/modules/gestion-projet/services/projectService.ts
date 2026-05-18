import api from '../../../core/api/api'

export const getMesProjetsChef = async () => {
  const response = await api.get("/Projets/mes-projets-chef")
  return response.data
}

export const getProjetById = async (id: string | number) => {
  const response = await api.get(`/Projets/${id}`)
  return response.data
}

export const updateProjet = async (id: string | number, data: Record<string, unknown>) => {
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
export const getAllProjets = async () => {
  // Appel vers l'endpoint racine "Projets" que nous venons de créer
  const response = await api.get("/Projets") 
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
  client: { id: number; nom: string }
  groupeEquipe: {
    id: number
    nom: string
    employes: Array<{ id: number; nomComplet: string }>
  }
  phases: Array<{ id: number; typePhase: string; statut: string }>
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

export const uploadCdcFile = async (
  projectId: number,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ fileUrl: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve({ fileUrl: response.cdcFileUrl || response.fileUrl })
        } catch {
          resolve({ fileUrl: xhr.responseText })
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))

    const token = localStorage.getItem('token')
    xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:5101'}/api/Projets/upload-cdc/${projectId}`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

export const deleteCdcFile = async (projectId: number): Promise<void> => {
  await api.delete(`/Projets/${projectId}/cdc`)
}

export const downloadCdcFile = async (projectId: number): Promise<void> => {
  const response = await api.get(`/Projets/${projectId}/cdc/download`, { responseType: 'blob' })

  let filename = 'cahier-des-charges'
  const contentDisposition = response.headers['content-disposition']
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (match && match[1]) filename = match[1].replace(/['"]/g, '')
  }

  const extension = filename.split('.').pop()?.toLowerCase()
  let blob = response.data

  if (extension === 'pdf' && (!blob.type || blob.type === 'application/octet-stream')) {
    blob = new Blob([response.data], { type: 'application/pdf' })
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url) }, 100)
}

export const checkCdcExists = async (projectId: number): Promise<boolean> => {
  try {
    const response = await api.get(`/Projets/${projectId}/cdc/exists`)
    return response.data.exists
  } catch {
    return false
  }
}
