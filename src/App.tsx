import { AuthProvider } from './app/contexts/AuthContext'
import { AppRoutes } from './app/routes'
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from './pages/Sidebar'
import type { ViewType } from './pages/Sidebar'
import LoginPage from "./pages/Login"
import ProjectsView from "./pages/Projets"
import TasksView from "./pages/Taches"
import CalendrierView from "./pages/Calendrier"
import PerformanceView from "./pages/Performance"
import { ModuleSelectorPage } from './pages/ModuleSelector'
import { useNotifications } from './services/useNotifications'
import { jwtDecode } from "jwt-decode"

// ========================================
// TYPES
// ========================================

interface UserData {
  name: string
  email: string
  role: 'admin' | 'member'
}

// ========================================
// COMPOSANTS PLACEHOLDERS (Modules non développés)
// ========================================

const CRMView = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Module CRM</h1>
    <p className="text-gray-600">Module en cours de développement...</p>
  </div>
)

const RHView = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Module RH</h1>
    <p className="text-gray-600">Module en cours de développement...</p>
  </div>
)

const BIView = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Module BI & Analytics</h1>
    <p className="text-gray-600">Module en cours de développement...</p>
  </div>
)

const HelpdeskView = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Module Helpdesk</h1>
    <p className="text-gray-600">Module en cours de développement...</p>
  </div>
)

const TimesheetView = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Module Timesheet</h1>
    <p className="text-gray-600">Module en cours de développement...</p>
  </div>
)

// ========================================
// ÉCRAN DE CHARGEMENT
// ========================================

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/30">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-2xl tracking-tight">
            Project<span className="text-orange-500">Flow</span>
          </span>
        </div>

        {/* Spinner */}
        <div className="w-10 h-10 border-[3px] border-orange-200 border-t-[#ef7c21] rounded-full animate-spin" />
        
        <p className="text-gray-400 text-sm">Chargement de votre espace...</p>
      </div>
    </div>
  )
}

// ========================================
// LAYOUT AUTHENTIFIÉ
// ========================================

function AuthenticatedLayout({
  user,
  onLogout,
  onBackToModules,
  children
}: {
  user: UserData
  onLogout: () => void
  onBackToModules: () => void
  children: React.ReactNode
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Récupérer l'employeId depuis localStorage pour les notifications
  const rawUser = localStorage.getItem("user")
  const storedUser = rawUser && rawUser !== "undefined" ? JSON.parse(rawUser) : {}
  const employeId = storedUser.employeId

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(employeId)

  // Déterminer la vue active à partir du chemin
  const getActiveViewFromPath = (pathname: string): ViewType => {
    if (pathname.includes('/projets')) return 'projects'
    if (pathname.includes('/taches')) return 'tasks'
    if (pathname.includes('/calendrier')) return 'calendrier'
    if (pathname.includes('/performance')) return 'performance'
    return 'projects'
  }

  const activeView = getActiveViewFromPath(location.pathname)

  // Navigation vers une vue
  const handleViewChange = (view: ViewType) => {
    switch (view) {
      case 'projects':
        navigate('/projets')
        break
      case 'tasks':
        navigate('/taches')
        break
      case 'calendrier':
        navigate('/calendrier')
        break
      case 'performance':
        navigate('/performance')
        break
    }
  }

  // Fermer le panel notifications si on change de page
  useEffect(() => {
    setShowNotifications(false)
  }, [location.pathname])

  // Si on est sur la page sélecteur de modules, on affiche juste les enfants
  const isModuleSelectorPage = location.pathname === '/modules'
  if (isModuleSelectorPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={onLogout}
        notificationsCount={unreadCount}
        defaultCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Contenu principal */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-8">
          {/* Barre supérieure : retour aux modules + notifications */}
          <div className="mb-6 flex justify-between items-center">
            {/* Bouton retour aux modules */}
            <button
              onClick={onBackToModules}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#ef7c21] transition-colors group"
            >
              <svg
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tous les modules
            </button>

            {/* Bouton notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ef7c21] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Panel Notifications */}
          {showNotifications && (
            <div className="mb-6 bg-white shadow-lg rounded-2xl p-5 border border-gray-100 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs font-medium text-[#ef7c21] bg-orange-50 px-2 py-0.5 rounded-full">
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-[#ef7c21] hover:underline transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-400 text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                        n.lu
                          ? "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                          : "bg-orange-50/60 border border-orange-200 hover:bg-orange-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.lu && (
                          <div className="w-2 h-2 bg-[#ef7c21] rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className={n.lu ? '' : 'ml-0'}>
                          <p className="text-sm text-gray-800 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {new Date(n.dateEnvoi).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contenu de la page */}
          {children}
        </div>
      </main>

      {/* Animation CSS inline */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

// ========================================
// COMPOSANT PRINCIPAL APP
// ========================================

function App() {
  const [user, setUser] = useState<UserData | null>(null)
  const [showModuleSelector, setShowModuleSelector] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // ----------------------------------------
  // Restauration de session au chargement
  // ----------------------------------------
  useEffect(() => {
    const restoreSession = () => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')

      if (token && userStr && userStr !== 'undefined') {
        try {
          // Décoder le token pour vérifier l'expiration
          const decoded: any = jwtDecode(token)
          const currentTime = Date.now() / 1000

          if (decoded.exp && decoded.exp < currentTime) {
            // Token expiré → on nettoie et on affiche le login
            console.log('[Auth] Token expiré, déconnexion automatique')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('lastSelectedModule')
            setIsLoading(false)
            return
          }

          // Parser les données utilisateur stockées
          const storedUser = JSON.parse(userStr)

          // Restaurer l'état user
          setUser({
            name: storedUser.nomComplet || storedUser.name || 'Utilisateur',
            email: storedUser.email || '',
            role: storedUser.role === 'Admin' || storedUser.role === 'admin' ? 'admin' : 'member'
          })

          // Restaurer l'état du sélecteur de modules
          const lastModule = localStorage.getItem('lastSelectedModule')
          setShowModuleSelector(!lastModule)

          console.log('[Auth] Session restaurée avec succès')
        } catch (error) {
          // Données corrompues → on nettoie
          console.error('[Auth] Erreur lors de la restauration:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('lastSelectedModule')
        }
      } else {
        console.log('[Auth] Aucune session trouvée')
      }

      setIsLoading(false)
    }

    restoreSession()
  }, []) // Se lance une seule fois au montage

  // ----------------------------------------
  // Handlers
  // ----------------------------------------

  const handleLogin = (userData: UserData) => {
    setUser(userData)
    setShowModuleSelector(true)
  }

  const handleLogout = () => {
    console.log('[Auth] Déconnexion')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('lastSelectedModule')
    setShowModuleSelector(false)
    navigate('/')
  }

  const handleModuleSelected = () => {
    setShowModuleSelector(false)
  }

  const handleBackToModules = () => {
    setShowModuleSelector(true)
    navigate('/modules')
  }

  // ----------------------------------------
  // Rendu conditionnel
  // ----------------------------------------

  // 1. Écran de chargement pendant la vérification du token
  if (isLoading) {
    return <LoadingScreen />
  }

  // 2. Page de login si pas d'utilisateur
  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  // 3. Sélecteur de modules
  if (showModuleSelector) {
    return (
      <ModuleSelectorPage
        user={user}
        onModuleSelected={handleModuleSelected}
      />
    )
  }

  // 4. Layout authentifié avec les routes
  return (
    <AuthenticatedLayout
      user={user}
      onLogout={handleLogout}
      onBackToModules={handleBackToModules}
    >
      <Routes>
        {/* Route par défaut → redirection vers projets */}
        <Route path="/" element={<Navigate to="/projets" replace />} />

        {/* Sélecteur de modules (accessible depuis le layout) */}
        <Route
          path="/modules"
          element={
            <ModuleSelectorPage
              user={user}
              onModuleSelected={handleModuleSelected}
            />
          }
        />

        {/* Modules développés */}
        <Route path="/projets" element={<ProjectsView />} />
        <Route path="/taches" element={<TasksView />} />
        <Route path="/calendrier" element={<CalendrierView />} />
        <Route path="/performance" element={<PerformanceView />} />

        {/* Modules placeholders */}
        <Route path="/crm" element={<CRMView />} />
        <Route path="/rh" element={<RHView />} />
        <Route path="/bi" element={<BIView />} />
        <Route path="/helpdesk" element={<HelpdeskView />} />
        <Route path="/timesheet" element={<TimesheetView />} />

        {/* Fallback → redirection vers projets */}
        <Route path="*" element={<Navigate to="/projets" replace />} />
      </Routes>
    </AuthenticatedLayout>
  )
}

export default App
