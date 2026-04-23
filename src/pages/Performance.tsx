import { useCallback, useEffect, useMemo, useState, useRef, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  CheckCircle2,
  AlertCircle,
  X,
  User,
  History,
  BarChart3,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Search,
  List,
  Clock,
  Loader2,
  RefreshCw,
  Bell,
  CheckCheck,
} from 'lucide-react'
import {
  getSubTasksToTest,
  validateSubTask,
  rejectSubTask,
  type SubTaskToTest,
} from '../services/validatorService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValidationHistoryItem {
  id: string
  subTaskId: number
  subTaskTitle: string
  taskTitle: string
  project: string
  phase: string
  validatedBy: string
  validatedAt: Date
  status: 'validated' | 'rejected'
  comments: string
}

interface SubTask {
  id: string
  title: string
  estimatedHours: number
  tacheTitre?: string
  phase?: string
  projetNom?: string
}

interface ValidatorViewProps {
  validatorName?: string
  projetId?: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const HISTORY_KEY = 'validator_history'
const REFRESH_INTERVAL = 10_000 // 10 s

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const formatDateTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const loadHistoryFromStorage = (): ValidationHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as any[]).map(item => ({
      ...item,
      validatedAt: new Date(item.validatedAt),
    }))
  } catch { return [] }
}

const saveHistoryToStorage = (h: ValidationHistoryItem[]) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)) } catch {}
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ValidatorView({ validatorName = 'Validateur', projetId }: ValidatorViewProps) {

  // ── State ────────────────────────────────────────────────────────────────
  const [subTasks, setSubTasks]             = useState<SubTask[]>([])
  const [history, setHistory]               = useState<ValidationHistoryItem[]>(() => loadHistoryFromStorage())
  const [isLoading, setIsLoading]           = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [viewMode, setViewMode]             = useState<'queue' | 'history' | 'stats'>('queue')
  const [searchQuery, setSearchQuery]       = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason]     = useState('')
  // ← CLÉS : deux états séparés pour éviter le blocage visuel
  const [submittingId, setSubmittingId]     = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh]       = useState(true)
  const [lastRefresh, setLastRefresh]       = useState(new Date())
  // Toast de confirmation
  const [toast, setToast]                   = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const isLoadingRef  = useRef(false)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Chargement des tâches ────────────────────────────────────────────────
  const loadTasks = useCallback(async (showSpinner = true) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    if (showSpinner) setIsLoading(true)
    setError(null)

    try {
      const data = await getSubTasksToTest(projetId)
      setSubTasks(
        data.map(st => ({
          id: st.id.toString(),
          title: st.titre,
          estimatedHours: st.dureeEstimeeHeures,
          tacheTitre: st.tache,
          phase: st.phase,
          projetNom: st.projet,
        }))
      )
      setLastRefresh(new Date())
    } catch {
      setError('Impossible de charger les tâches à tester.')
    } finally {
      if (showSpinner) setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [projetId])

  // ── Ajouter à l'historique ────────────────────────────────────────────────
  const pushHistory = useCallback((
    task: SubTask,
    status: 'validated' | 'rejected',
    comments: string
  ) => {
    const item: ValidationHistoryItem = {
      id: `VH-${Date.now()}`,
      subTaskId: parseInt(task.id),
      subTaskTitle: task.title,
      taskTitle: task.tacheTitre || 'Tâche',
      project: task.projetNom || 'Projet',
      phase: task.phase || '-',
      validatedBy: validatorName,
      validatedAt: new Date(),
      status,
      comments,
    }
    setHistory(prev => {
      const next = [item, ...prev]
      saveHistoryToStorage(next)
      return next
    })
  }, [validatorName])

  // ── VALIDER — mise à jour instantanée de l'UI ─────────────────────────────
  const handleValidate = useCallback(async (task: SubTask) => {
    if (submittingId) return
    setSubmittingId(task.id)

    // 1. Mise à jour OPTIMISTE immédiate
    setSubTasks(prev => prev.filter(s => s.id !== task.id))
    setSelectedId(null)
    setShowRejectForm(false)

    try {
      await validateSubTask(parseInt(task.id))
      pushHistory(task, 'validated', 'Validé avec succès')
      showToast(`✅ "${task.title}" validée`, 'ok')
      window.dispatchEvent(new CustomEvent('task-validated', { detail: { subTaskId: task.id } }))
    } catch {
      // 2. Rollback si erreur API
      setSubTasks(prev => [task, ...prev])
      setError('Erreur lors de la validation. Réessayez.')
      showToast('Erreur lors de la validation', 'err')
    } finally {
      setSubmittingId(null)
    }
  }, [submittingId, pushHistory, showToast])

  // ── REJETER — mise à jour instantanée de l'UI ─────────────────────────────
  const handleReject = useCallback(async (task: SubTask, reason: string) => {
    if (submittingId || !reason.trim()) return
    setSubmittingId(task.id)

    // 1. Mise à jour OPTIMISTE immédiate
    setSubTasks(prev => prev.filter(s => s.id !== task.id))
    setSelectedId(null)
    setShowRejectForm(false)
    setRejectReason('')

    try {
      await rejectSubTask(parseInt(task.id), reason)
      pushHistory(task, 'rejected', reason)
      showToast(`❌ "${task.title}" rejetée`, 'ok')
      window.dispatchEvent(new CustomEvent('task-rejected', { detail: { subTaskId: task.id, reason } }))
    } catch {
      // 2. Rollback si erreur API
      setSubTasks(prev => [task, ...prev])
      setError('Erreur lors du rejet. Réessayez.')
      showToast('Erreur lors du rejet', 'err')
    } finally {
      setSubmittingId(null)
    }
  }, [submittingId, pushHistory, showToast])

  // ── Sélection d'une tâche ─────────────────────────────────────────────────
  const selectTask = (id: string) => {
    setSelectedId(prev => prev === id ? null : id)
    setShowRejectForm(false)
    setRejectReason('')
  }

  // ── Refresh manuel ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    loadTasks(true)
    setHistory(loadHistoryFromStorage())
  }, [loadTasks])

  // ── Effacer l'historique ──────────────────────────────────────────────────
  const clearHistory = () => {
    if (!window.confirm("Effacer tout l'historique ?")) return
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { loadTasks(true) }, [loadTasks])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') loadTasks(false)
    }, REFRESH_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, loadTasks])

  // Refresh quand l'onglet redevient visible
  useEffect(() => {
    const fn = () => { if (document.visibilityState === 'visible') loadTasks(false) }
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [loadTasks])

  // Écouter des événements externes
  useEffect(() => {
    const fn = () => loadTasks(false)
    window.addEventListener('project-updated', fn)
    window.addEventListener('task-status-changed', fn)
    return () => { window.removeEventListener('project-updated', fn); window.removeEventListener('task-status-changed', fn) }
  }, [loadTasks])

  // ── Mémos ─────────────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return subTasks
    const q = searchQuery.toLowerCase()
    return subTasks.filter(st =>
      st.title.toLowerCase().includes(q) ||
      st.tacheTitre?.toLowerCase().includes(q) ||
      st.projetNom?.toLowerCase().includes(q)
    )
  }, [subTasks, searchQuery])

  const stats = useMemo(() => {
    const validated = history.filter(h => h.status === 'validated').length
    const rejected  = history.filter(h => h.status === 'rejected').length
    const total     = validated + rejected
    return { totalToTest: subTasks.length, validated, rejected, totalProcessed: total, successRate: total > 0 ? Math.round((validated / total) * 100) : 0 }
  }, [subTasks.length, history])

  const selectedTask = useMemo(() => subTasks.find(s => s.id === selectedId) ?? null, [subTasks, selectedId])

  // ── Rendu de chargement ───────────────────────────────────────────────────
  if (isLoading && subTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[#ef7c21]" />
      </div>
    )
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ef7c21] to-[#ff9f4b] flex items-center justify-center shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VALIDATION</h1>
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
              <span>
                {stats.totalToTest === 0
                  ? 'Aucune tâche en attente'
                  : `${stats.totalToTest} tâche${stats.totalToTest > 1 ? 's' : ''} à tester`}
              </span>
              {autoRefresh && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Bell className="h-3 w-3" /> Auto-refresh
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle auto-refresh */}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            title={autoRefresh ? "Désactiver l'auto-refresh" : "Activer l'auto-refresh"}
            className={`p-2 rounded-lg border transition-all ${
              autoRefresh ? 'bg-[#ef7c21] border-[#ef7c21] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-[#ef7c21]'
            }`}>
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          {/* Tabs vue */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {([
              ['queue',   List,    "File d'attente"],
              ['history', History, 'Historique'],
              ['stats',   BarChart3, 'Stats'],
            ] as const).map(([mode, Icon, label]) => (
              <button key={mode} onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                  viewMode === mode ? 'bg-[#ef7c21] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-5 w-5" />{error}</div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ==================== QUEUE ==================== */}
      {viewMode === 'queue' && (
        <Card className="overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-4 bg-gray-50/50 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, tâche ou projet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
              />
            </div>
          </div>

          <div className="p-6">
            {/* Vide */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <CheckCheck className="h-14 w-14 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {searchQuery ? 'Aucun résultat' : 'Toutes les tâches sont traitées !'}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchQuery ? 'Essayez un autre terme de recherche.' : 'Il n\'y a rien à valider pour le moment.'}
                </p>
                
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => {
                  const isSelected = selectedId === task.id
                  const isThisSubmitting = submittingId === task.id

                  return (
                    <div key={task.id} className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                      isSelected ? 'border-[#ef7c21] shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}>
                      {/* ── Résumé cliquable ── */}
                      <div
                        className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-[#ef7c21]/5' : 'bg-white hover:bg-gray-50'}`}
                        onClick={() => selectTask(task.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                À tester
                              </span>
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {task.title}
                              </span>
                              {isThisSubmitting && <Loader2 className="h-3 w-3 animate-spin text-[#ef7c21]" />}
                            </div>
                            <p className="text-xs text-gray-500 mb-1.5">
                              Tâche : <span className="font-medium">{task.tacheTitre || '-'}</span>
                              {' • '}Projet : <span className="font-medium">{task.projetNom || '-'}</span>
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />Phase : {task.phase || '-'}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimatedHours}h estimées</span>
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-[#ef7c21]' : ''}`} />
                        </div>
                      </div>

                      {/* ── Panel d'action (visible quand sélectionnée) ── */}
                      {isSelected && (
                        <div className="border-t border-[#ef7c21]/20 bg-white p-4 space-y-3">
                          {!showRejectForm ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* VALIDER */}
                              <button
                                onClick={() => handleValidate(task)}
                                disabled={!!submittingId}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                  submittingId
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow'
                                }`}>
                                {isThisSubmitting
                                  ? <><Loader2 className="h-4 w-4 animate-spin" />Validation…</>
                                  : <><ThumbsUp className="h-4 w-4" />Valider</>}
                              </button>

                              {/* REJETER */}
                              <button
                                onClick={() => setShowRejectForm(true)}
                                disabled={!!submittingId}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border transition-all ${
                                  submittingId
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-red-300 text-red-700 hover:bg-red-50'
                                }`}>
                                <ThumbsDown className="h-4 w-4" />Rejeter
                              </button>

                              {/* FERMER */}
                              <button
                                onClick={() => setSelectedId(null)}
                                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
                                Fermer
                              </button>
                            </div>
                          ) : (
                            /* Formulaire de rejet */
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-gray-700">Raison du rejet :</p>
                              <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Décrivez le problème constaté…"
                                rows={3}
                                autoFocus
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium">
                                  Annuler
                                </button>
                                <button
                                  onClick={() => handleReject(task, rejectReason)}
                                  disabled={!rejectReason.trim() || !!submittingId}
                                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    !rejectReason.trim() || submittingId
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                  }`}>
                                  {isThisSubmitting
                                    ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Rejet…</span>
                                    : 'Confirmer le rejet'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ==================== HISTORIQUE ==================== */}
      {viewMode === 'history' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">
              Historique des validations
              {history.length > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{history.length}</span>
              )}
            </h3>
            {history.length > 0 && (
              <button onClick={clearHistory} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium">
                <X className="h-3.5 w-3.5" /> Effacer tout
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Aucune validation ou rejet effectué pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {history.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border-l-4 bg-white shadow-sm ${
                  item.status === 'validated' ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'validated' ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          {item.status === 'validated' ? 'Validé' : 'Rejeté'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 truncate">{item.subTaskTitle}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5">
                        {item.taskTitle} • {item.project} • Phase : {item.phase}
                      </p>
                      {item.comments && (
                        <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg italic">
                          "{item.comments}"
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{formatDateTime(item.validatedAt)}</p>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ==================== STATS ==================== */}
      {viewMode === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'À tester',      value: stats.totalToTest,    color: 'text-[#ef7c21]', bg: 'bg-orange-50',  border: 'border-orange-200' },
              { label: 'Validées',       value: stats.validated,      color: 'text-green-600', bg: 'bg-green-50',   border: 'border-green-200' },
              { label: 'Rejetées',       value: stats.rejected,       color: 'text-red-600',   bg: 'bg-red-50',     border: 'border-red-200' },
              { label: 'Taux de succès', value: `${stats.successRate}%`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            ].map(({ label, value, color, bg, border }) => (
              <Card key={label} className={`p-5 text-center border ${border} ${bg}`}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </Card>
            ))}
          </div>

          {/* Barre de progression globale */}
          {stats.totalProcessed > 0 && (
            <Card className="p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Répartition des {stats.totalProcessed} décisions
              </p>
              <div className="flex rounded-full overflow-hidden h-4">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(stats.validated / stats.totalProcessed) * 100}%` }}
                  title={`${stats.validated} validées`}
                />
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${(stats.rejected / stats.totalProcessed) * 100}%` }}
                  title={`${stats.rejected} rejetées`}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{stats.validated} validées</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />{stats.rejected} rejetées</span>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default ValidatorView