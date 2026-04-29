import { AuthProvider } from './app/contexts/AuthContext'
import { AppRoutes } from './app/routes'
import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from './pages/Sidebar'
import type { ViewType } from './pages/Sidebar'  
import LoginPage from "./pages/Login"
import ProjectsView from "./pages/Projets"
import TasksView from "./pages/Taches"
import TimesheetView from "./pages/Calendrier"
import PerformanceView from "./pages/Performance"
import { useNotifications } from './services/useNotifications'


interface UserData {
  name: string
  email: string
  role: 'admin' | 'member'
}


function AuthenticatedLayout({ user, onLogout, children }: { 
  user: UserData, 
  onLogout: () => void,
  children: React.ReactNode 
  
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
const rawUser = localStorage.getItem("user")

const storedUser = rawUser && rawUser !== "undefined"
  ? JSON.parse(rawUser)
  : {}

const employeId = storedUser.employeId
const [showNotifications, setShowNotifications] = useState(false)

const { notifications, unreadCount, markAsRead, markAllAsRead } =
  useNotifications(employeId)
  const getActiveViewFromPath = (pathname: string): ViewType => {
    if (pathname.includes('/projets')) return 'projects'
    if (pathname.includes('/taches')) return 'tasks'
    if (pathname.includes('/calendrier')) return 'timesheet'
    if (pathname.includes('/performance')) return 'performance'
    return 'projects'
  }

  const activeView = getActiveViewFromPath(location.pathname)

  const handleViewChange = (view: ViewType) => {
    switch (view) {
      case 'projects':
        navigate('/projets')
        break
      case 'tasks':
        navigate('/taches')
        break
      case 'timesheet':
        navigate('/calendrier')
        break
      case 'performance':
        navigate('/performance')
        break
    }
  }

return (
  <div className="min-h-screen bg-gray-50">

    <Sidebar
      activeView={activeView}
      onViewChange={handleViewChange}
      user={user}
      onLogout={onLogout}
      notificationsCount={unreadCount}
      defaultCollapsed={sidebarCollapsed}
      onCollapsedChange={setSidebarCollapsed}
    />

    <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="p-8">

        {/* 🔔 BOUTON NOTIFICATIONS */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-white rounded-full shadow"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* 🔔 PANEL NOTIFICATIONS */}
        {showNotifications && (
          <div className="mb-6 bg-white shadow-lg rounded-xl p-4 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                Notifications ({unreadCount} non lues)
              </h3>

              <button
                onClick={markAllAsRead}
                className="text-sm text-orange-500"
              >
                Tout marquer comme lu
              </button>
            </div>

            {notifications.length === 0 && (
              <p className="text-gray-500 text-sm">
                Aucune notification
              </p>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 rounded-lg cursor-pointer border ${
                    n.lu
                      ? "bg-gray-100"
                      : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <p className="text-sm text-gray-800">
                    {n.message}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.dateEnvoi).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {children}

      </div>
    </main>
  </div>
)
}

function App() {
  const [user, setUser] = useState<UserData | null>(null)

  const handleLogin = (userData: UserData) => {
    setUser(userData)
    console.log("Utilisateur connecté :", userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
    <AuthenticatedLayout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/projets" replace />} />
        <Route path="/projets" element={<ProjectsView />} />
        <Route path="/taches" element={<TasksView />} />
        <Route path="/calendrier" element={<TimesheetView />} />
        <Route path="/performance" element={<PerformanceView />} />
      </Routes>
    </AuthenticatedLayout>
  )
}

export default App
