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
  type Commentaire,
} from '../services/subTaskService'
import { getMesProjetsMembre, type ProjetMembre } from '../services/projectService'
import { usePersistedTimer } from '../contexts/usePersistedTimer'

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
  raisonRejet?: string
  rejetDate?: Date
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

const STATUS_CONFIG: Record<SubTaskStatus, {
  label: string; color: string; icon: React.ElementType
  bgColor: string; borderColor: string; textColor: string
}> = {
  'À faire':  { label: 'À faire',  color: 'text-gray-600',  bgColor: 'bg-gray-100',  borderColor: 'border-gray-300',  textColor: 'text-gray-700',  icon: Clock },
  'En cours': { label: 'En cours', color: 'text-blue-600',  bgColor: 'bg-blue-100',  borderColor: 'border-blue-300',  textColor: 'text-blue-700',  icon: Play },
  'À tester': { label: 'À tester', color: 'text-purple-600',bgColor: 'bg-purple-100',borderColor: 'border-purple-300',textColor: 'text-purple-700',icon: GitPullRequest },
  Validée:    { label: 'Validée',  color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300', textColor: 'text-green-700', icon: CheckCircle },
  Rejetée:    { label: 'Rejetée',  color: 'text-red-600',   bgColor: 'bg-red-100',   borderColor: 'border-red-300',   textColor: 'text-red-700',   icon: X },
}

const KANBAN_COLUMNS: Record<SubTaskStatus, {
  title: string; bgColor: string; borderColor: string; headerColor: string
}> = {
  'À faire':  { title: 'À faire',  bgColor: 'bg-gray-50',   borderColor: 'border-gray-200',  headerColor: 'bg-gray-100' },
  'En cours': { title: 'En cours', bgColor: 'bg-blue-50',   borderColor: 'border-blue-200',  headerColor: 'bg-blue-100' },
  'À tester': { title: 'À tester', bgColor: 'bg-purple-50', borderColor: 'border-purple-200',headerColor: 'bg-purple-100' },
  Validée:    { title: 'Validée',  bgColor: 'bg-green-50',  borderColor: 'border-green-200', headerColor: 'bg-green-100' },
  Rejetée:    { title: 'Rejetée',  bgColor: 'bg-red-50',    borderColor: 'border-red-200',   headerColor: 'bg-red-100' },
}


const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatRelativeTime = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return 'inconnu'
  let date: Date
  if (dateInput instanceof Date) {
    date = dateInput
  } else {
    const normalized = !dateInput.endsWith('Z') && !dateInput.includes('+')
      ? dateInput + 'Z' : dateInput
    date = new Date(normalized)
  }
  if (isNaN(date.getTime())) return 'date invalide'
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

const formatSecondsToTime = (s: number) =>
  `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

const getStatusIcon = (status: SubTaskStatus) => {
  const c = STATUS_CONFIG[status]
  if (!c) return null
  const I = c.icon
  return <I className={`h-4 w-4 ${c.color}`} />
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

export function TasksKanban({
  onSelectTask,
  onRefresh,
  userRole = 'Développeur',
  projetId: initialProjetId,
}: TasksViewProps) {
  const [sousTaches, setSousTaches] = useState<SousTache[]>([])
  const [projets, setProjets] = useState<ProjetMembre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjetId?.toString() || 'all')
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
  const [rejectTaskData, setRejectTaskData] = useState<{ tacheId: string; sousTacheId: string } | null>(null)

  const isLoadingRef = useRef(false)
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const commentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Timer ─────────────────────────────────────────────────────────────────
  const recordWorkTime = useCallback(async (subTaskId: string, seconds: number) => {
    if (seconds <= 0) return
    const heures = seconds / 3600
    const dateStr = new Date().toISOString().split('T')[0]
    try {
      await addTimeEntry(parseInt(subTaskId), heures, dateStr)
      setSousTaches(prev => prev.map(st =>
        st.id === subTaskId ? { ...st, heuresConsommees: st.heuresConsommees + heures } : st
      ))
    } catch (err) { console.error('Erreur enregistrement temps:', err) }
  }, [])

  const { activeTimer, timerSeconds: totalElapsedSeconds, startTimer, pauseTimer, resumeTimer, stopTimer } =
    usePersistedTimer(recordWorkTime)

  // ── Chargement données ────────────────────────────────────────────────────
  const refreshAllData = useCallback(async (showSpinner = false) => {
    if (isLoadingRef.current && showSpinner) return
    if (showSpinner) { isLoadingRef.current = true; setIsLoading(true) }

    try {
      const projectIdParam = selectedProjectId !== 'all' ? parseInt(selectedProjectId) : undefined
      const data = await getMySubTasks(projectIdParam)

      const tasksWithDetails = await Promise.all(
        data.map(async st => {
          try {
            const [timeEntries, comments] = await Promise.all([getTimeEntries(st.id), getSubTaskComments(st.id)])
            return { ...st, heuresConsommees: timeEntries.reduce((s, e) => s + e.dureeHeures, 0), commentaires: comments }
          } catch { return { ...st, heuresConsommees: 0, commentaires: [] } }
        })
      )

      const transformed: SousTache[] = tasksWithDetails.map(st => ({
        id: st.id.toString(),
        tacheId: st.tacheId.toString(),
        titre: st.titre,
        description: st.description,
        dureeEstimeeHeures: st.dureeEstimeeHeures,
        statut: normalizeStatus(st.statut),
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
      }))

      setSousTaches(prev => {
        if (activeTimer) {
          return transformed.map(t =>
            t.id === activeTimer.subTaskId && t.statut !== 'En cours' ? { ...t, statut: 'En cours' } : t
          )
        }
        return transformed
      })
    } catch (err) {
      console.error('Erreur rafraîchissement:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      if (showSpinner) { setIsLoading(false); isLoadingRef.current = false }
    }
  }, [selectedProjectId, activeTimer])

  // ── Mise à jour statut ────────────────────────────────────────────────────
  const updateStatus = useCallback(async (subTaskId: string, newStatus: SubTaskStatus) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const apiStatusMap: Record<SubTaskStatus, string> = {
      'À faire': 'AFaire', 'En cours': 'EnCours', 'À tester': 'ATester', Validée: 'Validee', Rejetée: 'Rejetee',
    }
    try {
      await updateSubTaskStatus(parseInt(subTaskId), apiStatusMap[newStatus])
      setSousTaches(prev => prev.map(st => st.id === subTaskId ? { ...st, statut: newStatus } : st))
      setTimeout(() => refreshAllData(false), 500)
    } catch (err) { console.error('Erreur statut:', err); throw err }
    finally { setIsSubmitting(false) }
  }, [isSubmitting, refreshAllData])

  const handleValidateTask = useCallback(async (subTaskId: string) => {
    try {
      await validateSubTask(parseInt(subTaskId))
      setSousTaches(prev => prev.map(st => st.id === subTaskId ? { ...st, statut: 'Validée' } : st))
      setShowSelectionModal(false)
      setTimeout(() => refreshAllData(false), 500)
      window.dispatchEvent(new CustomEvent('task-status-changed', { detail: { subTaskId, status: 'validated' } }))
    } catch (err) { console.error('Erreur validation:', err); setError('Erreur lors de la validation') }
  }, [refreshAllData])

  const handleRejectTask = useCallback(async (subTaskId: string, reason: string) => {
    try {
      await rejectSubTask(parseInt(subTaskId), reason)
      setSousTaches(prev => prev.map(st =>
        st.id === subTaskId ? { ...st, statut: 'Rejetée', raisonRejet: reason, rejetDate: new Date() } : st
      ))
      setShowSelectionModal(false)
      setTimeout(() => refreshAllData(false), 500)
      window.dispatchEvent(new CustomEvent('task-status-changed', { detail: { subTaskId, status: 'rejected', reason } }))
    } catch (err) { console.error('Erreur rejet:', err); setError('Erreur lors du rejet') }
  }, [refreshAllData])

  // ── Confirm dialog ────────────────────────────────────────────────────────
  const confirmAction = useCallback((type: ConfirmationAction['type'], data: any, onConfirm: () => void) => {
    const configs: Record<ConfirmationAction['type'], { title: string; message: string; Icon: React.ElementType; btnClass: string }> = {
      start:    { title: 'Démarrer la tâche',  message: `Démarrer "${data.titre}" ?`,                        Icon: Play,         btnClass: 'bg-green-600 hover:bg-green-700' },
      pause:    { title: 'Mettre en pause',     message: 'Mettre le timer en pause ?',                        Icon: Pause,        btnClass: 'bg-yellow-600 hover:bg-yellow-700' },
      resume:   { title: 'Reprendre la tâche',  message: 'Reprendre le timer ?',                              Icon: Play,         btnClass: 'bg-blue-600 hover:bg-blue-700' },
      stop:     { title: 'Arrêter le timer',    message: 'Le temps écoulé sera enregistré.',                  Icon: Square,       btnClass: 'bg-red-600 hover:bg-red-700' },
      complete: { title: 'Terminer la tâche',   message: `"${data.titre}" passera en "À tester".`,            Icon: CheckCircle,  btnClass: 'bg-green-600 hover:bg-green-700' },
      reject:   { title: 'Rejeter la tâche',    message: `Rejeter "${data.titre}" ?`,                         Icon: X,            btnClass: 'bg-red-600 hover:bg-red-700' },
      validate: { title: 'Valider la tâche',    message: `Valider "${data.titre}" ?`,                         Icon: CheckCircle,  btnClass: 'bg-green-600 hover:bg-green-700' },
      move:     { title: 'Déplacer la tâche',   message: `Déplacer "${data.titre}" vers "${data.destination}" ?`, Icon: GitPullRequest, btnClass: 'bg-purple-600 hover:bg-purple-700' },
    }
    const { title, message, Icon, btnClass } = configs[type]
    setPendingAction({ type, title, message, confirmButtonText: 'Confirmer', cancelButtonText: 'Annuler', icon: Icon, confirmButtonClass: btnClass, data, onConfirm })
    setShowConfirmDialog(true)
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStartTask = useCallback((tache: Tache, sousTache: SousTache) => {
    confirmAction('start', { titre: sousTache.titre }, async () => {
      await startTimer(sousTache.id, tache.id)
      await updateStatus(sousTache.id, 'En cours')
    })
  }, [startTimer, confirmAction, updateStatus])

  const handlePauseTask = useCallback(() => {
    if (!activeTimer) return
    const st = sousTaches.find(s => s.id === activeTimer.subTaskId)
    confirmAction('pause', { titre: st?.titre }, pauseTimer)
  }, [activeTimer, sousTaches, pauseTimer, confirmAction])

  const handleResumeTask = useCallback(() => {
    if (!activeTimer) return
    const st = sousTaches.find(s => s.id === activeTimer.subTaskId)
    confirmAction('resume', { titre: st?.titre }, resumeTimer)
  }, [activeTimer, sousTaches, resumeTimer, confirmAction])

  const handleStopTimer = useCallback(() => {
    if (!activeTimer) return
    const st = sousTaches.find(s => s.id === activeTimer.subTaskId)
    confirmAction('stop', { titre: st?.titre }, stopTimer)
  }, [activeTimer, sousTaches, stopTimer, confirmAction])

  const completeTask = useCallback((tacheId: string, sousTacheId: string) => {
    const st = sousTaches.find(s => s.id === sousTacheId)
    if (!st) return
    confirmAction('complete', { titre: st.titre }, async () => {
      await stopTimer(); await updateStatus(sousTacheId, 'À tester'); setShowSelectionModal(false)
    })
  }, [sousTaches, stopTimer, updateStatus, confirmAction])

  const handleValidateTest = useCallback((tacheId: string, sousTacheId: string, resultat: TestResult) => {
    const st = sousTaches.find(s => s.id === sousTacheId)
    if (!st) return
    if (resultat === 'Réussi') {
      confirmAction('validate', { titre: st.titre }, async () => { await handleValidateTask(sousTacheId) })
    } else {
      setRejectTaskData({ tacheId, sousTacheId }); setShowRejectModal(true)
    }
  }, [sousTaches, handleValidateTask, confirmAction])

  const handleRejectWithReason = useCallback(() => {
    if (!rejectTaskData || !rejectReason.trim()) return
    const st = sousTaches.find(s => s.id === rejectTaskData.sousTacheId)
    confirmAction('reject', { titre: st?.titre }, async () => {
      await handleRejectTask(rejectTaskData.sousTacheId, rejectReason)
      setShowRejectModal(false); setRejectReason(''); setRejectTaskData(null)
    })
  }, [rejectTaskData, rejectReason, sousTaches, handleRejectTask, confirmAction])

  const handleTaskSelect = useCallback(async (tache: Tache, sousTache: SousTache) => {
    setSelectedTaskForModal(tache)
    setSelectedSubTaskForModal(sousTache)
    try {
      const comments = await getSubTaskComments(parseInt(sousTache.id))
      setSousTaches(prev => prev.map(st => st.id === sousTache.id ? { ...st, commentaires: comments } : st))
      setSelectedSubTaskForModal(prev => prev ? { ...prev, commentaires: comments } : prev)
    } catch (err) { console.error('Erreur commentaires:', err) }
    setShowSelectionModal(true)
    onSelectTask?.(tache, sousTache)
  }, [onSelectTask])

  const refreshCommentsInModal = useCallback(async () => {
    if (!currentSubTask) return
    try {
      const comments = await getSubTaskComments(parseInt(currentSubTask.id))
      setSousTaches(prev => prev.map(st => st.id === currentSubTask.id ? { ...st, commentaires: comments } : st))
      setSelectedSubTaskForModal(prev => prev ? { ...prev, commentaires: comments } : prev)
    } catch (err) { console.error('Erreur commentaires:', err) }
  }, [])

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    getMesProjetsMembre().then(setProjets).catch(console.error)
  }, [])

  useEffect(() => { refreshAllData(true) }, [refreshAllData])
  useEffect(() => { if (onRefresh) refreshAllData(false) }, [onRefresh, refreshAllData])

  // ── Auto-refresh INVISIBLE — statuts toutes les 10s ──────────────────────
  useEffect(() => {
    statusIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') refreshAllData(false)
    }, 10_000)
    return () => { if (statusIntervalRef.current) clearInterval(statusIntervalRef.current) }
  }, [refreshAllData])

  // ── Auto-refresh INVISIBLE — commentaires toutes les 3s ─────────────────
  useEffect(() => {
    commentIntervalRef.current = setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      const toRefresh = sousTaches.filter(st => st.statut === 'À tester' || st.statut === 'Rejetée')
      for (const task of toRefresh) {
        try {
          const comments = await getSubTaskComments(parseInt(task.id))
          setSousTaches(prev => prev.map(st =>
            st.id === task.id && JSON.stringify(st.commentaires) !== JSON.stringify(comments)
              ? { ...st, commentaires: comments } : st
          ))
          setSelectedSubTaskForModal(prev =>
            prev?.id === task.id ? { ...prev, commentaires: comments } : prev
          )
        } catch { /* silencieux */ }
      }
    }, 3_000)
    return () => { if (commentIntervalRef.current) clearInterval(commentIntervalRef.current) }
  }, [sousTaches])

  // ── Rafraîchir au retour de l'onglet ─────────────────────────────────────
  useEffect(() => {
    const fn = () => { if (document.visibilityState === 'visible') refreshAllData(false) }
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [refreshAllData])

  // ── Écouter événements externes ──────────────────────────────────────────
  useEffect(() => {
    const fn = () => refreshAllData(false)
    window.addEventListener('project-updated', fn)
    window.addEventListener('task-status-changed', fn)
    window.addEventListener('task-validated', fn)
    window.addEventListener('task-rejected', fn)
    return () => {
      window.removeEventListener('project-updated', fn)
      window.removeEventListener('task-status-changed', fn)
      window.removeEventListener('task-validated', fn)
      window.removeEventListener('task-rejected', fn)
    }
  }, [refreshAllData])

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const destStatus = destination.droppableId as SubTaskStatus
    const sourceStatus = source.droppableId as SubTaskStatus
    const task = sousTaches.find(st => st.id === draggableId)
    if (!task) return
    if (destStatus === 'Validée') { alert("❌ Une tâche ne peut être validée que via le bouton 'Valider'."); return }
    if (sourceStatus === 'Validée') { alert("❌ Impossible de déplacer une tâche déjà validée."); return }
    if (sourceStatus === 'Rejetée') { alert("❌ Une tâche rejetée doit être reprise via le bouton 'Reprendre'."); return }
    confirmAction('move', { titre: task.titre, destination: KANBAN_COLUMNS[destStatus].title }, async () => {
      await updateStatus(draggableId, destStatus)
    })
  }, [sousTaches, updateStatus, confirmAction])

  // ── Mémos ─────────────────────────────────────────────────────────────────
  const sousTachesFiltrees = useMemo(() => {
    let r = [...sousTaches]
    if (filterStatus !== 'all') r = r.filter(st => st.statut === filterStatus)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      r = r.filter(st => st.titre.toLowerCase().includes(q) || st.tacheTitre?.toLowerCase().includes(q) || st.projetNom?.toLowerCase().includes(q))
    }
    return r
  }, [sousTaches, filterStatus, searchQuery])

  const stats = useMemo(() => ({
    total: sousTaches.length,
    validees: sousTaches.filter(s => s.statut === 'Validée').length,
    enCours: sousTaches.filter(s => s.statut === 'En cours').length,
    aTester: sousTaches.filter(s => s.statut === 'À tester').length,
    rejetees: sousTaches.filter(s => s.statut === 'Rejetée').length,
    aFaire: sousTaches.filter(s => s.statut === 'À faire').length,
    enRetard: sousTaches.filter(s => s.estEnRetard && s.statut !== 'Validée').length,
  }), [sousTaches])

  const tasksByColumn = useMemo(() => {
    const g: Record<SubTaskStatus, SousTache[]> = { 'À faire': [], 'En cours': [], 'À tester': [], Validée: [], Rejetée: [] }
    sousTachesFiltrees.forEach(t => { if (g[t.statut]) g[t.statut].push(t) })
    return g
  }, [sousTachesFiltrees])

  const currentSubTask = useMemo(() =>
    selectedSubTaskForModal ? sousTaches.find(st => st.id === selectedSubTaskForModal.id) ?? null : null,
    [sousTaches, selectedSubTaskForModal]
  )

  const currentTask = useMemo(() =>
    selectedTaskForModal ? { id: selectedTaskForModal.id, titre: selectedTaskForModal.titre, projetNom: selectedTaskForModal.projetNom } : null,
    [selectedTaskForModal]
  )

  const isThisTaskActive = activeTimer?.subTaskId === currentSubTask?.id
  const isRunning = isThisTaskActive && activeTimer?.isRunning
  const isPaused = isThisTaskActive && !activeTimer?.isRunning
  const progression = currentSubTask ? (currentSubTask.heuresConsommees / currentSubTask.dureeEstimeeHeures) * 100 : 0

  // ── Modals inline ─────────────────────────────────────────────────────────

  const ConfirmationDialog = () => {
    if (!showConfirmDialog || !pendingAction) return null
    const Icon = pendingAction.icon
    const isPositive = ['start', 'resume', 'complete', 'validate'].includes(pendingAction.type)
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
        <Card className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100' : pendingAction.type === 'pause' ? 'bg-yellow-100' : pendingAction.type === 'move' ? 'bg-purple-100' : 'bg-red-100'}`}>
              <Icon className={`h-7 w-7 ${isPositive ? 'text-green-600' : pendingAction.type === 'pause' ? 'text-yellow-600' : pendingAction.type === 'move' ? 'text-purple-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{pendingAction.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{pendingAction.message}</p>
            </div>
          </div>
          {pendingAction.type === 'stop' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                Le temps écoulé sera enregistré. Cette action est irréversible.
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => { setShowConfirmDialog(false); setPendingAction(null) }}>
              {pendingAction.cancelButtonText}
            </Button>
            <Button className={`flex-1 text-white ${pendingAction.confirmButtonClass}`}
              onClick={() => { pendingAction.onConfirm(); setShowConfirmDialog(false); setPendingAction(null) }}>
              {pendingAction.confirmButtonText}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const RejectDialog = () => {
    if (!showRejectModal) return null
    const st = rejectTaskData ? sousTaches.find(s => s.id === rejectTaskData.sousTacheId) : null
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
        <Card className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Rejeter la tâche</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Raison du rejet pour "{st?.titre}" :</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Expliquez pourquoi…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4" rows={4} autoFocus />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectTaskData(null) }}>Annuler</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleRejectWithReason} disabled={!rejectReason.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirmer le rejet'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (isLoading && sousTaches.length === 0) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" /></div>
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => refreshAllData(true)}><RefreshCw className="h-4 w-4 mr-2" /> Réessayer</Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef7c21] to-[#ff9f4b] flex items-center justify-center shadow-lg">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau Kanban</h1>
            <p className="text-gray-500 text-xs flex items-center gap-2 flex-wrap">
              <span>{stats.total} sous-tâches</span>
              <span>•</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{stats.enCours} en cours</span>
              <span>•</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />{stats.aTester} à tester</span>
              {stats.enRetard > 0 && <><span>•</span><Badge variant="danger" className="text-xs px-2 py-0.5">{stats.enRetard} en retard</Badge></>}
            </p>
          </div>
        </div>

        {/* Contrôles header — sans le bouton Auto ni indicateur refresh */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="!px-2" title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
         
          <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} className="!px-2" title="Statistiques">
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total',    value: stats.total,    Icon: Target,        from: 'from-blue-50',   to: 'to-blue-100/50',   border: 'border-blue-200',  bg: 'bg-blue-200',  ic: 'text-blue-700',  num: 'text-blue-900' },
            { label: 'Validées', value: stats.validees, Icon: CheckCircle,   from: 'from-green-50',  to: 'to-green-100/50',  border: 'border-green-200', bg: 'bg-green-200', ic: 'text-green-700', num: 'text-green-900' },
            { label: 'En cours', value: stats.enCours,  Icon: Play,          from: 'from-blue-50',   to: 'to-blue-100/50',   border: 'border-blue-200',  bg: 'bg-blue-200',  ic: 'text-blue-700',  num: 'text-blue-900' },
            { label: 'À tester', value: stats.aTester,  Icon: GitPullRequest,from: 'from-purple-50', to: 'to-purple-100/50', border: 'border-purple-200',bg: 'bg-purple-200',ic: 'text-purple-700',num: 'text-purple-900' },
            { label: 'Rejetées', value: stats.rejetees, Icon: X,             from: 'from-red-50',    to: 'to-red-100/50',    border: 'border-red-200',   bg: 'bg-red-200',   ic: 'text-red-700',   num: 'text-red-900' },
            { label: 'À faire',  value: stats.aFaire,   Icon: Clock,         from: 'from-gray-50',   to: 'to-gray-100/50',   border: 'border-gray-200',  bg: 'bg-gray-200',  ic: 'text-gray-700',  num: 'text-gray-900' },
            { label: 'En retard',value: stats.enRetard, Icon: AlertCircle,   from: 'from-amber-50',  to: 'to-amber-100/50',  border: 'border-amber-200', bg: 'bg-amber-200', ic: 'text-amber-700', num: 'text-amber-900' },
          ].map(({ label, value, Icon, from, to, border, bg, ic, num }) => (
            <Card key={label} className={`p-4 bg-gradient-to-br ${from} ${to} ${border}`}>
              <div className="flex items-center justify-between">
                <div><p className={`text-xs font-medium mb-1 ${ic}`}>{label}</p><p className={`text-2xl font-bold ${num}`}>{value}</p></div>
                <div className={`p-2.5 ${bg} rounded-xl`}><Icon className={`h-5 w-5 ${ic}`} /></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Filtres + Board ── */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px]">
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                <option value="all">Tous les projets</option>
                {projets.map(p => <option key={p.id} value={p.id.toString()}>{p.nom}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Rechercher une tâche…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-sm">
              <Filter className="h-4 w-4" />{showFilters ? 'Masquer' : 'Filtres'}
            </Button>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
              <span className="text-sm text-gray-600">Statut :</span>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                <option value="all">Tous</option>
                {Object.entries(STATUS_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <div className="p-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4 min-h-[600px]">
              {Object.entries(KANBAN_COLUMNS).map(([status, { title, bgColor, borderColor, headerColor }]) => {
                const columnTasks = tasksByColumn[status as SubTaskStatus] || []
                return (
                  <div key={status} className={`min-w-[280px] rounded-xl border ${borderColor} ${bgColor} flex flex-col`}>
                    <div className={`p-3 border-b ${borderColor} ${headerColor} rounded-t-xl flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status as SubTaskStatus)}
                        <span className="text-sm font-medium">{title}</span>
                      </div>
                      <Badge variant="neutral" className="bg-white/60 text-xs px-2 py-0.5">{columnTasks.length}</Badge>
                    </div>
                    <Droppable droppableId={status}>
                      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 p-2 min-h-[200px] max-h-[500px] overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-white/40' : ''}`}>
                          {columnTasks.map((task, index) => {
                            const isActive = activeTimer?.subTaskId === task.id
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                    className={`mb-2 rounded-lg border shadow-sm bg-white p-3 cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[#ef7c21]/50' : ''} ${isActive ? 'ring-2 ring-[#ef7c21] ring-offset-1' : ''}`}
                                    onClick={() => handleTaskSelect({ id: task.tacheId, titre: task.tacheTitre || '', projetNom: task.projetNom }, task)}>
                                    <div className="flex items-center justify-between mb-2">
                                      {task.estEnRetard && task.statut !== 'Validée' && <Badge variant="danger" className="text-xs px-2 py-0.5">Retard</Badge>}
                                      {isActive && (
                                        <div className="flex items-center gap-1 ml-auto text-xs font-mono font-bold text-[#ef7c21]">
                                          <Timer className={`h-3 w-3 ${activeTimer?.isRunning ? 'animate-pulse' : ''}`} />
                                          {formatSecondsToTime(totalElapsedSeconds)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="font-medium text-sm mb-2 line-clamp-2">{task.titre}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="font-medium text-[#ef7c21]">{task.heuresConsommees.toFixed(1)}</span>
                                      <span className="text-gray-400">/{task.dureeEstimeeHeures}h</span>
                                    </div>
                                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#ef7c21]" style={{ width: `${Math.min(100, (task.heuresConsommees / task.dureeEstimeeHeures) * 100)}%` }} />
                                    </div>
                                    {task.projetNom && (
                                      <div className="mt-2 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#ef7c21]" />
                                        <span className="text-xs text-gray-500 truncate">{task.projetNom}</span>
                                      </div>
                                    )}
                                    {task.statut === 'Rejetée' && task.raisonRejet && (
                                      <div className="mt-2 text-xs text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                                        {task.raisonRejet.length > 40 ? task.raisonRejet.slice(0, 37) + '...' : task.raisonRejet}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      </Card>

      {/* ── Modal détail ── */}
      {showSelectionModal && currentTask && currentSubTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-5 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="text-lg font-bold text-gray-900">Détail de la sous-tâche</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSelectionModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Sous-tâche</p>
                  <p className="font-semibold text-base">{currentSubTask.titre}</p>
                  {currentSubTask.description && <p className="text-xs text-gray-600 mt-1">{currentSubTask.description}</p>}
                </div>
                <div><p className="text-xs text-gray-500">Projet</p><p className="font-medium text-sm">{currentSubTask.projetNom || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Tâche</p><p className="font-medium text-sm">{currentSubTask.tacheTitre || '-'}</p></div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <Badge variant={currentSubTask.statut === 'Rejetée' ? 'danger' : 'default'}
                    className={`mt-1 text-xs px-2 py-0.5 ${STATUS_CONFIG[currentSubTask.statut]?.bgColor} ${STATUS_CONFIG[currentSubTask.statut]?.color}`}>
                    {STATUS_CONFIG[currentSubTask.statut]?.label}
                  </Badge>
                </div>
                <div><p className="text-xs text-gray-500">Heures</p><p className="font-medium text-sm">{currentSubTask.heuresConsommees.toFixed(1)} / {currentSubTask.dureeEstimeeHeures}h</p></div>
                {currentSubTask.dateDebut && <div><p className="text-xs text-gray-500">Début prévu</p><p className="font-medium text-sm">{formatDate(currentSubTask.dateDebut)}</p></div>}
                {currentSubTask.dateFin && <div><p className="text-xs text-gray-500">Fin prévue</p><p className="font-medium text-sm">{formatDate(currentSubTask.dateFin)}</p></div>}
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Progression</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, progression)}%` }} />
                    </div>
                    <span className="text-xs font-medium">{Math.round(progression)}%</span>
                  </div>
                </div>
              </div>

              {/* Commentaires */}
              {currentSubTask.commentaires && currentSubTask.commentaires.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                      <h4 className="font-semibold text-blue-800 text-sm">Commentaires ({currentSubTask.commentaires.length})</h4>
                    </div>
                    <button onClick={refreshCommentsInModal} className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100" title="Rafraîchir">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {currentSubTask.commentaires.map(c => (
                      <div key={c.id} className="p-2 bg-white/60 rounded border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-800">Testeur</span>
                          <span className="text-xs text-gray-500">{formatRelativeTime(c.dateTest)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">"{c.commentaire}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentSubTask.statut === 'À tester' && (!currentSubTask.commentaires || currentSubTask.commentaires.length === 0) && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Aucun commentaire pour le moment</p>
                </div>
              )}

              {/* Timer actif */}
              {isThisTaskActive && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium text-amber-800">Temps écoulé</span></div>
                    <span className="text-xl font-mono font-bold text-amber-800">{formatSecondsToTime(totalElapsedSeconds)}</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                    {isRunning ? <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />En cours…</> : <><span className="w-2 h-2 bg-yellow-500 rounded-full" />En pause</>}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowSelectionModal(false)}>Fermer</Button>
              {currentSubTask.statut === 'Rejetée' && (
                <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={isSubmitting}
                  onClick={() => { handleStartTask(currentTask, currentSubTask); setShowSelectionModal(false) }}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reprendre
                </Button>
              )}
              {currentSubTask.statut === 'À tester' && userRole === 'Testeur' && (
                <div className="flex gap-2 flex-1">
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}
                    onClick={() => handleValidateTest(currentTask.id, currentSubTask.id, 'Réussi')}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Valider
                  </Button>
                  <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}
                    onClick={() => handleValidateTest(currentTask.id, currentSubTask.id, 'Échoué')}>
                    <X className="h-3 w-3 mr-1" /> Rejeter
                  </Button>
                </div>
              )}
              {!isThisTaskActive && !['Validée', 'Rejetée', 'À tester'].includes(currentSubTask.statut) && (
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}
                  onClick={() => handleStartTask(currentTask, currentSubTask)}>
                  <Play className="h-3 w-3 mr-1" /> Démarrer
                </Button>
              )}
              {isRunning && (
                <Button size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isSubmitting} onClick={handlePauseTask}>
                  <Pause className="h-3 w-3 mr-1" /> Pause
                </Button>
              )}
              {isPaused && (
                <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={isSubmitting} onClick={handleResumeTask}>
                  <Play className="h-3 w-3 mr-1" /> Reprendre
                </Button>
              )}
              {['En cours', 'À faire'].includes(currentSubTask.statut) && (
                <Button size="sm" className="flex-1 bg-[#ef7c21] hover:bg-[#d94e00] text-white" disabled={isSubmitting}
                  onClick={() => completeTask(currentTask.id, currentSubTask.id)}>
                  <CheckCircle className="h-3 w-3 mr-1" /> Terminer
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      <ConfirmationDialog />
      <RejectDialog />

      {/* ── Timer flottant ── */}
      {activeTimer && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-[#ef7c21] to-[#f97316] text-white px-4 py-2 rounded-full shadow-2xl">
          <Timer className={`h-4 w-4 ${activeTimer.isRunning ? 'animate-pulse' : ''}`} />
          <div className="font-mono font-medium text-sm">{formatSecondsToTime(totalElapsedSeconds)}</div>
          {activeTimer.isRunning
            ? <button className="text-white hover:bg-white/20 rounded-full p-1 transition-colors" onClick={handlePauseTask} title="Pause"><Pause className="h-3 w-3" /></button>
            : <button className="text-white hover:bg-white/20 rounded-full p-1 transition-colors" onClick={handleResumeTask} title="Reprendre"><Play className="h-3 w-3" /></button>}
          <button className="text-white hover:bg-white/20 rounded-full p-1 transition-colors" onClick={handleStopTimer} title="Arrêter"><Square className="h-3 w-3" /></button>
        </div>
      )}
    </div>
  )
}

export { TasksKanban as TasksView }
export default TasksKanban