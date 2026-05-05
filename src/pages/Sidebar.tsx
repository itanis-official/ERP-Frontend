// Sidebar.tsx - Version définitive corrigée
import React, { useState } from 'react'
import {
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  Briefcase,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// ✅ Définition explicite du type
export type ViewType = 'projects' | 'tasks' | 'calendrier' | 'performance'

interface UserData {
  name: string
  email: string
  role: 'admin' | 'member'
}

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  user: UserData
  onLogout: () => void
  notificationsCount?: number
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  activeView,
  onViewChange,
  user,
  onLogout,
  notificationsCount = 0,
  defaultCollapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  
  // ✅ CORRECTION : Les IDs doivent correspondre EXACTEMENT au type ViewType
  const navItems: { id: ViewType; label: string; icon: any }[] = [
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
    },
    {
      id: 'calendrier',  // ✅ Changé de 'timesheet' à 'calendrier'
      label: 'Calendrier',
      icon: Clock,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
    },
  ]
  
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapsedChange?.(newState)
  }
  
  return (
    <>
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-20 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'}`}
        style={{
          transform: 'translateX(-50%)',
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-[#ef7c21]" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-[#ef7c21]" />
        )}
      </button>

      <aside
        className={`bg-white flex flex-col h-screen fixed left-0 top-0 z-10 font-['Poppins'] shadow-lg transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header avec logo */}
        <div
          className={`h-20 flex items-center border-b border-gray-200 transition-all duration-300 ${
            isCollapsed ? 'justify-center px-0' : 'px-6'
          }`}
        >
          {isCollapsed ? (
            <Briefcase className="h-7 w-7 text-[#ef7c21] flex-shrink-0" />
          ) : (
            <img
              src="https://z-cdn-media.chatglm.cn/files/f95aa87a-1a5e-4c92-9365-b5db842cb0c5.png?auth_key=1876432345-51dbc54e1cc64042a6b855225769d34f-0-d9f4bbf9545d663555ea1d6f0769f10d"
              alt="ITANIS Logo"
              style={{ height: '80px', width: 'auto' }}
              className="object-contain"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center rounded-lg transition-all duration-200 group ${isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'} ${isActive ? 'bg-[#ef7c21]/10 text-[#ef7c21]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#ef7c21]' : 'text-gray-400 group-hover:text-gray-600'} ${!isCollapsed && 'mr-3'}`}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer - Notifications */}
        <div className="border-t border-gray-200">
          <div
            className={`border-b border-gray-200 ${isCollapsed ? 'px-2 py-4' : 'px-4 py-3'}`}
          >
            <div
              className={`flex items-center text-gray-600 hover:text-[#ef7c21] cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div
                className={`flex items-center text-sm font-medium ${isCollapsed ? 'flex-col gap-1' : ''}`}
              >
                <Bell className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
                {!isCollapsed && 'Notifications'}
              </div>
              {notificationsCount > 0 && (
                <span
                  className={`bg-[#ef7c21] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isCollapsed ? 'absolute -mt-6 ml-4' : ''}`}
                >
                  {notificationsCount}
                </span>
              )}
            </div>
          </div>

          {/* Footer - User info */}
          <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col' : ''}`}>
              <div
                className={`h-9 w-9 rounded-full bg-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] font-medium text-sm border border-[#ef7c21]/20 flex-shrink-0`}
              >
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>

              {!isCollapsed && (
                <>
                  <div className="ml-3 overflow-hidden flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {user.role === 'admin' ? 'Chef de projet' : 'Membre'}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="ml-auto text-gray-400 hover:text-[#ef7c21] transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              )}

              {isCollapsed && (
                <button
                  onClick={onLogout}
                  className="mt-2 text-gray-400 hover:text-[#ef7c21] transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}
      />
    </>
  )
}