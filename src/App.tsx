import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './core/components/Sidebar'
import type { ViewType } from './core/components/Sidebar'
import LoginPage from './core/components/Login'
import { ModuleSelectorPage } from './core/components/ModuleSelector'
import { useNotifications } from './core/hooks/useNotifications'
import { jwtDecode } from 'jwt-decode'

import ProjectsView from './modules/gestion-projet/components/Projets'
import { TasksKanban as TasksView } from './modules/gestion-projet/components/Taches'
import { CalendrierView } from './modules/gestion-projet/components/Calendrier'
import ValidatorView from './modules/gestion-projet/components/Performance'

import { CRMView } from './modules/crm'
import { RHView } from './modules/rh'
import { BIView } from './modules/bi'
import { HelpdeskView } from './modules/helpdesk'
import { TimesheetView } from './modules/timesheet'

interface UserData {
  name: string
  email: string
  role: 'admin' | 'member'
}

interface StoredUser {
  nomComplet?: string
  name?: string
  email?: string
  role?: string
}

interface JwtPayload {
  exp?: number
}

function initSession(): { user: UserData | null; showModuleSelector: boolean } {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  if (!token || !userStr || userStr === 'undefined') return { user: null, showModuleSelector: true }
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('lastSelectedModule')
      return { user: null, showModuleSelector: true }
    }
    const stored: StoredUser = JSON.parse(userStr)
    return {
      user: {
        name: stored.nomComplet || stored.name || 'Utilisateur',
        email: stored.email || '',
        role: stored.role === 'Admin' || stored.role === 'admin' ? 'admin' : 'member',
      },
      showModuleSelector: !localStorage.getItem('lastSelectedModule'),
    }
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('lastSelectedModule')
    return { user: null, showModuleSelector: true }
  }
}

// ── Layout authentifié ────────────────────────────────────────────────────────

function AuthenticatedLayout({
  user, onLogout, onBackToModules, children,
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
  const [notifPathname, setNotifPathname] = useState(location.pathname)

  const rawUser = localStorage.getItem('user')
  const storedUser: StoredUser = rawUser && rawUser !== 'undefined' ? JSON.parse(rawUser) : {}
  const employeId = (storedUser as StoredUser & { employeId?: number }).employeId

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(employeId ?? 0)

  const getActiveView = (pathname: string): ViewType => {
    if (pathname.includes('/projets')) return 'projects'
    if (pathname.includes('/taches')) return 'tasks'
    if (pathname.includes('/calendrier')) return 'calendrier'
    if (pathname.includes('/performance')) return 'performance'
    return 'projects'
  }

  const handleViewChange = (view: ViewType) => {
    const routes: Record<ViewType, string> = {
      projects: '/projets', tasks: '/taches',
      calendrier: '/calendrier', performance: '/performance',
    }
    navigate(routes[view])
  }

  // Fermer les notifications quand le pathname change (dérivation sans effet ni ref)
  if (showNotifications && location.pathname !== notifPathname) {
    setShowNotifications(false)
    setNotifPathname(location.pathname)
  }

  if (location.pathname === '/modules') return <>{children}</>

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeView={getActiveView(location.pathname)}
        onViewChange={handleViewChange}
        user={user}
        onLogout={onLogout}
        notificationsCount={unreadCount}
        defaultCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-8">
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={onBackToModules}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#ef7c21] transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tous les modules
            </button>

            <button
              onClick={() => setShowNotifications(v => !v)}
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
                  <button onClick={markAllAsRead} className="text-sm text-[#ef7c21] hover:underline">
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
                          ? 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                          : 'bg-orange-50/60 border border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.lu && <div className="w-2 h-2 bg-[#ef7c21] rounded-full mt-1.5 flex-shrink-0" />}
                        <div>
                          <p className="text-sm text-gray-800 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {new Date(n.dateEnvoi).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
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

          {children}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const initial = initSession()
  const [user, setUser] = useState<UserData | null>(initial.user)
  const [showModuleSelector, setShowModuleSelector] = useState(initial.showModuleSelector)
  const navigate = useNavigate()

  const handleLogin = (userData: StoredUser) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser({
      name: userData.nomComplet || userData.name || 'Utilisateur',
      email: userData.email || '',
      role: userData.role === 'Admin' || userData.role === 'admin' ? 'admin' : 'member',
    })
    setShowModuleSelector(true)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('lastSelectedModule')
    setShowModuleSelector(false)
    navigate('/')
  }

  if (!user) return <LoginPage onLogin={handleLogin} />
  if (showModuleSelector) {
    return <ModuleSelectorPage user={user} onModuleSelected={() => setShowModuleSelector(false)} />
  }

  return (
    <AuthenticatedLayout
      user={user}
      onLogout={handleLogout}
      onBackToModules={() => { setShowModuleSelector(true); navigate('/modules') }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/projets" replace />} />
        <Route path="/modules" element={<ModuleSelectorPage user={user} onModuleSelected={() => setShowModuleSelector(false)} />} />
        <Route path="/projets" element={<ProjectsView />} />
        <Route path="/taches" element={<TasksView />} />
        <Route path="/calendrier" element={<CalendrierView />} />
        <Route path="/performance" element={<ValidatorView />} />
        <Route path="/crm" element={<CRMView />} />
        <Route path="/rh" element={<RHView />} />
        <Route path="/bi" element={<BIView />} />
        <Route path="/helpdesk" element={<HelpdeskView />} />
        <Route path="/timesheet" element={<TimesheetView />} />
        <Route path="*" element={<Navigate to="/projets" replace />} />
      </Routes>
    </AuthenticatedLayout>
  )
}

export default App
