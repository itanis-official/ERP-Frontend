import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { login } from "../services/authService"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import {
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

interface UserData {
  name: string
  email: string
  role: 'admin' | 'member'
}

interface LoginPageProps {
  onLogin: (user: UserData) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('demo@projectflow.com')
  const [password, setPassword] = useState('password')
 
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
const navigate = useNavigate()
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError("")

  try {
    const data = await login(email, password)

    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
const decoded: any = jwtDecode(data.token)

const userData = {
  nomComplet: decoded.nomComplet,
  email: decoded.email,
  role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  employeId: parseInt(decoded.EmployeId)
}

localStorage.setItem("user", JSON.stringify(userData))

    onLogin({
      name: data.nomComplet,
      email: data.email,
      role: data.roles[0] === "Admin" ? "admin" : "member"
    })

   
    navigate("/projets")

  } catch (err: any) {
    setError("Email ou mot de passe incorrect")
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full top-[-100px] right-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-orange-400/10 blur-[100px] rounded-full bottom-[-100px] left-[-100px]" />

      <div className="relative z-10 w-full max-w-md animate-fadeIn">

        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-500/30">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <span className="font-bold text-white text-3xl ml-3 tracking-tight">
            Project<span className="text-orange-500">Flow</span>
          </span>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">

          <div className="p-8">

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">
                Bienvenue
              </h1>
              <p className="text-gray-300 mt-2 text-sm">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="exemple@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-12 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full justify-center py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Se connecter</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>

            </form>
          </div>
        </Card>

        <p className="text-center text-gray-400 text-sm mt-8">
          © 2024 ProjectFlow. Tous droits réservés.
        </p>

      </div>
    </div>
  )
}

export default LoginPage
