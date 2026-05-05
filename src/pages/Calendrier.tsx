import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Search,
  X,
  RefreshCw,
  CheckCircle,
  Filter,
  BarChart3,
  Timer,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw, // AJOUT POUR LE BOUTON REPRENDRE
} from 'lucide-react'
import { getMySubTasks, getTimeEntries, updateSubTaskStatus, getSubTaskComments, type SubTaskFromApi } from '../services/subTaskService'
import { getMesProjetsMembre, type ProjetMembre } from '../services/projectService'
import { usePersistedTimer } from '../contexts/usePersistedTimer'

type SubTaskStatus = 'À faire' | 'En cours' | 'À tester' | 'Validée' | 'Rejetée'

interface SousTache {
  id: string
  tacheId: string
  titre: string
  description?: string
  dateDebutPrevue: string
  dateFinPrevue: string
  projetNom?: string
  projetCouleur?: string
  projetId?: number
  statut: SubTaskStatus
  employeNom?: string
  dureeEstimeeHeures: number
  heuresConsommees: number
  estEnRetard?: boolean
  priorite?: string
  raisonRejet?: string
  rejetDate?: Date | string
  commentaires?: any[]
}

interface Tache {
  id: string
  titre: string
  projetNom?: string
  projetCouleur?: string
}

type ViewMode = 'month' | 'week' | 'day'

type ConfirmationAction = {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'complete'
  title: string
  message: string
  confirmButtonText: string
  cancelButtonText: string
  icon: React.ElementType
  confirmButtonClass: string
  data?: any
  onConfirm: () => void
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const WEEKDAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const API_STATUS_MAP: Record<SubTaskStatus, string> = {
  'À faire': 'AFaire',
  'En cours': 'EnCours',
  'À tester': 'ATester',
  Validée: 'Validee',
  Rejetée: 'Rejetee',
}

const STATUS_STYLES: Record<
  SubTaskStatus,
  { bg: string; text: string; dot: string; border: string; label: string }
> = {
  'À faire': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', border: 'border-gray-300', label: 'À faire' },
  'En cours': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-300', label: 'En cours' },
  'À tester': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-300', label: 'À tester' },
  Validée: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-300', label: 'Validée' },
  Rejetée: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-300', label: 'Rejetée' },
}

// Utilitaires
const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatRelativeTime = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return 'N/A'
  let date: Date
  if (dateInput instanceof Date) {
    date = dateInput
  } else {
    const normalized = !dateInput.endsWith('Z') && !dateInput.includes('+')
      ? dateInput + 'Z' : dateInput
    date = new Date(normalized)
  }
  if (isNaN(date.getTime())) return 'Date invalide'
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'à venir'
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return "à l'instant"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateLong = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const getFirstDayOfMonth = (date: Date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return day === 0 ? 6 : day - 1
}

const formatSecondsToTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

const getInitials = (name?: string) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const normalizeStatus = (apiStatus: string | undefined): SubTaskStatus => {
  if (!apiStatus) return 'À faire'
  const s = apiStatus.toLowerCase()
  if (s === 'encours' || s === 'en cours') return 'En cours'
  if (s === 'afaire' || s === 'à faire') return 'À faire'
  if (s === 'atester' || s === 'à tester') return 'À tester'
  if (s === 'validee' || s === 'validée') return 'Validée'
  if (s === 'rejetee' || s === 'rejetée') return 'Rejetée'
  return 'À faire'
}

// Composant principal
export function calendrierView() {
  // États
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<SubTaskStatus | 'all'>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [selectedTask, setSelectedTask] = useState<{ task: Tache; subtask: SousTache } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // États pour les popups de confirmation
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<ConfirmationAction | null>(null)

  // Données
  const [sousTaches, setSousTaches] = useState<SousTache[]>([])
  const [projets, setProjets] = useState<ProjetMembre[]>([])

  const isLoadingRef = useRef(false)

  // Timer
  const recordWorkTime = useCallback(async (subTaskId: string, seconds: number) => {
    if (seconds <= 0) return
    console.log(`Recording ${seconds}s for task ${subTaskId}`)
  }, [])

  const { activeTimer, timerSeconds: totalElapsedSeconds, startTimer, pauseTimer, resumeTimer, stopTimer } =
    usePersistedTimer(recordWorkTime)

  // --- LOGIQUE MÉTIER ---

  const updateTaskStatus = useCallback(async (subTaskId: string, newStatus: SubTaskStatus) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await updateSubTaskStatus(parseInt(subTaskId), API_STATUS_MAP[newStatus])
      
      setSousTaches(prev => prev.map(st => 
        st.id === subTaskId ? { ...st, statut: newStatus } : st
      ))

      setSelectedTask(prev => {
        if (prev?.subtask.id === subTaskId) {
          return { ...prev, subtask: { ...prev.subtask, statut: newStatus } }
        }
        return prev
      })
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
      refreshData(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting])

  const refreshData = useCallback(async (showSpinner = false) => {
    if (isLoadingRef.current && showSpinner) return
    if (showSpinner) { isLoadingRef.current = true; setIsLoading(true) }

    try {
      const projectIdParam = filterProject !== 'all' ? parseInt(filterProject) : undefined
      const data = await getMySubTasks(projectIdParam)

      const tasksWithDetails = await Promise.all(
        data.map(async (st: SubTaskFromApi) => {
          try {
            const [timeEntries, comments] = await Promise.all([
              getTimeEntries(st.id), 
              getSubTaskComments(st.id)
            ])
            
            const lastComment = comments && comments.length > 0 ? comments[0] : null;
            
            return {
              id: st.id.toString(),
              tacheId: st.tacheId.toString(),
              titre: st.titre,
              description: st.description,
              dateDebutPrevue: st.dateDebutPrevue || new Date().toISOString().split('T')[0],
              dateFinPrevue: st.dateFinPrevue || new Date().toISOString().split('T')[0],
              projetNom: st.projetNom,
              projetId: st.projetId,
              statut: normalizeStatus(st.statut),
              employeNom: st.employeNom,
              dureeEstimeeHeures: st.dureeEstimeeHeures,
              heuresConsommees: timeEntries.reduce((s, e) => s + e.dureeHeures, 0),
              estEnRetard: st.dateFinPrevue ? new Date(st.dateFinPrevue) < new Date() : false,
              priorite: st.priorite || 'medium',
              raisonRejet: st.raisonRejet || (normalizeStatus(st.statut) === 'Rejetée' ? lastComment?.commentaire : undefined),
              rejetDate: st.rejetDate || (normalizeStatus(st.statut) === 'Rejetée' ? lastComment?.dateTest : undefined),
              commentaires: comments || [],
            } as SousTache
          } catch {
            return {
              id: st.id.toString(),
              tacheId: st.tacheId.toString(),
              titre: st.titre,
              dateDebutPrevue: st.dateDebutPrevue || new Date().toISOString().split('T')[0],
              dateFinPrevue: st.dateFinPrevue || new Date().toISOString().split('T')[0],
              projetNom: st.projetNom,
              projetId: st.projetId,
              statut: normalizeStatus(st.statut),
              employeNom: st.employeNom,
              dureeEstimeeHeures: st.dureeEstimeeHeures,
              heuresConsommees: 0,
              estEnRetard: false,
              priorite: 'medium',
            } as SousTache
          }
        })
      )

      setSousTaches(tasksWithDetails)
      setError(null)
    } catch (err) {
      console.error('Erreur chargement:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      if (showSpinner) { setIsLoading(false); isLoadingRef.current = false }
    }
  }, [filterProject])

  useEffect(() => {
    getMesProjetsMembre().then(setProjets).catch(console.error)
  }, [])

  useEffect(() => {
    refreshData(true)
  }, [refreshData])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshData(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  const filteredSubtasks = useMemo(() => {
    let filtered = sousTaches
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.statut === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.titre.toLowerCase().includes(q) ||
          s.employeNom?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.projetNom?.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [sousTaches, filterStatus, searchQuery])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { task: Tache; subtask: SousTache }[]>()
    filteredSubtasks.forEach((subtask) => {
      const task: Tache = {
        id: subtask.tacheId,
        titre: subtask.titre,
        projetNom: subtask.projetNom,
        projetCouleur: '#ef7c21',
      }
      const start = new Date(subtask.dateDebutPrevue)
      const end = new Date(subtask.dateFinPrevue)
      const current = new Date(start)
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0]
        if (!map.has(dateKey)) map.set(dateKey, [])
        map.get(dateKey)!.push({ task, subtask })
        current.setDate(current.getDate() + 1)
      }
    })
    return map
  }, [filteredSubtasks])

  const stats = useMemo(() => {
    return {
      total: sousTaches.length,
      enCours: sousTaches.filter((s) => s.statut === 'En cours').length,
      aTester: sousTaches.filter((s) => s.statut === 'À tester').length,
      enRetard: sousTaches.filter((s) => s.estEnRetard && s.statut !== 'Validée').length,
      rejetees: sousTaches.filter((s) => s.statut === 'Rejetée').length,
      aFaire: sousTaches.filter((s) => s.statut === 'À faire').length,
      validees: sousTaches.filter((s) => s.statut === 'Validée').length,
      heuresEstimees: sousTaches.reduce((a, s) => a + s.dureeEstimeeHeures, 0),
      heuresConsommees: sousTaches.reduce((a, s) => a + s.heuresConsommees, 0),
    }
  }, [sousTaches])

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = getFirstDayOfMonth(currentDate)
    const start = new Date(firstDay)
    start.setDate(firstDay.getDate() - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }, [currentDate])

  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    const day = currentDate.getDay()
    start.setDate(currentDate.getDate() - (day === 0 ? 6 : day - 1))
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }, [currentDate])

  const confirmAction = useCallback((
    type: ConfirmationAction['type'],
    data: any,
    onConfirm: () => void
  ) => {
    const configs: Record<string, { title: string; message: string; Icon: React.ElementType; btnClass: string }> = {
      start: { title: 'Démarrer la tâche', message: `Démarrer "${data.titre}" ?`, Icon: Play, btnClass: 'bg-green-600 hover:bg-green-700' },
      pause: { title: 'Mettre en pause', message: 'Mettre le timer en pause ?', Icon: Pause, btnClass: 'bg-yellow-600 hover:bg-yellow-700' },
      resume: { title: 'Reprendre la tâche', message: 'Reprendre le timer ?', Icon: Play, btnClass: 'bg-blue-600 hover:bg-blue-700' },
      stop: { title: 'Arrêter le timer', message: 'Le temps écoulé sera enregistré.', Icon: Square, btnClass: 'bg-red-600 hover:bg-red-700' },
      complete: { title: 'Terminer la tâche', message: `"${data.titre}" passera en statut "À tester".`, Icon: CheckCircle, btnClass: 'bg-green-600 hover:bg-green-700' },
    }
    const { title, message, Icon, btnClass } = configs[type]
    setPendingAction({ type, title, message, confirmButtonText: 'Confirmer', cancelButtonText: 'Annuler', icon: Icon, confirmButtonClass: btnClass, data, onConfirm })
    setShowConfirmDialog(true)
  }, [])

  // --- HANDLERS ---

  const handleStartTimer = useCallback((task: Tache, subtask: SousTache) => {
    confirmAction('start', { titre: subtask.titre }, async () => {
      await startTimer(subtask.id, task.id)
      await updateTaskStatus(subtask.id, 'En cours')
      setShowModal(false)
    })
  }, [startTimer, confirmAction, updateTaskStatus])

  const handlePauseTimer = useCallback(() => {
    if (!activeTimer) return
    confirmAction('pause', {}, pauseTimer)
  }, [activeTimer, pauseTimer, confirmAction])

  const handleResumeTimer = useCallback(() => {
    if (!activeTimer) return
    confirmAction('resume', {}, resumeTimer)
  }, [activeTimer, resumeTimer, confirmAction])

  const handleStopTimer = useCallback(() => {
    if (!activeTimer) return
    confirmAction('stop', {}, async () => {
      await stopTimer()
      refreshData(false)
    })
  }, [activeTimer, stopTimer, confirmAction, refreshData])

  const handleCompleteTask = useCallback((task: Tache, subtask: SousTache) => {
    confirmAction('complete', { titre: subtask.titre }, async () => {
      await stopTimer()
      await updateTaskStatus(subtask.id, 'À tester')
      setShowModal(false)
    })
  }, [stopTimer, confirmAction, updateTaskStatus])

  // Navigation
  const goToPrevious = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') date.setDate(date.getDate() - 1)
    else if (viewMode === 'week') date.setDate(date.getDate() - 7)
    else date.setMonth(date.getMonth() - 1)
    setCurrentDate(date)
  }

  const goToNext = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') date.setDate(date.getDate() + 1)
    else if (viewMode === 'week') date.setDate(date.getDate() + 7)
    else date.setMonth(date.getMonth() + 1)
    setCurrentDate(date)
  }

  const goToToday = () => setCurrentDate(new Date())

  const getPeriodLabel = () => {
    if (viewMode === 'day') return formatDateLong(currentDate)
    if (viewMode === 'week') {
      const start = weekDays[0]
      const end = weekDays[6]
      return `Semaine du ${formatDate(start)} au ${formatDate(end)}`
    }
    return formatMonthYear(currentDate)
  }

  const renderTasksForDay = (date: Date, maxTasks = 3) => {
    const dateKey = date.toISOString().split('T')[0]
    const dayTasks = tasksByDate.get(dateKey) || []
    if (dayTasks.length === 0) {
      return <div className="text-center py-2"><span className="text-xs text-gray-400">-</span></div>
    }

    const sortedTasks = [...dayTasks].sort((a, b) => {
      const statusOrder = { Rejetée: 0, 'En cours': 1, 'À tester': 2, 'À faire': 3, Validée: 4 }
      return (statusOrder[a.subtask.statut] || 99) - (statusOrder[b.subtask.statut] || 99)
    })

    return (
      <>
        {sortedTasks.slice(0, maxTasks).map(({ task, subtask }) => {
          const style = STATUS_STYLES[subtask.statut]
          const progress = Math.min(100, Math.round((subtask.heuresConsommees / subtask.dureeEstimeeHeures) * 100))
          const isActive = activeTimer?.subTaskId === subtask.id
          return (
            <div
              key={subtask.id}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedTask({ task, subtask })
                setShowModal(true)
              }}
              className={`group relative mb-1 p-1.5 rounded border-l-3 text-xs cursor-pointer hover:shadow-md transition-all ${style.bg} ${style.text}`}
              style={{ borderLeftColor: task.projetCouleur || '#ef7c21' }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-medium truncate flex-1" title={subtask.titre}>{subtask.titre}</span>
                {subtask.estEnRetard && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />}
              </div>
              <div className="flex items-center justify-between mt-1 text-[9px] opacity-75">
                
                <span>{progress}%</span>
              </div>
              
              {subtask.statut === 'Rejetée' && subtask.raisonRejet && (
                <div className="mt-1 text-[9px] text-red-600 truncate" title={subtask.raisonRejet}>
                  ❌ {subtask.raisonRejet}
                </div>
              )}

              {isActive && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </div>
          )
        })}
        {dayTasks.length > maxTasks && (
          <div className="text-[9px] text-center text-gray-500 mt-1">+{dayTasks.length - maxTasks}</div>
        )}
      </>
    )
  }

  const ConfirmationDialog = () => {
    if (!showConfirmDialog || !pendingAction) return null
    const Icon = pendingAction.icon
    const isPositive = ['start', 'resume', 'complete'].includes(pendingAction.type)
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
        <Card className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100' : pendingAction.type === 'pause' ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <Icon className={`h-7 w-7 ${isPositive ? 'text-green-600' : pendingAction.type === 'pause' ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{pendingAction.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{pendingAction.message}</p>
            </div>
          </div>
          {pendingAction.type === 'stop' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                Le temps écoulé sera enregistré. Cette action est irréversible.
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowConfirmDialog(false); setPendingAction(null) }}>
              {pendingAction.cancelButtonText}
            </Button>
            <Button className={`flex-1 text-white ${pendingAction.confirmButtonClass}`} onClick={() => { pendingAction.onConfirm(); setShowConfirmDialog(false); setPendingAction(null) }}>
              {pendingAction.confirmButtonText}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading && sousTaches.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
        <Button variant="primary" size="sm" onClick={() => refreshData(true)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-4 lg:p-6 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ef7c21] to-[#ff9f4b] flex items-center justify-center shadow-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Calendrier des tâches</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                <span className="capitalize">{getPeriodLabel()}</span>
                {stats.enRetard > 0 && (
                  <Badge variant="danger" className="text-xs">
                    {stats.enRetard} en retard
                  </Badge>
                )}
                {stats.aTester > 0 && (
                  <Badge variant="warning" className="text-xs">
                    {stats.aTester} à tester
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="!px-2" title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === mode ? 'bg-[#ef7c21] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {mode === 'month' && 'Mois'}
                  {mode === 'week' && 'Semaine'}
                  {mode === 'day' && 'Jour'}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={goToToday}>Aujourd'hui</Button>
            <Button variant="outline" size="sm" onClick={goToPrevious} className="!px-2"><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="outline" size="sm" onClick={goToNext} className="!px-2"><ChevronRight className="h-5 w-5" /></Button>

            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} className="!px-2">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'blue' },
              { label: 'Validées', value: stats.validees, color: 'green' },
              { label: 'En cours', value: stats.enCours, color: 'blue' },
              { label: 'À tester', value: stats.aTester, color: 'purple' },
              { label: 'Rejetées', value: stats.rejetees, color: 'red' },
              { label: 'À faire', value: stats.aFaire, color: 'gray' },
              { label: 'En retard', value: stats.enRetard, color: 'amber' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-4" noPadding>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-medium mb-1 text-${color}-600`}>{label}</p>
                      <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche ou une personne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="min-w-[180px]">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">Tous les projets</option>
              {projets.map(p => <option key={p.id} value={p.id.toString()}>{p.nom}</option>)}
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtres
            {filterStatus !== 'all' && <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">•</span>}
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4 border border-gray-200" noPadding>
            <div className="p-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(STATUS_STYLES).map(([key, style]) => (
                    <option key={key} value={key}>{style.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-600">Légende:</span>
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
              <span>{style.label}</span>
            </div>
          ))}
        </div>

        {/* Calendrier */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden" noPadding>
          {viewMode === 'month' && (
            <>
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {WEEKDAYS_FULL.map((day) => (
                  <div key={day} className="py-3 text-center text-sm font-medium text-gray-700">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
                {monthDays.map((date, index) => {
                  const dateKey = date.toISOString().split('T')[0]
                  const dayTasks = tasksByDate.get(dateKey) || []
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                  const isTodayDate = isToday(date)
                  return (
                    <div
                      key={index}
                      onClick={() => { setCurrentDate(date); setViewMode('day') }}
                      className={`min-h-[120px] lg:min-h-[150px] p-2 relative cursor-pointer ${
                        !isCurrentMonth ? 'bg-gray-50/70' : 'bg-white'
                      } ${isTodayDate ? 'ring-2 ring-orange-500 ring-inset' : ''} hover:bg-gray-100/80 transition-all`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                          isTodayDate ? 'bg-orange-500 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {date.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <Badge variant="neutral" className="text-xs">{dayTasks.length}</Badge>
                        )}
                      </div>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {renderTasksForDay(date, 3)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {viewMode === 'week' && (
            <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[500px]">
              {weekDays.map((date, index) => {
                const dateKey = date.toISOString().split('T')[0]
                const dayTasks = tasksByDate.get(dateKey) || []
                const isTodayDate = isToday(date)
                return (
                  <div key={index} className={`flex flex-col ${isTodayDate ? 'bg-orange-50/50' : 'bg-white'}`}>
                    <div className={`p-3 text-center border-b ${isTodayDate ? 'bg-orange-100' : 'bg-gray-50'}`}>
                      <div className="text-sm font-medium text-gray-600">{WEEKDAYS[index]}</div>
                      <div className={`text-lg font-semibold mt-1 ${isTodayDate ? 'text-orange-600' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px]">
                      {dayTasks.length > 0 ? renderTasksForDay(date, 10) : (
                        <div className="text-center py-4 text-xs text-gray-400">-</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {viewMode === 'day' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{formatDateLong(currentDate)}</h2>
                <Badge variant="neutral">
                  {tasksByDate.get(currentDate.toISOString().split('T')[0])?.length || 0} tâches
                </Badge>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {renderTasksForDay(currentDate, 100)}
                {(!tasksByDate.get(currentDate.toISOString().split('T')[0]) ||
                  tasksByDate.get(currentDate.toISOString().split('T')[0])!.length === 0) && (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    Aucune tâche pour cette journée
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Modal de détail */}
        {showModal && selectedTask && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto" noPadding>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedTask.subtask.titre}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTask.subtask.projetNom} • {selectedTask.task.titre}
                    </p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Alerte de Rejet */}
                {selectedTask.subtask.statut === 'Rejetée' && selectedTask.subtask.raisonRejet && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Raison :</strong> {selectedTask.subtask.raisonRejet}
                      </span>
                    </p>
                    {selectedTask.subtask.rejetDate && (
                      <p className="text-[10px] text-red-600 mt-1 ml-6">
                        Rejeté le : {formatRelativeTime(selectedTask.subtask.rejetDate)}
                      </p>
                    )}
                  </div>
                )}

                {selectedTask.subtask.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {selectedTask.subtask.description}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Statut</p>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[selectedTask.subtask.statut].bg} ${STATUS_STYLES[selectedTask.subtask.statut].text}`}>
                        <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[selectedTask.subtask.statut].dot}`} />
                        {STATUS_STYLES[selectedTask.subtask.statut].label}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Dates</p>
                      <p className="text-sm">
                        {formatDate(new Date(selectedTask.subtask.dateDebutPrevue))} -{' '}
                        {formatDate(new Date(selectedTask.subtask.dateFinPrevue))}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Progression</p>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>
                        {selectedTask.subtask.heuresConsommees.toFixed(1)}h /{' '}
                        {selectedTask.subtask.dureeEstimeeHeures}h
                      </span>
                      <span className="font-medium">
                        {Math.min(100, Math.round((selectedTask.subtask.heuresConsommees / selectedTask.subtask.dureeEstimeeHeures) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                        style={{
                          width: `${Math.min(100, (selectedTask.subtask.heuresConsommees / selectedTask.subtask.dureeEstimeeHeures) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {activeTimer && activeTimer.subTaskId === selectedTask.subtask.id && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Temps écoulé</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-amber-800">
                          {formatSecondsToTime(totalElapsedSeconds)}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                        {activeTimer.isRunning ? (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            En cours...
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            En pause
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowModal(false)}>
                    Fermer
                  </Button>

                  {/* --- BOUTON REPRENDRE (STATUT REJETÉE) --- */}
                  {selectedTask.subtask.statut === 'Rejetée' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={isSubmitting}
                      onClick={() => {
                        confirmAction('start', { titre: selectedTask.subtask.titre }, async () => {
                          await startTimer(selectedTask.subtask.id, selectedTask.task.id)
                          await updateTaskStatus(selectedTask.subtask.id, 'En cours')
                          setShowModal(false)
                        })
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Reprendre
                    </Button>
                  )}

                  {/* --- BOUTON DÉMARRER (STATUT À FAIRE) --- */}
                  {selectedTask.subtask.statut === 'À faire' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStartTimer(selectedTask.task, selectedTask.subtask)}
                      disabled={isSubmitting}
                    >
                      <Play className="h-4 w-4 mr-2" /> Démarrer
                    </Button>
                  )}

                  {/* --- BOUTONS TIMER (STATUT EN COURS) --- */}
                  {selectedTask.subtask.statut === 'En cours' && (
                    <>
                      {!activeTimer || activeTimer.subTaskId !== selectedTask.subtask.id ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStartTimer(selectedTask.task, selectedTask.subtask)}
                          disabled={isSubmitting}
                        >
                          <Play className="h-4 w-4 mr-2" /> Démarrer
                        </Button>
                      ) : activeTimer.isRunning ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                          onClick={handlePauseTimer}
                          disabled={isSubmitting}
                        >
                          <Pause className="h-4 w-4 mr-2" /> Pause
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={handleResumeTimer}
                            disabled={isSubmitting}
                          >
                            <Play className="h-4 w-4 mr-2" /> Reprendre
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={handleStopTimer}
                            disabled={isSubmitting}
                          >
                            <Square className="h-4 w-4 mr-2" /> Arrêter
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 bg-[#ef7c21] hover:bg-[#d94e00]"
                        onClick={() => handleCompleteTask(selectedTask.task, selectedTask.subtask)}
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Terminer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        <ConfirmationDialog />

        {/* Timer flottant */}
        {activeTimer && (
          <div className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-full shadow-xl px-4 py-2.5 flex items-center gap-3">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-medium">{formatSecondsToTime(totalElapsedSeconds)}</span>
            {activeTimer.isRunning ? (
              <button onClick={handlePauseTimer} className="p-1 hover:bg-white/20 rounded-full">
                <Pause className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleResumeTimer} className="p-1 hover:bg-white/20 rounded-full">
                <Play className="h-4 w-4" />
              </button>
            )}
            <button onClick={handleStopTimer} className="p-1 hover:bg-white/20 rounded-full">
              <Square className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default calendrierView