import React, { useEffect, useState, useCallback } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { EditProjectView } from './EditProjectView'
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
  FileText,
  Download,
  Trash2,
} from 'lucide-react'

import { getProjetById } from '../services/projectService'
import { 
  checkCdcExists, 
  downloadCdcFile, 
  deleteCdcFile 
} from '../services/projectService'

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
  responsable?: { id: number; nomComplet: string; email?: string; role?: string }
  testeur?: { id: number; nomComplet: string; email?: string; role?: string }
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

// ================= MAPPING STATUTS =================
const mapStatusToConfig = (status: string): string => {
  const m: Record<string, string> = {
    Planifie: 'pending', 'Planifié': 'pending',
    EnCours: 'in-progress', 'En cours': 'in-progress',
    Termine: 'completed', 'Terminé': 'completed', Terminee: 'completed', 'Terminée': 'completed',
    Annule: 'cancelled', 'Annulé': 'cancelled',
    EnRetard: 'delayed', 'En retard': 'delayed',
    'À démarrer': 'pending', AFaire: 'pending', 'À faire': 'pending', 'En attente': 'pending',
    'En test': 'to-test',
    Validee: 'validated', 'Validée': 'validated', 'Validé': 'validated',
    'Rejeté': 'rejected', Rejetee: 'rejected',
    Paused: 'paused', 'En pause': 'paused',
    ADemarrer: 'pending',
  }
  return m[status] || 'pending'
}

// ================= PROGRESSION =================
const isPhaseCompleted = (p: Phase) => {
  const s = p.statut?.toLowerCase()
  return s === 'termine' || s === 'terminé' || s === 'terminee' || s === 'terminée'
}
const isTaskCompleted = (t: Tache) => {
  const s = t.statut?.toLowerCase()
  return s === 'termine' || s === 'terminé' || s === 'terminee' || s === 'terminée' || s === 'validee' || s === 'validée'
}
const isSubTaskValidated = (st: SousTache) => {
  const s = st.statut?.toLowerCase()
  return s === 'validee' || s === 'validée'
}

const calculateProjectStats = (phases: Phase[]) => {
  let totalTasks = 0, completedTasks = 0, totalSubTasks = 0, validatedSubTasks = 0
  phases.forEach(phase => {
    phase.taches?.forEach(task => {
      totalTasks++
      if (isTaskCompleted(task)) completedTasks++
      task.sousTaches?.forEach(st => {
        totalSubTasks++
        if (isSubTaskValidated(st)) validatedSubTasks++
      })
    })
  })
  return {
    totalPhases: phases.length,
    completedPhases: phases.filter(isPhaseCompleted).length,
    phasesProgress: phases.length > 0 ? Math.round((phases.filter(isPhaseCompleted).length / phases.length) * 100) : 0,
    totalTasks, completedTasks,
    tasksProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalSubTasks, validatedSubTasks,
    subTasksProgress: totalSubTasks > 0 ? Math.round((validatedSubTasks / totalSubTasks) * 100) : 0,
  }
}

// ================= MAPPING API =================
const mapApiProjectToProjet = (d: any): Projet => ({
  id: d.id, 
  nom: d.nom, 
  description: d.description || '',
  lieu: d.lieu, 
  dateDebut: d.dateDebut, 
  dateFinPrevue: d.dateFinPrevue,
  dateFinReelle: d.dateFinReelle,
  budgetEstime: d.budgetEstime || 0, 
  budgetReel: d.budgetReel || 0,
  typeProjet: d.typeProjet || 'Non spécifié',
  statut: d.statut || 'Planifié',
  client: d.client,
  groupeEquipe: d.groupeEquipe ? {
    id: d.groupeEquipe.id,
    nom: d.groupeEquipe.nom || 'Équipe',
    typeProjetCompatible: d.groupeEquipe.typeProjetCompatible || '',
    employes: d.groupeEquipe.employes?.map((e: any) => ({
      id: e.id, 
      nomComplet: e.nomComplet || e.nom || 'Inconnu',
      role: e.role || 'Employé', 
      email: e.email, 
      phone: e.phone,
      specialites: e.specialites || [],
    })) || [],
  } : undefined,
  phases: d.phases?.map((phase: any) => ({
    id: phase.id, 
    typePhase: phase.typePhase,
    statut: phase.statut || 'pending',
    dateDebut: phase.dateDebut,
    dateFin: phase.dateFin,
    taches: phase.taches?.map((t: any) => ({
      id: t.id, 
      titre: t.titre, 
      description: t.description,
      statut: t.statut || 'pending',
      chargeEstimee: t.chargeEstimee, 
      chargeReelle: t.chargeReelle,
      dateDebutPrevue: t.dateDebutPrevue, 
      dateFinPrevue: t.dateFinPrevue,
      responsable: t.responsable, 
      testeur: t.testeur, 
      commentaires: t.commentaires,
      sousTaches: t.sousTaches?.map((st: any) => ({
        id: st.id, 
        titre: st.titre, 
        statut: st.statut || 'pending',
        dureeEstimeeHeures: st.dureeEstimeeHeures, 
        dureeReelleHeures: st.dureeReelleHeures,
        dateDebut: st.dateDebut,
        dateFin: st.dateFin,
      })) || [],
    })) || [],
  })) || [],
})

// ================= UTILITAIRES =================
const formatDate = (s: string) => {
  if (!s) return 'N/A'
  try { 
    return new Date(s).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) 
  } catch { 
    return 'Date invalide' 
  }
}

const formatCurrency = (n: number) => (n || 0).toLocaleString('fr-FR') 

// ================= CONFIGURATION UI =================
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  completed:     { bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle,  label: 'Terminé' },
  'in-progress': { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: Play,         label: 'En cours' },
  pending:       { bg: 'bg-gray-50',   text: 'text-gray-700',   icon: Clock3,       label: 'En attente' },
  'to-test':     { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Bug,          label: 'À tester' },
  validated:     { bg: 'bg-purple-50', text: 'text-purple-700', icon: CheckCircle2, label: 'Validé' },
  rejected:      { bg: 'bg-red-50',    text: 'text-red-700',    icon: X,            label: 'Rejeté' },
  delayed:       { bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertCircle,  label: 'En retard' },
  cancelled:     { bg: 'bg-red-50',    text: 'text-red-700',    icon: X,            label: 'Annulé' },
  paused:        { bg: 'bg-gray-50',   text: 'text-gray-700',   icon: Pause,        label: 'En pause' },
}

const PROJECT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  'Développement Mobile': { icon: Smartphone, color: 'text-[#ef7c21]', bg: 'bg-orange-50', label: 'Mobile' },
  'Développement Web':    { icon: Code,        color: 'text-[#ef7c21]', bg: 'bg-orange-50', label: 'Web' },
  'Design UI/UX':         { icon: PenTool,     color: 'text-[#ef7c21]', bg: 'bg-orange-50', label: 'Design' },
  'Consulting':           { icon: Briefcase,   color: 'text-[#ef7c21]', bg: 'bg-orange-50', label: 'Conseil' },
  'IT':                   { icon: Code,        color: 'text-[#ef7c21]', bg: 'bg-orange-50', label: 'IT' },
}

const getProjectTypeConfig = (type: string) =>
  PROJECT_TYPE_CONFIG[type] ?? { icon: Briefcase, color: 'text-[#ef7c21]', bg: 'bg-orange-50', label: type }

// ================= COMPOSANTS UI =================
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const c = STATUS_CONFIG[mapStatusToConfig(status)] || STATUS_CONFIG.pending
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
    } ${c.bg} ${c.text}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {c.label}
    </span>
  )
}

const ProgressBar: React.FC<{ progress: number; size?: 'sm' | 'md'; showValue?: boolean }> = ({ 
  progress, size = 'md', showValue = false 
}) => (
  <div className="flex items-center gap-3">
    {showValue && <span className="text-sm font-medium text-[#1d1d1b]">{Math.round(progress)}%</span>}
    <div className={`flex-1 bg-gray-100 rounded-full ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
      <div className="bg-[#ef7c21] rounded-full h-full transition-all duration-500" 
           style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
    </div>
  </div>
)

// ================= MODALS =================
const MemberTasksModal: React.FC<{ 
  member: Employe; 
  tasks: Tache[]; 
  phases: Phase[]; 
  onClose: () => void 
}> = ({ member, tasks, phases, onClose }) => {
  const [selectedTask, setSelectedTask] = useState<Tache | null>(null)

  const memberTasks = tasks.filter(t => t.responsable?.id === member.id || t.testeur?.id === member.id)
  const tasksWithPhase = memberTasks.map(task => ({
    ...task,
    phaseName: phases.find(p => p.taches?.some(t => t.id === task.id))?.typePhase || 'Non assigné',
  }))

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-[#ef7c21]/5 to-white p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] font-bold text-2xl">
                  {member.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1b]">{member.nomComplet}</h3>
                  <p className="text-gray-500">{member.role || 'Employé'}</p>
                  {member.email && <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{member.email}</p>}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {tasksWithPhase.length > 0 ? (
              <div className="space-y-3">
                {tasksWithPhase.map(task => (
                  <div key={task.id} onClick={() => setSelectedTask(task)} className="border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#1d1d1b]">{task.titre}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Activity className="h-3 w-3" />Phase: {task.phaseName}</span>
                          {task.dateFinPrevue && <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{formatDate(task.dateFinPrevue)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.statut || 'pending'} size="sm" />
                        <span className={`text-xs px-2 py-1 rounded-full ${task.responsable?.id === member.id ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {task.responsable?.id === member.id ? 'Responsable' : 'Testeur'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune tâche assignée</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedTask && <TaskDetailModal task={selectedTask} phases={phases} onClose={() => setSelectedTask(null)} />}
    </>
  )
}

const TaskDetailModal: React.FC<{ task: Tache; phases: Phase[]; onClose: () => void }> = ({ task, phases, onClose }) => {
  const phase = phases.find(p => p.taches?.some(t => t.id === task.id))
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#ef7c21]/10 to-white p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-xl font-bold text-[#1d1d1b]">{task.titre}</h3>
                <StatusBadge status={task.statut || 'pending'} />
              </div>
              {phase && <p className="text-sm text-gray-500 flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Phase: {phase.typePhase}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5 text-gray-500" /></button>
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
          {task.sousTaches && task.sousTaches.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ListTodo className="h-4 w-4" />Sous-tâches ({task.sousTaches.length})
              </h4>
              <div className="space-y-2">
                {task.sousTaches.map(st => (
                  <div key={st.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-sm">{st.titre}</span>
                      {st.dureeEstimeeHeures && <span className="text-xs text-gray-500 ml-2">({st.dureeEstimeeHeures}h)</span>}
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

// ================= TEAM VIEW =================
const TeamView: React.FC<{ members: Employe[]; tasks: Tache[]; phases: Phase[] }> = ({ members, tasks, phases }) => {
  const [selectedMember, setSelectedMember] = useState<Employe | null>(null)
  
  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune équipe assignée à ce projet</p>
      </div>
    )
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(member => {
          const memberTasks = tasks.filter(t => t.responsable?.id === member.id || t.testeur?.id === member.id)
          const inProgress = memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'in-progress').length
          const completed = memberTasks.filter(t => mapStatusToConfig(t.statut || '') === 'completed').length
          return (
            <div key={member.id} onClick={() => setSelectedMember(member)}
                 className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#ef7c21]/50 hover:shadow-lg transition-all cursor-pointer group">
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
                  <h4 className="font-semibold group-hover:text-[#ef7c21] transition-colors">{member.nomComplet}</h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-lg">{member.role}</span>
                </div>
                {member.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Mail className="h-3 w-3" />{member.email}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <ListTodo className="h-3.5 w-3.5" />{memberTasks.length} tâches
                  </span>
                  {inProgress > 0 && <span className="flex items-center gap-1 text-blue-600"><Play className="h-3.5 w-3.5" />{inProgress}</span>}
                  {completed > 0 && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3.5 w-3.5" />{completed}</span>}
                </div>
                {memberTasks.length > 0 && <div className="mt-2"><ProgressBar progress={(completed / memberTasks.length) * 100} size="sm" /></div>}
              </div>
            </div>
          )
        })}
      </div>
      {selectedMember && <MemberTasksModal member={selectedMember} tasks={tasks} phases={phases} onClose={() => setSelectedMember(null)} />}
    </>
  )
}

// ================= CDC VIEW (Version améliorée pour localhost) =================
const CdcView: React.FC<{ projectId: number }> = ({ projectId }) => {
  const [cdcExists, setCdcExists] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [isPdf, setIsPdf] = useState<boolean>(true)
  const [fileName, setFileName] = useState<string>('Cahier_des_charges')
  const [downloadUrl, setDownloadUrl] = useState<string>('')

  useEffect(() => {
    const checkCdc = async () => {
      try {
        const exists = await checkCdcExists(projectId)
        setCdcExists(exists)
        
        if (exists) {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5101'
          const url = `${baseUrl}/api/Projets/${projectId}/cdc/download`
          setDownloadUrl(url)
          
          // Essayer de détecter le type de fichier via l'en-tête Content-Type
          try {
            const response = await fetch(url, {
              method: 'HEAD',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const contentType = response.headers.get('content-type') || ''
            const isPdfFile = contentType.includes('pdf')
            setIsPdf(isPdfFile)
            
            // Extraire le nom du fichier
            const contentDisposition = response.headers.get('content-disposition')
            if (contentDisposition) {
              const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
              if (match && match[1]) {
                setFileName(match[1].replace(/['"]/g, ''))
              }
            }
          } catch (err) {
            console.error('Erreur détection type fichier:', err)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    checkCdc()
  }, [projectId])

  const handleDownload = async () => {
    try {
      await downloadCdcFile(projectId)
    } catch (err) {
      alert("Erreur lors du téléchargement")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Supprimer le cahier des charges ?")) return
    try {
      await deleteCdcFile(projectId)
      setCdcExists(false)
      alert("Cahier des charges supprimé avec succès")
    } catch (err) {
      alert("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ef7c21]" />
      </div>
    )
  }

  if (!cdcExists) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucun cahier des charges disponible pour ce projet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <FileText className="h-7 w-7 text-[#ef7c21]" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">{fileName}</h3>
            <p className="text-sm text-gray-500">
              {isPdf ? 'Document PDF' : 'Document Word (.docx)'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleDownload} 
            className="bg-[#ef7c21] hover:bg-[#d95f00] flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Télécharger
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="outline" 
            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      </div>

      {/* Zone d'aperçu pour PDF uniquement */}
      {isPdf && (
        <Card className="overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
            <span className="font-medium">Aperçu du Cahier des Charges</span>
          </div>
          <iframe
            src={downloadUrl}
            style={{ height: '70vh', width: '100%', border: 'none' }}
            title="Aperçu CDC"
          />
        </Card>
      )}

      {/* Message pour les fichiers Word */}
      {!isPdf && (
        <Card className="p-8 text-center bg-gray-50">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aperçu non disponible pour les documents Word</p>
          <p className="text-sm text-gray-500 mb-4">Téléchargez le fichier pour voir son contenu</p>
          <Button 
            onClick={handleDownload}
            className="bg-[#ef7c21] hover:bg-[#d95f00] flex items-center gap-2 mx-auto"
          >
            <Download className="h-4 w-4" /> Télécharger le document
          </Button>
        </Card>
      )}
    </div>
  )
}
// ================= VIEWS =================
const GeneralInfoView: React.FC<{ project: Projet; stats: any }> = ({ project, stats }) => {
  const typeConfig = getProjectTypeConfig(project.typeProjet)
  const TypeIcon = typeConfig.icon
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
            <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
          </div>
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
          <p className="text-sm"><span className="text-gray-500">Début :</span> {formatDate(project.dateDebut)}</p>
          <p className="text-sm mt-1"><span className="text-gray-500">Fin prévue :</span> {formatDate(project.dateFinPrevue)}</p>
          {project.dateFinReelle && <p className="text-sm mt-1"><span className="text-gray-500">Fin réelle :</span> {formatDate(project.dateFinReelle)}</p>}
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[#ef7c21]" />
            <h3 className="font-semibold">Localisation</h3>
          </div>
          <p className="text-sm">{project.lieu || 'Non spécifié'}</p>
          {project.client && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700">Client</p>
              <p className="text-sm text-gray-600">{project.client.nom}</p>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-[#ef7c21]" />
            <h3 className="font-semibold">Type de projet</h3>
          </div>
          <p className="text-lg font-semibold text-[#ef7c21]">{project.typeProjet}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Budget</h3>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-gray-600">Estimé :</span><span className="font-medium">{formatCurrency(project.budgetEstime)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Réel :</span><span className="font-medium">{formatCurrency(project.budgetReel || 0)}</span></div>
            {project.budgetEstime > 0 && <ProgressBar progress={((project.budgetReel || 0) / project.budgetEstime) * 100} size="md" showValue />}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Progression détaillée</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1"><span className="text-gray-600">Tâches :</span><span className="font-medium">{stats.completedTasks}/{stats.totalTasks}</span></div>
              <ProgressBar progress={stats.tasksProgress} size="md" showValue />
            </div>
            {stats.totalSubTasks > 0 && (
              <div>
                <div className="flex justify-between mb-1"><span className="text-gray-600">Sous-tâches :</span><span className="font-medium">{stats.validatedSubTasks}/{stats.totalSubTasks}</span></div>
                <ProgressBar progress={stats.subTasksProgress} size="md" showValue />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

const TimelineView: React.FC<{ phases: Phase[] }> = ({ phases }) => {
  if (phases.length === 0) {
    return <div className="text-center py-12 bg-gray-50 rounded-xl"><CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Aucune phase définie</p></div>
  }
  return (
    <div className="space-y-6">
      {phases.map((phase, idx) => (
        <div key={phase.id} className="relative pl-8">
          {idx < phases.length - 1 && <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />}
          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${isPhaseCompleted(phase) ? 'bg-green-500' : phase.statut === 'EnCours' ? 'bg-blue-500' : 'bg-gray-400'}`}>
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
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const TasksByPhaseView: React.FC<{ phases: Phase[] }> = ({ phases }) => {
  const [expandedPhases, setExpandedPhases] = useState<number[]>([])
  const toggle = (id: number) => setExpandedPhases(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const phasesWithTasks = phases.filter(p => p.taches && p.taches.length > 0)

  if (phasesWithTasks.length === 0) {
    return <div className="text-center py-12 bg-gray-50 rounded-xl"><ListTodo className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Aucune tâche définie</p></div>
  }

  return (
    <div className="space-y-4">
      {phasesWithTasks.map(phase => {
        const phaseTasks = phase.taches || []
        const completed = phaseTasks.filter(isTaskCompleted).length
        const progress = phaseTasks.length > 0 ? (completed / phaseTasks.length) * 100 : 0

        return (
          <div key={phase.id} className="border rounded-xl overflow-hidden">
            <div className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggle(phase.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedPhases.includes(phase.id) ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                  <div>
                    <h4 className="font-semibold">{phase.typePhase}</h4>
                    <p className="text-xs text-gray-500">{phaseTasks.length} tâches • {completed} terminées</p>
                  </div>
                </div>
                <div className="w-32"><ProgressBar progress={progress} size="sm" showValue /></div>
              </div>
            </div>
            
            {expandedPhases.includes(phase.id) && (
              <div className="p-4 space-y-3 border-t">
                {phaseTasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{task.titre}</p>
                        {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                      </div>
                      <StatusBadge status={task.statut || 'pending'} />
                    </div>
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

// ================= COMPOSANT PRINCIPAL =================
export function ProjectDetailView({ project: propProject, onBack, projectId, onEdit }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Projet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'timeline' | 'tasks' | 'team' | 'cdc'>('general')
  const [isEditing, setIsEditing] = useState(false)

  const reloadProject = useCallback(async () => {
    try {
      if (propProject) {
        setProject(mapApiProjectToProjet(propProject))
      } else if (projectId) {
        const data = await getProjetById(projectId)
        setProject(mapApiProjectToProjet(data))
      }
    } catch (err) {
      console.error('Erreur rechargement:', err)
    }
  }, [projectId, propProject])

  useEffect(() => {
    const load = async () => {
      if (propProject) {
        setProject(mapApiProjectToProjet(propProject))
        setLoading(false)
        return
      }
      if (projectId) {
        try {
          setLoading(true)
          const data = await getProjetById(projectId)
          setProject(mapApiProjectToProjet(data))
        } catch {
          setError('Impossible de charger le projet')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    load()
  }, [propProject, projectId])

  useEffect(() => {
    const handleProjectUpdated = () => reloadProject()
    window.addEventListener('project-updated', handleProjectUpdated)
    window.addEventListener('project-saved', handleProjectUpdated)
    return () => {
      window.removeEventListener('project-updated', handleProjectUpdated)
      window.removeEventListener('project-saved', handleProjectUpdated)
    }
  }, [reloadProject])

  const handleSave = (updatedProject: any) => {
    setProject(mapApiProjectToProjet(updatedProject))
    setIsEditing(false)
    window.dispatchEvent(new CustomEvent('project-updated', { detail: updatedProject }))
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    reloadProject()
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
    else setIsEditing(true)
  }

  if (isEditing && project) {
    return <EditProjectView projectId={project.id.toString()} onBack={handleEditCancel} onSave={handleSave} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ef7c21] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du projet...</p>
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

  const stats = calculateProjectStats(project.phases)
  const daysRemaining = Math.ceil((new Date(project.dateFinPrevue).getTime() - Date.now()) / 86400000)
  const progress = stats.subTasksProgress > 0 ? stats.subTasksProgress : stats.tasksProgress > 0 ? stats.tasksProgress : stats.phasesProgress
  const typeConfig = getProjectTypeConfig(project.typeProjet)
  const TypeIcon = typeConfig.icon

  const tabs = [
    { id: 'general', label: 'Général', icon: Info },
    { id: 'timeline', label: 'Timeline', icon: CalendarDays },
    { id: 'tasks', label: 'Tâches', icon: ListTodo },
    { id: 'team', label: 'Équipe', icon: Users2 },
    { id: 'cdc', label: 'Cahier des Charges', icon: FileText },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <p className="text-sm text-gray-500 mb-1">Projets / <span className="text-[#1d1d1b] font-medium">{project.nom}</span></p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1d1d1b]">{project.nom}</h1>
              <StatusBadge status={project.statut} />
            </div>
          </div>
        </div>
        <Button onClick={handleEdit} className="bg-[#ef7c21] hover:bg-[#d95f00] text-white flex items-center gap-2">
          <Edit2 className="h-4 w-4" /> Modifier
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Progression</p>
              <p className="text-2xl font-bold">{progress}%</p>
            </div>
            <Target className="h-5 w-5 text-[#ef7c21]" />
          </div>
          <ProgressBar progress={progress} size="sm" />
        </Card>

        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(project.budgetReel || 0)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Jours restants</p>
              <p className={`text-2xl font-bold ${daysRemaining < 0 ? 'text-red-600' : ''}`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)}j dépassés` : daysRemaining}
              </p>
            </div>
            <Timer className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-2">Type de projet</p>
              <p className="text-lg font-semibold">{project.typeProjet}</p>
            </div>
            <TypeIcon className="h-5 w-5 text-[#ef7c21]" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'border-b-2 border-[#ef7c21] text-[#ef7c21]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'general' && <GeneralInfoView project={project} stats={stats} />}
      {activeTab === 'timeline' && <Card className="p-6"><h3 className="text-lg font-semibold mb-6">Timeline du projet</h3><TimelineView phases={project.phases} /></Card>}
      {activeTab === 'tasks' && <Card className="p-6"><h3 className="text-lg font-semibold mb-6">Tâches par phase</h3><TasksByPhaseView phases={project.phases} /></Card>}
      {activeTab === 'team' && <Card className="p-6"><h3 className="text-lg font-semibold mb-6">Équipe projet</h3><TeamView members={project.groupeEquipe?.employes || []} tasks={project.phases.flatMap(p => p.taches || [])} phases={project.phases} /></Card>}
      {activeTab === 'cdc' && <Card className="p-6"><h3 className="text-lg font-semibold mb-6">Cahier des Charges</h3><CdcView projectId={project.id} /></Card>}
    </div>
  )
}

export default ProjectDetailView