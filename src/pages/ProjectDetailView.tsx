import React, { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Users,
  DollarSign,
  Clock3,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Bug,
  X,
  ListTodo,
  Users2,
  CalendarDays,
  Timer,
  Target,
  Info,
  MapPin,
  Briefcase,
  Code,
  Smartphone,
  PenTool,
  Mail,
  Activity,
  Eye,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react'
import { getProjetById } from '../services/projectService'

// ================= TYPES =================
interface SousTache {
  id: number
  titre: string
  statut: string
  dureeEstimeeHeures?: number
  dureeReelleHeures?: number
  dateDebut?: string
  dateFin?: string
}

interface Tache {
  id: number
  titre: string
  description?: string
  responsable?: {
    id: number
    nomComplet: string
    email?: string
    role?: string
  }
  testeur?: {
    id: number
    nomComplet: string
    email?: string
    role?: string
  }
  sousTaches?: SousTache[]
  statut?: string
  dateDebutPrevue?: string
  dateFinPrevue?: string

  chargeEstimee?: number
  chargeReelle?: number
  commentaires?: string
}

interface Phase {
  id: number
  typePhase: string
  statut: string
  taches?: Tache[]
  dateDebut?: string
  dateFin?: string
}

interface Employe {
  id: number
  nomComplet: string
  role: string
  email?: string
  phone?: string
  specialites?: string[]
}

interface GroupeEquipe {
  id: number
  nom: string
  typeProjetCompatible: string
  employes: Employe[]
}

interface Client {
  id: number
  nom: string
  email?: string
  telephone?: string
}

interface Projet {
  id: number
  nom: string
  description: string
  lieu?: string
  dateDebut: string
  dateFinPrevue: string
  dateFinReelle?: string
  budgetEstime: number
  budgetReel?: number
  typeProjet: string
  statut: string
  client?: Client
  groupeEquipe?: GroupeEquipe
  phases: Phase[]
}

interface ProjectDetailViewProps {
  project?: any
  onBack: () => void
  projectId?: string
  onEdit?: () => void
}

// ================= MAPPING DES STATUTS =================
const mapStatusToConfig = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Planifie': 'pending',
    'Planifié': 'pending',
    'EnCours': 'in-progress',
    'En cours': 'in-progress',
    'Termine': 'completed',
    'Terminé': 'completed',
    'Annule': 'cancelled',
    'Annulé': 'cancelled',
    'EnRetard': 'delayed',
    'En retard': 'delayed',
    'À démarrer': 'pending',
    'AFaire': 'pending',
    'À faire': 'pending',
    'Terminee': 'completed',
    'En attente': 'pending',
    'En test': 'to-test',
    'Validee': 'validated',
    'Validée': 'validated',
    'Validé': 'validated',
    'Rejeté': 'rejected',
    'Paused': 'paused',
    'En pause': 'paused',
  }
  return statusMap[status] || 'pending'
}

// ================= MAPPING DES DONNÉES API =================
const mapApiProjectToProjet = (apiProject: any): Projet => {
  console.log('=== MAPPING DES DONNÉES API ===')
  
  return {
    id: apiProject.id,
    nom: apiProject.nom,
    description: apiProject.description || '',
    lieu: apiProject.lieu,
    dateDebut: apiProject.dateDebut,
    dateFinPrevue: apiProject.dateFinPrevue,
    dateFinReelle: apiProject.dateFinReelle,
    budgetEstime: apiProject.budgetEstime || 0,
    budgetReel: apiProject.budgetReel,
    typeProjet: apiProject.typeProjet || 'Non spécifié',
    statut: apiProject.statut || 'Planifié',
    client: apiProject.client,
    groupeEquipe: apiProject.groupeEquipe ? {
      id: apiProject.groupeEquipe.id,
      nom: apiProject.groupeEquipe.nom || 'Équipe non nommée',
      typeProjetCompatible: apiProject.groupeEquipe.typeProjetCompatible || '',
      employes: apiProject.groupeEquipe.employes?.map((emp: any) => ({
        id: emp.id,
        nomComplet: emp.nomComplet || emp.nom || 'Inconnu',
        role: emp.role || 'Employé',
        email: emp.email,
        phone: emp.phone,
        specialites: emp.specialites || [],
      })) || []
    } : undefined,
    phases: apiProject.phases?.map((phase: any) => ({
      id: phase.id,
      typePhase: phase.typePhase,
      statut: phase.statut || 'pending',
      dateDebut: phase.dateDebut,
      dateFin: phase.dateFin,
      taches: phase.taches?.map((task: any) => ({
        id: task.id,
        titre: task.titre,
        description: task.description,
        statut: task.statut || 'pending',
        priorite: task.priorite || 'Moyenne',
        chargeEstimee: task.chargeEstimee,
        chargeReelle: task.chargeReelle,
        dateDebutPrevue: task.dateDebutPrevue,
        dateFinPrevue: task.dateFinPrevue,
        responsable: task.responsable,
        testeur: task.testeur,
        commentaires: task.commentaires,
        sousTaches: task.sousTaches?.map((subTask: any) => ({
          id: subTask.id,
          titre: subTask.titre,
          statut: subTask.statut || 'pending',
          dureeEstimeeHeures: subTask.dureeEstimeeHeures,
          dureeReelleHeures: subTask.dureeReelleHeures,
        })) || []
      })) || []
    })) || []
  }
}

// ================= UTILITAIRES =================
const formatDate = (s: string) => {
  if (!s) return 'N/A'
  try {
    return new Date(s).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return 'Date invalide'
  }
}

const formatCurrency = (n: number) => (n || 0).toLocaleString('fr-FR') + ' DH'
const formatHours = (h: number) => `${h || 0}h`

const getPrioriteColor = (priorite?: string) => {
  switch (priorite) {
    case 'Critique': return 'bg-red-100 text-red-800 border-red-200'
    case 'Haute': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Moyenne': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Basse': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// ================= CONFIGURATION DES STATUTS UI =================
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  completed: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'Terminé' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700', icon: Play, label: 'En cours' },
  pending: { bg: 'bg-gray-50', text: 'text-gray-700', icon: Clock3, label: 'En attente' },
  'to-test': { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Bug, label: 'À tester' },
  validated: { bg: 'bg-purple-50', text: 'text-purple-700', icon: CheckCircle2, label: 'Validé' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: X, label: 'Rejeté' },
  delayed: { bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertCircle, label: 'En retard' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: X, label: 'Annulé' },
  paused: { bg: 'bg-gray-50', text: 'text-gray-700', icon: Pause, label: 'En pause' },
}

const PROJECT_TYPE_ICONS: Record<string, React.ElementType> = {
  'Développement Mobile': Smartphone,
  'Développement Web': Code,
  'Design UI/UX': PenTool,
  'Consulting': Briefcase,
}

// ================= COMPOSANTS UI =================
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const mappedStatus = mapStatusToConfig(status)
  const c = STATUS_CONFIG[mappedStatus] || STATUS_CONFIG.pending
  const Icon = c.icon
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${c.bg} ${c.text}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {c.label}
    </span>
  )
}

const ProgressBar: React.FC<{ progress: number; size?: 'sm' | 'md'; showValue?: boolean }> = 
({ progress, size = 'md', showValue = false }) => (
  <div className="flex items-center gap-3">
    {showValue && <span className="text-sm font-medium text-[#1d1d1b]">{Math.round(progress)}%</span>}
    <div className={`flex-1 bg-gray-100 rounded-full ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
      <div className="bg-[#ef7c21] rounded-full h-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
    </div>
  </div>
)

// ================= MODAL DES TÂCHES D'UN MEMBRE =================
const MemberTasksModal: React.FC<{
  member: Employe
  tasks: Tache[]
  phases: Phase[]
  onClose: () => void
}> = ({ member, tasks, phases, onClose }) => {
  const [selectedTask, setSelectedTask] = useState<Tache | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrer les tâches où le membre est responsable OU testeur
  const memberTasks = tasks.filter(task => {
    const isResponsable = task.responsable?.id === member.id
    const isTesteur = task.testeur?.id === member.id
    return isResponsable || isTesteur
  })

  // Ajouter le nom de la phase à chaque tâche
  const tasksWithPhase = memberTasks.map(task => {
    const phase = phases.find(p => p.taches?.some(t => t.id === task.id))
    return { ...task, phaseName: phase?.typePhase || 'Non assigné' }
  })

  // Appliquer les filtres
  const filteredTasks = tasksWithPhase.filter(task => {
    if (filterStatus !== 'all' && mapStatusToConfig(task.statut || '') !== filterStatus) return false
    if (searchTerm && !task.titre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Statistiques
  const stats = {
    total: memberTasks.length,
    inProgress: memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'in-progress').length,
    completed: memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'completed').length,
    toTest: memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'to-test').length,
    delayed: memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'delayed').length,
  }

  const totalEstimatedHours = memberTasks.reduce((sum, t) => sum + (t.chargeEstimee || 0), 0)
  const totalActualHours = memberTasks.reduce((sum, t) => sum + (t.chargeReelle || 0), 0)
  const progress = totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="bg-gradient-to-r from-[#ef7c21]/5 to-white p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] font-bold text-2xl">
                  {member.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1b]">{member.nomComplet}</h3>
                  <p className="text-gray-500">{member.role || 'Employé'}</p>
                  {member.email && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>


          
          </div>

          {/* Liste des tâches */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-[#1d1d1b]">{task.titre}</h4>
                            
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Phase: {task.phaseName}
                            </span>
                            {task.dateFinPrevue && (
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(task.dateFinPrevue)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.statut || 'pending'} size="sm" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.responsable?.id === member.id 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-purple-50 text-purple-600'
                          }`}>
                            {task.responsable?.id === member.id ? 'Responsable' : 'Testeur'}
                          </span>
                        </div>
                      </div>

                      {/* Sous-tâches */}
                      {task.sousTaches && task.sousTaches.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <ListTodo className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600">
                              {task.sousTaches.length} sous-tâche(s)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {task.sousTaches.slice(0, 3).map((st) => (
                              <span key={st.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                {st.titre}
                              </span>
                            ))}
                            {task.sousTaches.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                +{task.sousTaches.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune tâche trouvée</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal détails tâche */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          phases={phases}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  )
}

// ================= MODAL DÉTAILS TÂCHE =================
const TaskDetailModal: React.FC<{
  task: Tache
  phases: Phase[]
  onClose: () => void
}> = ({ task, phases, onClose }) => {
  const phase = phases.find(p => p.taches?.some(t => t.id === task.id))

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#ef7c21]/10 to-white p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-xl font-bold text-[#1d1d1b]">{task.titre}</h3>
                <StatusBadge status={task.statut || 'pending'} />
                
              </div>
              {phase && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  Phase: {phase.typePhase}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {task.description && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {task.responsable && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Responsable</p>
                <p className="font-medium">{task.responsable.nomComplet}</p>
              </div>
            )}
            {task.testeur && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Testeur</p>
                <p className="font-medium">{task.testeur.nomComplet}</p>
              </div>
            )}
          </div>

          {(task.dateDebutPrevue || task.dateFinPrevue) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {task.dateDebutPrevue && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Début:</span>
                  <span className="font-medium">{formatDate(task.dateDebutPrevue)}</span>
                </div>
              )}
              {task.dateFinPrevue && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Fin:</span>
                  <span className="font-medium">{formatDate(task.dateFinPrevue)}</span>
                </div>
              )}
            </div>
          )}

          {(task.chargeEstimee || task.chargeReelle) && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Charge</h4>
              <div className="flex gap-4">
                {task.chargeEstimee && (
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Estimée</p>
                    <p className="text-lg font-semibold">{formatHours(task.chargeEstimee)}</p>
                  </div>
                )}
                {task.chargeReelle && (
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Réelle</p>
                    <p className="text-lg font-semibold">{formatHours(task.chargeReelle)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {task.sousTaches && task.sousTaches.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Sous-tâches ({task.sousTaches.length})
              </h4>
              <div className="space-y-2">
                {task.sousTaches.map((st) => (
                  <div key={st.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-sm">{st.titre}</span>
                      {st.dureeEstimeeHeures && (
                        <span className="text-xs text-gray-500 ml-2">({formatHours(st.dureeEstimeeHeures)})</span>
                      )}
                    </div>
                    <StatusBadge status={st.statut} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ================= COMPOSANT ÉQUIPE =================
const TeamView: React.FC<{
  members: Employe[]
  tasks: Tache[]
  phases: Phase[]
}> = ({ members, tasks, phases }) => {
  const [selectedMember, setSelectedMember] = useState<Employe | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const memberTasks = tasks.filter(t => 
            t.responsable?.id === member.id || t.testeur?.id === member.id
          )
          const inProgress = memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'in-progress').length
          const completed = memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'completed').length

          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#ef7c21]/50 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ef7c21]/10 to-[#ef7c21]/5 flex items-center justify-center text-[#ef7c21] font-bold text-lg">
                  {member.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                {memberTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef7c21] text-white text-xs rounded-full flex items-center justify-center">
                    {memberTasks.length}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold group-hover:text-[#ef7c21] transition-colors">
                    {member.nomComplet}
                  </h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-lg">
                    {member.role}
                  </span>
                </div>

                {member.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <ListTodo className="h-3.5 w-3.5" />
                    {memberTasks.length} tâches
                  </span>
                  {inProgress > 0 && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Play className="h-3.5 w-3.5" />
                      {inProgress}
                    </span>
                  )}
                  {completed > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {completed}
                    </span>
                  )}
                </div>

                {memberTasks.length > 0 && (
                  <div className="mt-2">
                    <ProgressBar progress={(completed / memberTasks.length) * 100} size="sm" />
                  </div>
                )}

                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-[#ef7c21] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Voir les tâches
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedMember && (
        <MemberTasksModal
          member={selectedMember}
          tasks={tasks}
          phases={phases}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  )
}

// ================= COMPOSANT PRINCIPAL =================
export function ProjectDetailView({ project: propProject, onBack, projectId, onEdit }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Projet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'timeline' | 'tasks' | 'team'>('general')

  useEffect(() => {
    const loadProject = async () => {
      if (propProject) {
        setProject(mapApiProjectToProjet(propProject))
        setLoading(false)
      } else if (projectId) {
        try {
          setLoading(true)
          const data = await getProjetById(projectId)
          setProject(mapApiProjectToProjet(data))
        } catch (err) {
          console.error('Erreur:', err)
          setError('Impossible de charger le projet')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    loadProject()
  }, [propProject, projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ef7c21] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error || 'Projet non trouvé'}</p>
        <Button onClick={onBack} variant="outline">Retour</Button>
      </div>
    )
  }

  const allTasks = project.phases.flatMap(p => p.taches || [])
  const daysRemaining = Math.ceil((new Date(project.dateFinPrevue).getTime() - Date.now()) / 86400000)
 const progress = project.phases.length > 0 
  ? Math.round(
      project.phases.reduce((sum, p) => {
        const status = mapStatusToConfig(p.statut || '')
        return sum + (
          status === 'completed' ? 100 :
          status === 'in-progress' ? 50 :
          0
        )
      }, 0) / project.phases.length
    )
  : 0
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Projets / <span className="text-[#1d1d1b] font-medium">{project.nom}</span>
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1d1d1b]">{project.nom}</h1>
              <StatusBadge status={project.statut} />
            </div>
          </div>
        </div>
        <Button onClick={onEdit} className="bg-[#ef7c21] hover:bg-[#d95f00] text-white">
          <Edit2 className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Progression</p>
              <p className="text-2xl font-bold">{progress}%</p>
              <p className="text-xs text-gray-500 mt-1">{project.phases.length} phases</p>
            </div>
            <Target className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-2xl font-bold">{project.budgetReel }</p>
              <p className="text-xs text-gray-500">Estimé: {formatCurrency(project.budgetEstime)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Jours restants</p>
              <p className="text-2xl font-bold">{Math.max(0, daysRemaining)}</p>
              <p className="text-xs text-gray-500">Échéance: {formatDate(project.dateFinPrevue)}</p>
            </div>
            <Timer className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Équipe</p>
              <p className="text-2xl font-bold">{project.groupeEquipe?.employes?.length || 0}</p>
              <p className="text-xs text-gray-500">{project.groupeEquipe?.nom || 'Non assignée'}</p>
            </div>
            <Users className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'general', label: 'Général', icon: Info },
            { id: 'timeline', label: 'Timeline', icon: CalendarDays },
            { id: 'tasks', label: 'Tâches', icon: ListTodo },
            { id: 'team', label: 'Équipe', icon: Users2 },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all ${
                  isActive 
                    ? 'border-b-2 border-[#ef7c21] text-[#ef7c21]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'general' && (
        <GeneralInfoView project={project} />
      )}

      {activeTab === 'timeline' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Timeline du projet</h3>
          <TimelineView phases={project.phases} />
        </Card>
      )}

      {activeTab === 'tasks' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Tâches par phase</h3>
          <TasksByPhaseView phases={project.phases} />
        </Card>
      )}

      {activeTab === 'team' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Équipe projet</h3>
          <TeamView 
            members={project.groupeEquipe?.employes || []} 
            tasks={allTasks}
            phases={project.phases}
          />
        </Card>
      )}
    </div>
  )
}

// ================= COMPOSANTS SECONDAIRES =================
const GeneralInfoView: React.FC<{ project: Projet }> = ({ project }) => {
  const ProjectIcon = PROJECT_TYPE_ICONS[project.typeProjet] || Briefcase
  const totalTasks = project.phases.reduce((sum, p) => sum + (p.taches?.length || 0), 0)
  const completedTasks = project.phases.reduce((sum, p) => 
    sum + (p.taches?.filter(t => mapStatusToConfig(t.statut || '') === 'completed').length || 0), 0)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-4">
          <ProjectIcon className="h-10 w-10 text-[#ef7c21]" />
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{project.description || 'Aucune description'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[#ef7c21]" />
            <h3 className="font-semibold">Dates</h3>
          </div>
          <p className="text-sm"><span className="text-gray-500">Début:</span> {formatDate(project.dateDebut)}</p>
          <p className="text-sm mt-1"><span className="text-gray-500">Fin prévue:</span> {formatDate(project.dateFinPrevue)}</p>
          {project.dateFinReelle && (
            <p className="text-sm mt-1"><span className="text-gray-500">Fin réelle:</span> {formatDate(project.dateFinReelle)}</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[#ef7c21]" />
            <h3 className="font-semibold">Localisation</h3>
          </div>
          <p className="text-sm">{project.lieu || 'Non spécifié'}</p>
          {project.client && (
            <p className="text-sm mt-2 text-gray-600">Client: {project.client.nom}</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#ef7c21]" />
            <h3 className="font-semibold">Équipe</h3>
          </div>
          <p className="text-sm font-medium">{project.groupeEquipe?.nom || 'Non assignée'}</p>
          <p className="text-sm text-gray-500">{project.groupeEquipe?.employes?.length || 0} membres</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Budget</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Estimé:</span>
              <span className="font-medium">{formatCurrency(project.budgetEstime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Réel:</span>
              <span className="font-medium">{formatCurrency(project.budgetReel || 0)}</span>
            </div>
            {project.budgetEstime > 0 && (
              <ProgressBar 
                progress={((project.budgetReel || 0) / project.budgetEstime) * 100} 
                size="md" 
                showValue 
              />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Progression</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Phases:</span>
              <span className="font-medium">{project.phases.filter(p => p.statut === 'Terminée').length}/{project.phases.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tâches:</span>
              <span className="font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            {totalTasks > 0 && (
              <ProgressBar progress={(completedTasks / totalTasks) * 100} size="md" showValue />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

const TimelineView: React.FC<{ phases: Phase[] }> = ({ phases }) => (
  <div className="space-y-6">
    {phases.map((phase, idx) => (
      <div key={phase.id} className="relative pl-8">
        {idx < phases.length - 1 && (
          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
        )}
        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#ef7c21] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{phase.typePhase}</h4>
            <StatusBadge status={phase.statut} size="sm" />
          </div>
          <div className="space-y-2">
            {phase.taches?.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span>{task.titre}</span>
                <StatusBadge status={task.statut || 'pending'} size="sm" />
              </div>
            ))}
            {(phase.taches?.length || 0) > 3 && (
              <p className="text-xs text-gray-500 text-center">
                + {(phase.taches?.length || 0) - 3} autres tâches
              </p>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
)

const TasksByPhaseView: React.FC<{ phases: Phase[] }> = ({ phases }) => {
  const [expandedPhases, setExpandedPhases] = useState<number[]>([])

  const togglePhase = (id: number) => {
    setExpandedPhases(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  return (
    <div className="space-y-4">
      {phases.map(phase => {
        const phaseTasks = phase.taches || []
        if (phaseTasks.length === 0) return null

        const completed = phaseTasks.filter(t => mapStatusToConfig(t.statut || '') === 'completed').length
        const progress = (completed / phaseTasks.length) * 100

        return (
          <div key={phase.id} className="border rounded-xl overflow-hidden">
            <div
              className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedPhases.includes(phase.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">{phase.typePhase}</h4>
                    <p className="text-xs text-gray-500">{phaseTasks.length} tâches • {completed} terminées</p>
                  </div>
                </div>
                <div className="w-32">
                  <ProgressBar progress={progress} size="sm" showValue />
                </div>
              </div>
            </div>
            {expandedPhases.includes(phase.id) && (
              <div className="p-4 space-y-3 border-t">
                {phaseTasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{task.titre}</p>
                        {task.responsable && (
                          <p className="text-xs text-gray-500 mt-1">
                            Responsable: {task.responsable.nomComplet}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={task.statut || 'pending'} />
                    </div>
                    {task.sousTaches && task.sousTaches.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">{task.sousTaches.length} sous-tâches</p>
                        <div className="flex flex-wrap gap-1">
                          {task.sousTaches.slice(0, 3).map(st => (
                            <span key={st.id} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                              {st.titre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProjectDetailView