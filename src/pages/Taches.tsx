// components/TasksKanban.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '@hello-pangea/dnd'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  CheckCircle,
  Clock,
  Play,
  Pause,
  Square,
  User,
  AlertCircle,
  Filter,
  Search,
  X,
  RefreshCw,
  BarChart3,
  Target,
  Timer,
  GitPullRequest,
  Loader2,
  RotateCcw,
  AlertTriangle,
  LayoutGrid,
  Maximize2,
  Minimize2,
  MessageSquare,
} from 'lucide-react'
import {
  getMySubTasks,
  getTimeEntries,
  getSubTaskComments,
  updateSubTaskStatus,
  addTimeEntry,
  rejectSubTask,
  validateSubTask,
  type SubTaskFromApi,
  type TimeEntry,
  type Commentaire,
} from '../services/subTaskService'
import { getMesProjetsMembre, type ProjetMembre } from "../services/projectService"

// Types
type SubTaskStatus = 'À faire' | 'En cours' | 'À tester' | 'Validée' | 'Rejetée'
type TestResult = 'Réussi' | 'Échoué' | 'En cours'

interface SousTache {
  id: string
  tacheId: string
  titre: string
  description?: string
  dureeEstimeeHeures: number
  statut: SubTaskStatus
  employeId?: string
  employeNom?: string
  testeurId?: string
  testeurNom?: string
  heuresConsommees: number
  estEnRetard?: boolean
  rejetId?: string
  rejetPar?: string
  rejetParNom?: string
  rejetDate?: Date
  raisonRejet?: string
  statutRejet?: 'en-attente' | 'en-cours' | 'resolu'
  commentairesRejet?: Array<{
    id: string
    auteur: string
    contenu: string
    dateCreation: Date
  }>
  commentaires?: Commentaire[]
  dateDebut?: string
  dateFin?: string
  projetId?: number
  projetNom?: string
  tacheTitre?: string
}

interface Tache {
  id: string
  titre: string
  projetNom?: string
  projetCouleur?: string
}

interface ActiveTimer {
  subTaskId: string
  taskId: string
  sessionStart: number
  totalSeconds: number
  isRunning: boolean
}

interface TasksViewProps {
  onSelectTask?: (tache: Tache, sousTache: SousTache) => void
  selectedTaskId?: string | null
  onRefresh?: () => void
  userId?: string
  userRole?: string
  isSidebarCollapsed?: boolean
  projetId?: number
}

type ConfirmationAction = {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'complete' | 'reject' | 'validate' | 'move'
  title: string
  message: string
  confirmButtonText: string
  cancelButtonText: string
  icon: React.ElementType
  confirmButtonClass: string
  data?: any
  onConfirm: () => void
}

// Constantes
const STATUS_CONFIG: Record<
  SubTaskStatus,
  {
    label: string
    color: string
    icon: React.ElementType
    bgColor: string
    borderColor: string
    textColor: string
  }
> = {
  'À faire': {
    label: 'À faire',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    icon: Clock,
  },
  'En cours': {
    label: 'En cours',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    icon: Play,
  },
  'À tester': {
    label: 'À tester',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    icon: GitPullRequest,
  },
  Validée: {
    label: 'Validée',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  Rejetée: {
    label: 'Rejetée',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    icon: X,
  },
}

const KANBAN_COLUMNS: Record<
  SubTaskStatus,
  {
    title: string
    bgColor: string
    borderColor: string
    headerColor: string
  }
> = {
  'À faire': {
    title: 'À faire',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    headerColor: 'bg-gray-100',
  },
  'En cours': {
    title: 'En cours',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerColor: 'bg-blue-100',
  },
  'À tester': {
    title: 'À tester',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    headerColor: 'bg-purple-100',
  },
  Validée: {
    title: 'Validée',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerColor: 'bg-green-100',
  },
  Rejetée: {
    title: 'Rejetée',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    headerColor: 'bg-red-100',
  },
}

// Fonctions utilitaires
const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatDateTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelativeTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMin = Math.floor((new Date().getTime() - d.getTime()) / 60000)
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffMin < 1440) return `il y a ${Math.floor(diffMin / 60)} h`
  return formatDate(d)
}

const formatSecondsToTime = (s: number) =>
  `${Math.floor(s / 3600)
    .toString()
    .padStart(2, '0')}:${Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

const getStatusIcon = (status: SubTaskStatus) => {
  const c = STATUS_CONFIG[status]
  if (!c) return null
  const I = c.icon
  return <I className={`h-4 w-4 ${c.color}`} />
}

const normalizeStatus = (apiStatus: string | undefined): SubTaskStatus => {
  if (!apiStatus) return 'À faire'
  
  const status = apiStatus.toLowerCase()
  if (status === 'encours' || status === 'en cours') return 'En cours'
  if (status === 'afaire' || status === 'à faire') return 'À faire'
  if (status === 'atester' || status === 'à tester') return 'À tester'
  if (status === 'validee' || status === 'validée') return 'Validée'
  if (status === 'rejetee' || status === 'rejetée') return 'Rejetée'
  
  return 'À faire'
}

export function TasksKanban({
  onSelectTask,
  onRefresh,
  userId = '1',
  userRole = 'Développeur',
  isSidebarCollapsed = false,
  projetId: initialProjetId,
}: TasksViewProps) {
  // États
  const [sousTaches, setSousTaches] = useState<SousTache[]>([])
  const [projets, setProjets] = useState<ProjetMembre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjetId?.toString() || 'all')
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [filterStatus, setFilterStatus] = useState<SubTaskStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Tache | null>(null)
  const [selectedSubTaskForModal, setSelectedSubTaskForModal] = useState<SousTache | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<ConfirmationAction | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectTaskData, setRejectTaskData] = useState<{
    tacheId: string
    sousTacheId: string
  } | null>(null)

  const isLoadingRef = useRef(false)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ========== 1. CHARGER LES PROJETS ==========
  const loadProjects = useCallback(async () => {
    try {
      const data = await getMesProjetsMembre()
      setProjets(data)
    } catch (err) {
      console.error('Erreur chargement projets:', err)
    }
  }, [])

  // ========== 2. RECORD TIME ==========
  const recordWorkTime = useCallback(async (subTaskId: string, seconds: number) => {
    if (seconds === 0) return
    const heures = seconds / 3600
    const dateStr = new Date().toISOString().split('T')[0]
    
    try {
      await addTimeEntry(parseInt(subTaskId), heures, dateStr)
      console.log(`Temps enregistré: ${heures.toFixed(2)}h pour la tâche ${subTaskId}`)
      
      setSousTaches(prev =>
        prev.map(st =>
          st.id === subTaskId 
            ? { ...st, heuresConsommees: st.heuresConsommees + heures }
            : st
        )
      )
      return true
    } catch (err) {
      console.error('Erreur enregistrement temps:', err)
      return false
    }
  }, [])

  // ========== 3. UPDATE STATUS ==========
  const updateStatus = useCallback(async (subTaskId: string, newStatus: SubTaskStatus) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    const apiStatusMap: Record<SubTaskStatus, string> = {
      'À faire': 'AFaire',
      'En cours': 'EnCours',
      'À tester': 'ATester',
      'Validée': 'Validee',
      'Rejetée': 'Rejetee'
    }
    
    const apiStatus = apiStatusMap[newStatus]
    
    try {
      await updateSubTaskStatus(parseInt(subTaskId), apiStatus)
      
      setSousTaches(prev =>
        prev.map(st =>
          st.id === subTaskId ? { ...st, statut: newStatus } : st
        )
      )
      
      console.log(`Statut mis à jour: Tâche ${subTaskId} -> ${newStatus}`)
      
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting])

  // ========== 4. REFRESH TASKS STATUS ==========
  const refreshTasksStatus = useCallback(async () => {
    if (isLoadingRef.current) return
    
    try {
      const projectIdParam = selectedProjectId !== 'all' ? parseInt(selectedProjectId) : undefined
      const data = await getMySubTasks(projectIdParam)
      
      setSousTaches(prev => {
        const updatedTasks = [...prev]
        data.forEach(apiTask => {
          const existingIndex = updatedTasks.findIndex(t => t.id === apiTask.id.toString())
          if (existingIndex !== -1) {
            const apiStatus = normalizeStatus(apiTask.statut)
            const localStatus = updatedTasks[existingIndex].statut
            
            if (apiStatus !== localStatus) {
              console.log(`Synchronisation: Tâche ${apiTask.id} - API: ${apiStatus}, Local: ${localStatus} -> ${apiStatus}`)
              updatedTasks[existingIndex] = {
                ...updatedTasks[existingIndex],
                statut: apiStatus
              }
            }
          }
        })
        return updatedTasks
      })
    } catch (err) {
      console.error('Erreur rafraîchissement statuts:', err)
    }
  }, [selectedProjectId])

  // ========== 5. TIMER FUNCTIONS ==========
  const startTask = useCallback(async (tache: Tache, sousTache: SousTache) => {
    if (activeTimer && activeTimer.subTaskId !== sousTache.id) {
      if (activeTimer.isRunning) {
        const elapsedSeconds = timerSeconds + activeTimer.totalSeconds
        await recordWorkTime(activeTimer.subTaskId, elapsedSeconds)
      }
      setActiveTimer(null)
      setTimerSeconds(0)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    
    setActiveTimer({
      subTaskId: sousTache.id,
      taskId: tache.id,
      sessionStart: Date.now(),
      totalSeconds: 0,
      isRunning: true,
    })
    setTimerSeconds(0)
    
    setSousTaches(prev =>
      prev.map(st =>
        st.id === sousTache.id ? { ...st, statut: 'En cours' } : st
      )
    )
    
    try {
      await updateSubTaskStatus(parseInt(sousTache.id), 'EnCours')
      console.log(`Statut mis à jour dans l'API pour la tâche ${sousTache.id}`)
    } catch (err) {
      console.warn('Impossible de mettre à jour le statut:', err)
    }
  }, [activeTimer, timerSeconds, recordWorkTime])

  const pauseTask = useCallback(async () => {
    if (!activeTimer?.isRunning) return
    
    const elapsedSeconds = timerSeconds + activeTimer.totalSeconds
    
    if (elapsedSeconds > 0) {
      await recordWorkTime(activeTimer.subTaskId, elapsedSeconds)
    }
    
    setActiveTimer((prev) =>
      prev
        ? {
            ...prev,
            isRunning: false,
            totalSeconds: elapsedSeconds,
          }
        : null,
    )
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [activeTimer, timerSeconds, recordWorkTime])

  const resumeTask = useCallback(() => {
    if (!activeTimer || activeTimer.isRunning) return
    
    setActiveTimer((prev) =>
      prev
        ? {
            ...prev,
            sessionStart: Date.now(),
            isRunning: true,
          }
        : null,
    )
  }, [activeTimer])

  const stopCurrentTimer = useCallback(async () => {
    if (activeTimer) {
      if (activeTimer.isRunning) {
        const elapsedSeconds = timerSeconds + activeTimer.totalSeconds
        if (elapsedSeconds > 0) {
          await recordWorkTime(activeTimer.subTaskId, elapsedSeconds)
        }
      }
    }
    setActiveTimer(null)
    setTimerSeconds(0)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [activeTimer, timerSeconds, recordWorkTime])

  // ========== 6. HANDLE VALIDATE/REJECT ==========
  const handleValidateTask = useCallback(async (subTaskId: string) => {
    try {
      await validateSubTask(parseInt(subTaskId))
      setSousTaches(prev =>
        prev.map(st =>
          st.id === subTaskId ? { ...st, statut: 'Validée' } : st
        )
      )
      console.log(`Tâche ${subTaskId} validée`)
    } catch (err) {
      console.error('Erreur validation:', err)
      throw err
    }
  }, [])

  const handleRejectTask = useCallback(async (subTaskId: string, reason: string) => {
    try {
      await rejectSubTask(parseInt(subTaskId), reason)
      setSousTaches(prev =>
        prev.map(st =>
          st.id === subTaskId 
            ? { ...st, statut: 'Rejetée', raisonRejet: reason, rejetDate: new Date(), rejetPar: userRole === 'Testeur' ? 'Testeur' : 'Utilisateur' }
            : st
        )
      )
      console.log(`Tâche ${subTaskId} rejetée: ${reason}`)
    } catch (err) {
      console.error('Erreur rejet:', err)
      throw err
    }
  }, [userRole])

  // ========== 7. CONFIRM ACTION ==========
  const confirmAction = useCallback((
    type: ConfirmationAction['type'],
    data: any,
    onConfirm: () => void
  ) => {
    let title = ''
    let message = ''
    let confirmButtonText = 'Confirmer'
    let cancelButtonText = 'Annuler'
    let Icon = AlertCircle
    let confirmButtonClass = 'bg-[#ef7c21] hover:bg-[#d94e00]'

    switch (type) {
      case 'start':
        title = 'Démarrer la tâche'
        message = `Voulez-vous vraiment démarrer la tâche "${data.titre}" ?`
        Icon = Play
        confirmButtonClass = 'bg-green-600 hover:bg-green-700'
        break
      case 'pause':
        title = 'Mettre en pause'
        message = 'Voulez-vous mettre le timer en pause ?'
        Icon = Pause
        confirmButtonClass = 'bg-yellow-600 hover:bg-yellow-700'
        break
      case 'resume':
        title = 'Reprendre la tâche'
        message = 'Voulez-vous reprendre le timer ?'
        Icon = Play
        confirmButtonClass = 'bg-blue-600 hover:bg-blue-700'
        break
      case 'stop':
        title = 'Arrêter le timer'
        message = 'Voulez-vous arrêter le timer ? Le temps écoulé sera enregistré.'
        Icon = Square
        confirmButtonClass = 'bg-red-600 hover:bg-red-700'
        break
      case 'complete':
        title = 'Terminer la tâche'
        message = `Voulez-vous marquer "${data.titre}" comme terminée ? Elle passera en "À tester".`
        Icon = CheckCircle
        confirmButtonClass = 'bg-green-600 hover:bg-green-700'
        break
      case 'reject':
        title = 'Rejeter la tâche'
        message = `Voulez-vous rejeter "${data.titre}" ?`
        Icon = X
        confirmButtonClass = 'bg-red-600 hover:bg-red-700'
        break
      case 'validate':
        title = 'Valider la tâche'
        message = `Voulez-vous valider "${data.titre}" ?`
        Icon = CheckCircle
        confirmButtonClass = 'bg-green-600 hover:bg-green-700'
        break
      case 'move':
        title = 'Déplacer la tâche'
        message = `Voulez-vous déplacer "${data.titre}" vers "${data.destination}" ?`
        Icon = GitPullRequest
        confirmButtonClass = 'bg-purple-600 hover:bg-purple-700'
        break
    }

    setPendingAction({
      type,
      title,
      message,
      confirmButtonText,
      cancelButtonText,
      icon: Icon,
      confirmButtonClass,
      data,
      onConfirm,
    })
    setShowConfirmDialog(true)
  }, [])

  // ========== 8. FUNCTIONS WITH CONFIRM ACTION ==========
  const handleStartTask = useCallback((tache: Tache, sousTache: SousTache) => {
    confirmAction(
      'start',
      { titre: sousTache.titre, id: sousTache.id },
      () => startTask(tache, sousTache)
    )
  }, [startTask, confirmAction])

  const handlePauseTask = useCallback(() => {
    if (!activeTimer) return
    const sousTache = sousTaches.find(st => st.id === activeTimer.subTaskId)
    confirmAction(
      'pause',
      { titre: sousTache?.titre },
      pauseTask
    )
  }, [activeTimer, sousTaches, pauseTask, confirmAction])

  const handleResumeTask = useCallback(() => {
    if (!activeTimer) return
    const sousTache = sousTaches.find(st => st.id === activeTimer.subTaskId)
    confirmAction(
      'resume',
      { titre: sousTache?.titre },
      resumeTask
    )
  }, [activeTimer, sousTaches, confirmAction])

  const handleStopTimer = useCallback(() => {
    if (!activeTimer) return
    const sousTache = sousTaches.find(st => st.id === activeTimer.subTaskId)
    confirmAction(
      'stop',
      { titre: sousTache?.titre },
      stopCurrentTimer
    )
  }, [activeTimer, sousTaches, stopCurrentTimer, confirmAction])

  const completeTask = useCallback((tacheId: string, sousTacheId: string) => {
    const sousTache = sousTaches.find(st => st.id === sousTacheId)
    if (!sousTache) return
    
    confirmAction(
      'complete',
      { titre: sousTache.titre, id: sousTacheId },
      async () => {
        await stopCurrentTimer()
        try {
          await updateStatus(sousTacheId, 'À tester')
          setShowSelectionModal(false)
        } catch (err) {
          console.error('Erreur complétion tâche:', err)
        }
      }
    )
  }, [sousTaches, stopCurrentTimer, updateStatus, confirmAction])

  const handleValidateTest = useCallback((
    tacheId: string,
    sousTacheId: string,
    resultat: TestResult,
    commentaire?: string
  ) => {
    const sousTache = sousTaches.find(st => st.id === sousTacheId)
    if (!sousTache) return
    
    if (resultat === 'Réussi') {
      confirmAction(
        'validate',
        { titre: sousTache.titre },
        async () => {
          try {
            await handleValidateTask(sousTacheId)
            setShowSelectionModal(false)
          } catch (err) {
            console.error('Erreur validation:', err)
          }
        }
      )
    } else {
      setRejectTaskData({ tacheId, sousTacheId })
      setShowRejectModal(true)
    }
  }, [sousTaches, handleValidateTask, confirmAction])

  const handleRejectWithReason = useCallback(() => {
    if (!rejectTaskData || !rejectReason.trim()) return
    
    confirmAction(
      'reject',
      { titre: sousTaches.find(st => st.id === rejectTaskData.sousTacheId)?.titre },
      async () => {
        try {
          await handleRejectTask(rejectTaskData.sousTacheId, rejectReason)
          setShowRejectModal(false)
          setRejectReason('')
          setRejectTaskData(null)
          setShowSelectionModal(false)
        } catch (err) {
          console.error('Erreur rejet:', err)
        }
      }
    )
  }, [rejectTaskData, rejectReason, sousTaches, handleRejectTask, confirmAction])

  // ========== 9. LOAD DATA ==========
  const loadSubTasks = useCallback(async () => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)
    
    try {
      const projectIdParam = selectedProjectId !== 'all' ? parseInt(selectedProjectId) : undefined
      const data = await getMySubTasks(projectIdParam)
      
      const tasksWithDetails = await Promise.all(
        data.map(async (st) => {
          try {
            const timeEntries = await getTimeEntries(st.id)
            const totalHours = timeEntries.reduce((sum, entry) => sum + entry.dureeHeures, 0)
            const comments = await getSubTaskComments(st.id)
            
            return {
              ...st,
              heuresConsommees: totalHours,
              commentaires: comments
            }
          } catch (err) {
            console.warn(`Impossible de récupérer les détails pour la tâche ${st.id}`)
            return { ...st, heuresConsommees: 0, commentaires: [] }
          }
        })
      )
      
      const transformedTasks: SousTache[] = tasksWithDetails.map(st => {
        const normalizedStatut = normalizeStatus(st.statut)
        
        return {
          id: st.id.toString(),
          tacheId: st.tacheId.toString(),
          titre: st.titre,
          description: st.description,
          dureeEstimeeHeures: st.dureeEstimeeHeures,
          statut: normalizedStatut,
          employeId: st.employeId?.toString(),
          employeNom: st.employeNom,
          heuresConsommees: st.heuresConsommees || 0,
          estEnRetard: st.dateFinPrevue ? new Date(st.dateFinPrevue) < new Date() : false,
          dateDebut: st.dateDebutPrevue,
          dateFin: st.dateFinPrevue,
          projetId: st.projetId,
          projetNom: st.projetNom,
          tacheTitre: st.tacheTitre,
          commentaires: st.commentaires || [],
        }
      })
      
      setSousTaches(prev => {
        if (activeTimer) {
          return transformedTasks.map(task => {
            if (task.id === activeTimer.subTaskId && task.statut !== 'En cours') {
              return { ...task, statut: 'En cours' }
            }
            return task
          })
        }
        return transformedTasks
      })
      
    } catch (err) {
      setError('Erreur lors du chargement des sous-tâches')
      console.error(err)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [selectedProjectId, activeTimer])

  // ========== 10. DRAG AND DROP ==========
  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return
    
    const destStatus = destination.droppableId as SubTaskStatus
    const task = sousTaches.find(st => st.id === draggableId)
    if (!task) return
    
    confirmAction(
      'move',
      { 
        titre: task.titre,
        destination: KANBAN_COLUMNS[destStatus].title 
      },
      async () => {
        try {
          await updateStatus(draggableId, destStatus)
        } catch (err) {
          console.error('Erreur déplacement:', err)
        }
      }
    )
  }, [sousTaches, updateStatus, confirmAction])

  const handleTaskSelect = useCallback(
    (tache: Tache, sousTache: SousTache) => {
      setSelectedTaskForModal(tache)
      setSelectedSubTaskForModal(sousTache)
      setShowSelectionModal(true)
      onSelectTask?.(tache, sousTache)
    },
    [onSelectTask],
  )

  // ========== 11. USE EFFECTS ==========
  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    loadSubTasks()
  }, [loadSubTasks])

  useEffect(() => {
    if (onRefresh) {
      loadSubTasks()
    }
  }, [onRefresh, loadSubTasks])

  // Timer effect
  useEffect(() => {
    if (activeTimer?.isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [activeTimer?.isRunning])

  // Vérification périodique des statuts
  useEffect(() => {
    statusCheckIntervalRef.current = setInterval(() => {
      refreshTasksStatus()
    }, 10000)
    
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
      }
    }
  }, [refreshTasksStatus])

  // ========== 12. FILTERS AND STATS ==========
  const sousTachesFiltrees = useMemo(() => {
    let result = [...sousTaches]
    
    if (filterStatus !== 'all') {
      result = result.filter((st) => st.statut === filterStatus)
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (st) =>
          st.titre.toLowerCase().includes(q) ||
          st.employeNom?.toLowerCase().includes(q) ||
          st.description?.toLowerCase().includes(q) ||
          st.tacheTitre?.toLowerCase().includes(q),
      )
    }
    
    return result
  }, [sousTaches, filterStatus, searchQuery])

  const stats = useMemo(() => {
    return {
      total: sousTaches.length,
      validees: sousTaches.filter((st) => st.statut === 'Validée').length,
      enCours: sousTaches.filter((st) => st.statut === 'En cours').length,
      aTester: sousTaches.filter((st) => st.statut === 'À tester').length,
      rejetees: sousTaches.filter((st) => st.statut === 'Rejetée').length,
      aFaire: sousTaches.filter((st) => st.statut === 'À faire').length,
      enRetard: sousTaches.filter(
        (st) => st.estEnRetard && st.statut !== 'Validée',
      ).length,
      heuresTotal: sousTaches.reduce((sum, st) => sum + st.heuresConsommees, 0),
      heuresEstimees: sousTaches.reduce((sum, st) => sum + st.dureeEstimeeHeures, 0),
    }
  }, [sousTaches])

  const tasksByColumn = useMemo(() => {
    const groups: Record<SubTaskStatus, SousTache[]> = {
      'À faire': [],
      'En cours': [],
      'À tester': [],
      Validée: [],
      Rejetée: [],
    }
    sousTachesFiltrees.forEach((task) => {
      if (groups[task.statut]) {
        groups[task.statut].push(task)
      }
    })
    return groups
  }, [sousTachesFiltrees])

  const currentSubTask = useMemo(
    () =>
      selectedSubTaskForModal
        ? sousTaches.find((st) => st.id === selectedSubTaskForModal.id) || null
        : null,
    [sousTaches, selectedSubTaskForModal],
  )

  const currentTask = useMemo(
    () =>
      selectedTaskForModal
        ? { id: selectedTaskForModal.id, titre: selectedTaskForModal.titre, projetNom: selectedTaskForModal.projetNom }
        : null,
    [selectedTaskForModal],
  )

  const isThisTaskActive = activeTimer?.subTaskId === currentSubTask?.id
  const isRunning = isThisTaskActive && activeTimer?.isRunning
  const isPaused = isThisTaskActive && !activeTimer?.isRunning
  const totalElapsedSeconds = activeTimer
    ? timerSeconds + (activeTimer.totalSeconds || 0)
    : 0
  const progression = currentSubTask
    ? (currentSubTask.heuresConsommees / currentSubTask.dureeEstimeeHeures) * 100
    : 0

  // ========== 13. MODAL COMPONENTS ==========
  const ConfirmationDialog = () => {
    if (!showConfirmDialog || !pendingAction) return null
    
    const Icon = pendingAction.icon
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
        <Card className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl animate-in zoom-in duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              pendingAction.type === 'start' || pendingAction.type === 'resume' ? 'bg-green-100' :
              pendingAction.type === 'pause' ? 'bg-yellow-100' :
              pendingAction.type === 'stop' || pendingAction.type === 'reject' ? 'bg-red-100' :
              pendingAction.type === 'complete' || pendingAction.type === 'validate' ? 'bg-green-100' :
              pendingAction.type === 'move' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              <Icon className={`h-7 w-7 ${
                pendingAction.type === 'start' || pendingAction.type === 'resume' ? 'text-green-600' :
                pendingAction.type === 'pause' ? 'text-yellow-600' :
                pendingAction.type === 'stop' || pendingAction.type === 'reject' ? 'text-red-600' :
                pendingAction.type === 'complete' || pendingAction.type === 'validate' ? 'text-green-600' :
                pendingAction.type === 'move' ? 'text-purple-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {pendingAction.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {pendingAction.message}
              </p>
            </div>
          </div>

          {pendingAction.type === 'stop' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Le temps écoulé sera enregistré dans vos déclarations. Cette action est irréversible.</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowConfirmDialog(false)
                setPendingAction(null)
              }}
            >
              {pendingAction.cancelButtonText || 'Annuler'}
            </Button>
            <Button
              className={`flex-1 text-white ${pendingAction.confirmButtonClass}`}
              onClick={() => {
                pendingAction.onConfirm()
                setShowConfirmDialog(false)
                setPendingAction(null)
              }}
            >
              {pendingAction.confirmButtonText || 'Confirmer'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const RejectDialog = () => {
    if (!showRejectModal) return null
    
    const sousTache = rejectTaskData 
      ? sousTaches.find(st => st.id === rejectTaskData.sousTacheId)
      : null
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
        <Card className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl animate-in zoom-in duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Rejeter la tâche
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Veuillez indiquer la raison du rejet pour "{sousTache?.titre}" :
          </p>

          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Expliquez pourquoi cette tâche est rejetée..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            rows={4}
            autoFocus
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowRejectModal(false)
                setRejectReason('')
                setRejectTaskData(null)
              }}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectWithReason}
              disabled={!rejectReason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'Confirmer le rejet'
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ========== 14. RENDER ==========
  if (isLoading) {
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
        <Button onClick={loadSubTasks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef7c21] to-[#ff9f4b] flex items-center justify-center shadow-lg">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Tableau Kanban
            </h1>
            <p className="text-gray-500 text-xs flex items-center gap-2 flex-wrap">
              <span>{stats.total} sous-tâches</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {stats.enCours} en cours
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                {stats.aTester} à tester
              </span>
              {stats.enRetard > 0 && (
                <>
                  <span>•</span>
                  <Badge variant="danger" className="text-xs px-2 py-0.5">
                    {stats.enRetard} en retard
                  </Badge>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="!px-2"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadSubTasks}
            disabled={isLoading}
            className="!px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="!px-2"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-blue-200 rounded-xl">
                <Target className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">Validées</p>
                <p className="text-2xl font-bold text-green-900">{stats.validees}</p>
              </div>
              <div className="p-2.5 bg-green-200 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">En cours</p>
                <p className="text-2xl font-bold text-blue-900">{stats.enCours}</p>
              </div>
              <div className="p-2.5 bg-blue-200 rounded-xl">
                <Play className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 font-medium mb-1">À tester</p>
                <p className="text-2xl font-bold text-purple-900">{stats.aTester}</p>
              </div>
              <div className="p-2.5 bg-purple-200 rounded-xl">
                <GitPullRequest className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-700 font-medium mb-1">Rejetées</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejetees}</p>
              </div>
              <div className="p-2.5 bg-red-200 rounded-xl">
                <X className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-700 font-medium mb-1">À faire</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aFaire}</p>
              </div>
              <div className="p-2.5 bg-gray-200 rounded-xl">
                <Clock className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium mb-1">En retard</p>
                <p className="text-2xl font-bold text-amber-900">{stats.enRetard}</p>
              </div>
              <div className="p-2.5 bg-amber-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px]">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white"
              >
                <option value="all">Tous les projets</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id.toString()}>
                    {projet.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-sm"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Masquer' : 'Filtres'}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Statut :</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                    <option key={k} value={k}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <div className="p-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4 min-h-[600px]">
              {Object.entries(KANBAN_COLUMNS).map(
                ([status, { title, bgColor, borderColor, headerColor }]) => {
                  const columnTasks = tasksByColumn[status as SubTaskStatus] || []
                  return (
                    <div
                      key={status}
                      className={`min-w-[280px] rounded-xl border ${borderColor} ${bgColor} flex flex-col`}
                    >
                      <div className={`p-3 border-b ${borderColor} ${headerColor} rounded-t-xl flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status as SubTaskStatus)}
                          <span className="text-sm font-medium">{title}</span>
                        </div>
                        <Badge variant="neutral" className="bg-white/60 text-xs px-2 py-0.5">
                          {columnTasks.length}
                        </Badge>
                      </div>

                      <Droppable droppableId={status}>
                        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-2 min-h-[200px] transition-colors ${
                              snapshot.isDraggingOver ? 'bg-white/40' : ''
                            }`}
                          >
                            {columnTasks.map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`mb-2 rounded-lg border shadow-sm bg-white p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                      snapshot.isDragging
                                        ? 'shadow-xl ring-2 ring-[#ef7c21]/50'
                                        : ''
                                    }`}
                                    onClick={() => handleTaskSelect(
                                      { id: task.tacheId, titre: task.tacheTitre || '', projetNom: task.projetNom },
                                      task
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      {task.estEnRetard && task.statut !== 'Validée' && (
                                        <Badge variant="danger" className="text-xs px-2 py-0.5">
                                          Retard
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="font-medium text-sm mb-2 line-clamp-2">
                                      {task.titre}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="font-medium text-[#ef7c21]">
                                          {task.heuresConsommees.toFixed(1)}
                                        </span>
                                        <span className="text-gray-400">
                                          /{task.dureeEstimeeHeures}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#ef7c21]"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            (task.heuresConsommees / task.dureeEstimeeHeures) * 100
                                          )}%`,
                                        }}
                                      />
                                    </div>

                                    {task.projetNom && (
                                      <div className="mt-2 flex items-center gap-1.5">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: '#ef7c21' }}
                                        />
                                        <span className="text-xs text-gray-500 truncate">
                                          {task.projetNom}
                                        </span>
                                      </div>
                                    )}

                                    {task.statut === 'Rejetée' && task.raisonRejet && (
                                      <div className="mt-2 text-xs text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                                        {task.raisonRejet.length > 40
                                          ? task.raisonRejet.substring(0, 37) + '...'
                                          : task.raisonRejet}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )
                },
              )}
            </div>
          </DragDropContext>
        </div>
      </Card>

      {/* Task Detail Modal */}
      {showSelectionModal && currentTask && currentSubTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-5 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                Détail de la sous-tâche
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSelectionModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Sous-tâche</p>
                  <p className="font-semibold text-base">{currentSubTask.titre}</p>
                  {currentSubTask.description && (
                    <p className="text-xs text-gray-600 mt-1">{currentSubTask.description}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Projet</p>
                  <p className="font-medium text-sm">{currentSubTask.projetNom || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tâche</p>
                  <p className="font-medium text-sm">{currentSubTask.tacheTitre || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <Badge
                    variant={currentSubTask.statut === 'Rejetée' ? 'danger' : 'default'}
                    className={`mt-1 text-xs px-2 py-0.5 ${
                      STATUS_CONFIG[currentSubTask.statut]?.bgColor
                    } ${STATUS_CONFIG[currentSubTask.statut]?.color}`}
                  >
                    {STATUS_CONFIG[currentSubTask.statut]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Heures</p>
                  <p className="font-medium text-sm">
                    {currentSubTask.heuresConsommees.toFixed(1)} / {currentSubTask.dureeEstimeeHeures}h
                  </p>
                </div>
                {currentSubTask.dateDebut && (
                  <div>
                    <p className="text-xs text-gray-500">Début prévu</p>
                    <p className="font-medium text-sm">{formatDate(currentSubTask.dateDebut)}</p>
                  </div>
                )}
                {currentSubTask.dateFin && (
                  <div>
                    <p className="text-xs text-gray-500">Fin prévue</p>
                    <p className="font-medium text-sm">{formatDate(currentSubTask.dateFin)}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Progression</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(100, progression)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{Math.round(progression)}%</span>
                  </div>
                </div>
              </div>

              {/* Affichage des commentaires */}
              {currentSubTask.commentaires && currentSubTask.commentaires.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800 text-sm">
                        Commentaires ({currentSubTask.commentaires.length})
                      </h4>
                      {currentSubTask.commentaires.map((comment) => (
                        <div key={comment.id} className="mt-2 p-2 bg-white/60 rounded border border-blue-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-800">Testeur</span>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(comment.dateTest)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            "{comment.commentaire}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timer actif */}
              {isThisTaskActive && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
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
                    {isRunning ? (
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

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowSelectionModal(false)}>
                Fermer
              </Button>

              {currentSubTask.statut === 'Rejetée' && (
                <Button
                  size="sm"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    handleStartTask(currentTask, currentSubTask)
                    setShowSelectionModal(false)
                  }}
                  disabled={isSubmitting}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reprendre
                </Button>
              )}

              {currentSubTask.statut === 'À tester' && userRole === 'Testeur' && (
                <div className="flex gap-2 flex-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleValidateTest(currentTask.id, currentSubTask.id, 'Réussi')}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Valider
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleValidateTest(currentTask.id, currentSubTask.id, 'Échoué')}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3 mr-1" /> Rejeter
                  </Button>
                </div>
              )}

              {!isThisTaskActive && !['Validée', 'Rejetée', 'À tester'].includes(currentSubTask.statut) && (
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleStartTask(currentTask, currentSubTask)}
                  disabled={isSubmitting}
                >
                  <Play className="h-3 w-3 mr-1" /> Démarrer
                </Button>
              )}

              {isRunning && (
                <Button
                  size="sm"
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={handlePauseTask}
                  disabled={isSubmitting}
                >
                  <Pause className="h-3 w-3 mr-1" /> Pause
                </Button>
              )}

              {isPaused && (
                <Button
                  size="sm"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleResumeTask}
                  disabled={isSubmitting}
                >
                  <Play className="h-3 w-3 mr-1" /> Reprendre
                </Button>
              )}

              {['En cours', 'À faire'].includes(currentSubTask.statut) && (
                <Button
                  size="sm"
                  className="flex-1 bg-[#ef7c21] hover:bg-[#d94e00] text-white"
                  onClick={() => completeTask(currentTask.id, currentSubTask.id)}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Terminer
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <ConfirmationDialog />
      <RejectDialog />

      {/* Floating Timer */}
      {activeTimer && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-[#ef7c21] to-[#f97316] text-white px-4 py-2 rounded-full shadow-2xl">
          <Timer className={`h-4 w-4 ${activeTimer.isRunning ? 'animate-pulse' : ''}`} />
          <div className="font-mono font-medium text-sm">
            {formatSecondsToTime(totalElapsedSeconds)}
          </div>
          {activeTimer.isRunning ? (
            <button
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              onClick={handlePauseTask}
              title="Mettre en pause"
            >
              <Pause className="h-3 w-3" />
            </button>
          ) : (
            <button
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              onClick={handleResumeTask}
              title="Reprendre"
            >
              <Play className="h-3 w-3" />
            </button>
          )}
          <button
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            onClick={handleStopTimer}
            title="Arrêter"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export { TasksKanban as TasksView }
export default TasksKanban