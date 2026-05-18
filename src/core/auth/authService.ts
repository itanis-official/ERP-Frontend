import {projetApi} from '../../config/api'

export const login = async (email: string, password: string) => {
  const response = await projetApi.post("/Auth/login", { email, password })
  return response.data
}
