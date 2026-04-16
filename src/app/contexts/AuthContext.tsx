import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { rhApi } from '../lib/api'

export interface AuthUser {
  id: number
  nom: string
  prenom: string
  email: string
  login?: string
  role: string
  poste: string
  departement: string
  avatar: string | null
  type: string
  token: string
  mustChangePassword?: boolean
  message?: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (loginId: string, password: string) => Promise<AuthUser>
  completeFirstLoginPasswordChange: (loginId: string, currentPassword: string, newPassword: string) => Promise<AuthUser>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user))
    else localStorage.removeItem('auth_user')
  }, [user])

  const login = async (loginId: string, password: string): Promise<AuthUser> => {
    try {
      const { data } = await rhApi.post<AuthUser>('/api/auth/login', {
        login: loginId,
        password,
      })

      if (!data?.mustChangePassword) {
        setUser(data)
      }

      return data
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Login ou mot de passe incorrect')
    }
  }

  const completeFirstLoginPasswordChange = async (loginId: string, currentPassword: string, newPassword: string): Promise<AuthUser> => {
    try {
      const { data } = await rhApi.post<AuthUser>('/api/auth/change-password-first-login', {
        login: loginId,
        currentPassword,
        newPassword,
      })
      setUser(data)
      return data
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Impossible de changer le mot de passe')
    }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, completeFirstLoginPasswordChange, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
