import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
} from 'lucide-react'
import {
  getSubTasksToTest,
  validateSubTask,
  rejectSubTask,
  getValidationHistory,
  type ValidationHistory,
} from '../services/validatorService'

type SubTaskStatus = 'not-started' | 'in-progress' | 'paused' | 'completed' | 'to-test' | 'validated' | 'rejected'
type Priority = 'low' | 'medium' | 'high' | 'urgent'

interface SubTask {
  id: string
  title: string
  description?: string
  status: SubTaskStatus
  priority: Priority
  assignee: string
  tester: string
  startDate: string
  endDate: string
  estimatedHours: number
  consumedHours: number
  progress: number
  tacheTitre?: string
  phase?: string
  projetNom?: string
}

interface ValidatorViewProps {
  validatorId?: string
  validatorName?: string
  projetId?: number
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

export function ValidatorView({
  validatorName = 'Karim El Idrissi',
  projetId,
}: ValidatorViewProps) {
  // États
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [history, setHistory] = useState<ValidationHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null)
  const [viewMode, setViewMode] = useState<'queue' | 'history' | 'stats'>('queue')
  const [searchQuery, setSearchQuery] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoadingRef = useRef(false)

  // ========== CHARGER LES TÂCHES À TESTER ==========
  const loadSubTasksToTest = useCallback(async () => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const data = await getSubTasksToTest(projetId)
      console.log('Tâches à tester reçues:', data)

      const transformedTasks: SubTask[] = data.map(st => ({
        id: st.id.toString(),
        title: st.titre,
        status: 'to-test',
        priority: 'medium',
        assignee: 'Développeur',
        tester: validatorName,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        estimatedHours: st.dureeEstimeeHeures,
        consumedHours: 0,
        progress: 0,
        tacheTitre: st.tache,
        phase: st.phase,
        projetNom: st.projet,
      }))

      setSubTasks(transformedTasks)
    } catch (err) {
      setError('Erreur lors du chargement des tâches à tester')
      console.error(err)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [projetId, validatorName])

  // ========== CHARGER L'HISTORIQUE ==========
  const loadHistory = useCallback(async () => {
    try {
      const data = await getValidationHistory()
      setHistory(data)
    } catch (err) {
      console.error('Erreur chargement historique:', err)
    }
  }, [])

  // ========== VALIDER UNE TÂCHE ==========
  const handleValidate = useCallback(async (subTaskId: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      await validateSubTask(parseInt(subTaskId))
      
      // Ajouter à l'historique localement
      const validatedTask = subTasks.find(s => s.id === subTaskId)
      if (validatedTask) {
        const newHistory: ValidationHistory = {
          id: `VH-${Date.now()}`,
          subTaskId: parseInt(subTaskId),
          subTaskTitle: validatedTask.title,
          taskTitle: validatedTask.tacheTitre || 'Tâche',
          project: validatedTask.projetNom || 'Projet',
          validatedBy: validatorName,
          validatedAt: new Date(),
          status: 'validated',
          comments: 'Validé avec succès',
        }
        setHistory(prev => [newHistory, ...prev])
      }

      // Supprimer de la liste
      setSubTasks(prev => prev.filter(s => s.id !== subTaskId))
      setSelectedSubTask(null)
    } catch (err) {
      setError('Erreur lors de la validation')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }, [subTasks, validatorName, isSubmitting])

  // ========== REJETER UNE TÂCHE ==========
  const handleReject = useCallback(async (subTaskId: string, reason: string) => {
    if (isSubmitting || !reason.trim()) return
    setIsSubmitting(true)

    try {
      await rejectSubTask(parseInt(subTaskId), reason)
      
      // Ajouter à l'historique localement
      const rejectedTask = subTasks.find(s => s.id === subTaskId)
      if (rejectedTask) {
        const newHistory: ValidationHistory = {
          id: `VH-${Date.now()}`,
          subTaskId: parseInt(subTaskId),
          subTaskTitle: rejectedTask.title,
          taskTitle: rejectedTask.tacheTitre || 'Tâche',
          project: rejectedTask.projetNom || 'Projet',
          validatedBy: validatorName,
          validatedAt: new Date(),
          status: 'rejected',
          comments: reason,
        }
        setHistory(prev => [newHistory, ...prev])
      }

      // Supprimer de la liste
      setSubTasks(prev => prev.filter(s => s.id !== subTaskId))
      setSelectedSubTask(null)
      setShowRejectForm(false)
      setRejectReason('')
    } catch (err) {
      setError('Erreur lors du rejet')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }, [subTasks, validatorName, isSubmitting])

  // ========== RÉINITIALISER ==========
  const handleRefresh = useCallback(() => {
    loadSubTasksToTest()
    loadHistory()
  }, [loadSubTasksToTest, loadHistory])

  // ========== USE EFFECTS ==========
  useEffect(() => {
    loadSubTasksToTest()
    loadHistory()
  }, [loadSubTasksToTest, loadHistory])

  // ========== STATISTIQUES ==========
  const stats = useMemo(() => {
    const validated = history.filter((h) => h.status === 'validated').length
    const rejected = history.filter((h) => h.status === 'rejected').length
    return {
      totalToTest: subTasks.length,
      validated,
      rejected,
      successRate:
        validated + rejected > 0
          ? Math.round((validated / (validated + rejected)) * 100)
          : 0,
    }
  }, [subTasks, history])

  // ========== FILTRAGE ==========
  const filteredSubTasks = useMemo(() => {
    if (!searchQuery) return subTasks
    const q = searchQuery.toLowerCase()
    return subTasks.filter(
      (st) =>
        st.title.toLowerCase().includes(q) ||
        st.tacheTitre?.toLowerCase().includes(q) ||
        st.projetNom?.toLowerCase().includes(q)
    )
  }, [subTasks, searchQuery])

  // ========== RENDU ==========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VALIDATION</h1>
            <p className="text-gray-500 text-sm mt-1">
              {stats.totalToTest} tâches à tester
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="!px-2"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {(
              [
                ['queue', List, "File d'attente"],
                ['history', History, 'Historique'],
                ['stats', BarChart3, 'Statistiques'],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                  viewMode === mode 
                    ? 'bg-[#ef7c21] text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Queue View */}
      {viewMode === 'queue' && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, tâche ou projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
              />
            </div>
          </div>
          <div className="p-6">
            {filteredSubTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune tâche à tester
                </h3>
                <p className="text-gray-500">
                  Toutes les tâches ont été validées ou rejetées.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubTasks.map((subTask) => (
                  <div
                    key={subTask.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {selectedSubTask?.id === subTask.id ? (
                      <Card className="overflow-hidden border-2 border-[#ef7c21]">
                        <div className="bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] p-4 text-white">
                          <h2 className="text-xl font-bold">{subTask.title}</h2>
                          <p className="text-sm text-white/90 mt-1">
                            Tâche: {subTask.tacheTitre || 'Non spécifié'} • Projet: {subTask.projetNom || 'Non spécifié'}
                          </p>
                        </div>
                        <div className="p-4 border-b bg-gray-50">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Phase</p>
                              <p className="font-medium">{subTask.phase || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Heures estimées</p>
                              <p className="font-medium">{subTask.estimatedHours}h</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Tester par</p>
                              <p className="font-medium">{subTask.tester}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50">
                          {!showRejectForm ? (
                            <div className="flex gap-3">
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleValidate(subTask.id)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  <>
                                    <ThumbsUp className="h-4 w-4 mr-2" /> Valider
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => setShowRejectForm(true)}
                                disabled={isSubmitting}
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" /> Rejeter
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedSubTask(null)}
                              >
                                Fermer
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Raison du rejet..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ef7c21]"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setShowRejectForm(false)
                                    setRejectReason('')
                                  }}
                                  disabled={isSubmitting}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => handleReject(subTask.id, rejectReason)}
                                  disabled={!rejectReason.trim() || isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  ) : (
                                    'Confirmer le rejet'
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ) : (
                      <div
                        className="p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedSubTask(subTask)
                          setShowRejectForm(false)
                          setRejectReason('')
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="neutral" className="bg-purple-100 text-purple-700">
                                À tester
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">
                                {subTask.title}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              Tâche: {subTask.tacheTitre || '-'} • Projet: {subTask.projetNom || '-'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Phase: {subTask.phase || '-'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {subTask.estimatedHours}h estimées
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* History View */}
      {viewMode === 'history' && (
        <Card className="p-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun historique
              </h3>
              <p className="text-gray-500">
                Aucune validation ou rejet n'a été effectué pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant={item.status === 'validated' ? 'success' : 'danger'}
                        >
                          {item.status === 'validated' ? 'Validé' : 'Rejeté'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {item.subTaskTitle}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {item.taskTitle} • {item.project}
                      </p>
                      {item.comments && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg mt-2">
                          "{item.comments}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDateTime(item.validatedAt)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        par {item.validatedBy}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500">À tester</p>
            <p className="text-2xl font-bold text-[#ef7c21]">
              {stats.totalToTest}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500">Validés</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.validated}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500">Rejetés</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500">Taux de succès</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.successRate}%
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ValidatorView