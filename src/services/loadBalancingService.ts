const API_URL = 'http://localhost:5101/api/LoadBalancing'
import api from "./api"
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Erreur API: ${res.status} - ${text}`)
  }
  return res.json()
}

export const getLoads = async () => {
  const res = await fetch(`${API_URL}/loads`)
  return handleResponse(res)
}

export const getDailyLoads = async () => {
  const res = await fetch(`${API_URL}/daily-loads`)
  return handleResponse(res)
}

export const getOverloaded = async () => {
  const res = await fetch(`${API_URL}/overloaded`)
  return handleResponse(res)
}

export const getSuggestions = async () => {
  const res = await fetch(`${API_URL}/suggestions`)
  return handleResponse(res)
}

export const autoBalance = async () => {
  const res = await fetch(`${API_URL}/auto-balance`, {
    method: 'POST'
  })
  return handleResponse(res)
}
