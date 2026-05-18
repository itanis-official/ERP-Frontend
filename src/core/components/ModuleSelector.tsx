import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  BarChart3,
  Headphones,
  Clock,
  UserCog,
} from 'lucide-react'
import { Card } from '../../ui/Card'

export type ModuleType =
  | 'crm'
  | 'rh'
  | 'gestion-projet'
  | 'bi'
  | 'helpdesk'
  | 'timesheet'

interface Module {
  id: ModuleType
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  features: string[]
  path: string
}

const modules: Module[] = [
  {
    id: 'crm',
    name: 'CRM',
    description: 'Gérez vos clients, opportunités et ventes',
    icon: <Users className="h-8 w-8" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 group-hover:bg-blue-100',
    features: ['Contacts', 'Opportunités', 'Pipeline de ventes', 'Historique'],
    path: '/crm',
  },
  {
    id: 'rh',
    name: 'Ressources Humaines',
    description: 'Gestion du personnel, recrutement et paie',
    icon: <UserCog className="h-8 w-8" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 group-hover:bg-emerald-100',
    features: ['Employés', 'Recrutement', 'Congés', 'Évaluations'],
    path: '/rh',
  },
  {
    id: 'gestion-projet',
    name: 'Gestion de Projet',
    description: 'Planifiez, suivez et livrez vos projets',
    icon: <Briefcase className="h-8 w-8" />,
    color: 'text-[#ef7c21]',
    bgColor: 'bg-orange-50 group-hover:bg-orange-100',
    features: ['Tâches', 'Équipes', 'Échéances', 'Rapports'],
    path: '/projets',
  },
  {
    id: 'bi',
    name: 'BI & Analytics',
    description: 'Tableaux de bord et analyses avancées',
    icon: <BarChart3 className="h-8 w-8" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 group-hover:bg-purple-100',
    features: ['KPI', 'Rapports', 'Prédictions', 'Data viz'],
    path: '/bi',
  },
  {
    id: 'helpdesk',
    name: 'Helpdesk',
    description: 'Support client et gestion des tickets',
    icon: <Headphones className="h-8 w-8" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 group-hover:bg-rose-100',
    features: ['Tickets', 'Chat', 'Base de connaissances', 'SLA'],
    path: '/helpdesk',
  },
  {
    id: 'timesheet',
    name: 'Timesheet',
    description: 'Suivi du temps et productivité',
    icon: <Clock className="h-8 w-8" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 group-hover:bg-cyan-100',
    features: ['Temps travaillé', 'Projets', 'Rapports', 'Facturation'],
    path: '/Timesheet',
  },
]

interface ModuleSelectorPageProps {
  user: {
    name: string
    email: string
    role: 'admin' | 'member'
  }
  onModuleSelected?: () => void
}

export function ModuleSelectorPage({ user, onModuleSelected }: ModuleSelectorPageProps) {
  const navigate = useNavigate()

  const handleSelectModule = (module: Module) => {
    localStorage.setItem('lastSelectedModule', module.id)
    if (onModuleSelected) {
      onModuleSelected()
    }
    navigate(module.path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenue, {user.name}
              </h1>
              <p className="text-gray-500 mt-1">
                Choisissez un module pour commencer à travailler
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user.email}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ef7c21] to-orange-500 flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 overflow-hidden"
              onClick={() => handleSelectModule(module)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl ${module.bgColor} transition-colors duration-300`}
                  >
                    <div className={module.color}>{module.icon}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      Module
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {module.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {module.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {module.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-[#ef7c21] group-hover:underline inline-flex items-center gap-1">
                    Accéder au module
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Modules récents
          </h2>
          <div className="flex gap-3">
            {modules.slice(0, 3).map((module) => (
              <button
                key={module.id}
                onClick={() => handleSelectModule(module)}
                className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600 hover:shadow-md hover:text-[#ef7c21] transition-all"
              >
                {module.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}