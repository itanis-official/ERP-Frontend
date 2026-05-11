import api from '../../../core/api/api'

export interface OverloadedEmployee {
  employeId: number
  nom: string
  date: string
  chargeJour: number
  maxAllowed: number
}


export interface GlobalLoad {
  employeId: number
  employeNom: string
  date: string
  totalHeures: number
  projetId: number
  projetNom: string
  taskId: string
  taskTitre: string
  sousTacheId: string
}

export const getOverloaded = async (maxHours: number = 8): Promise<OverloadedEmployee[]> => {
  const response = await api.get('/LoadBalancing/overloaded', { params: { maxHours } })
  return response.data
}

export const getAllLoads = async (): Promise<GlobalLoad[]> => {
  const response = await api.get('/LoadBalancing/all')
  return response.data
}


