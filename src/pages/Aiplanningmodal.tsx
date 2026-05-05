import { useState, useCallback } from 'react'
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Clock,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  ListTodo,
  BarChart2,
  Loader2,
  Play,
  Brain,
  AlertCircle,
  Database,
  TrendingUp,
} from 'lucide-react'
import {
  generatePlanningWithAI,
  type GeneratePlanningInput,
  type GeneratePlanningResponse,
  type PhaseGeneree,
  AVAILABLE_MODELS,
} from '../services/aiPlanningService'
import { ModelSelector } from './ModelSelector'

interface AIPlanningModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (phases: PhaseGeneree[]) => void
  input: GeneratePlanningInput
}

const PRIORITE_COLORS: Record<string, string> = {
  Haute: 'bg-red-100 text-red-700',
  Moyenne: 'bg-yellow-100 text-yellow-700',
  Basse: 'bg-green-100 text-green-700',
}

const PHASE_COLORS = [
  'border-blue-300 bg-blue-50/60',
  'border-indigo-300 bg-indigo-50/60',
  'border-purple-300 bg-purple-50/60',
  'border-green-300 bg-green-50/60',
  'border-teal-300 bg-teal-50/60',
]

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export function AIPlanningModal({ isOpen, onClose, onApply, input }: AIPlanningModalProps) {
  const [step, setStep] = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
  const [result, setResult] = useState<GeneratePlanningResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.1-8b-instant')
  const [generationTime, setGenerationTime] = useState<number | null>(null)

  const getSelectedModelName = useCallback(() => {
    const model = AVAILABLE_MODELS.find(m => m.id === selectedModel)
    return model?.name || selectedModel
  }, [selectedModel])

  const handleGenerate = useCallback(async () => {
    setStep('loading')
    setError('')
    setGenerationTime(null)
    const startTime = Date.now()

    try {
      const res = await generatePlanningWithAI({
        ...input,
        model: selectedModel,
      })
      setGenerationTime(Date.now() - startTime)
      setResult(res)
      setExpandedPhases(res.phases?.map(p => p.typePhase) || [])
      setStep('result')
    } catch (err: any) {
      console.error('Erreur génération:', err)
      setError(err?.message || 'Erreur inconnue')
      setStep('error')
    }
  }, [input, selectedModel])

  const handleApply = useCallback(() => {
    if (!result) return
    onApply(result.phases || [])
    handleClose()
  }, [result, onApply])

  const handleClose = useCallback(() => {
    setStep('idle')
    setResult(null)
    setError('')
    setExpandedPhases([])
    setExpandedTasks([])
    setGenerationTime(null)
    onClose()
  }, [onClose])

  const togglePhase = (key: string) =>
    setExpandedPhases(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])

  const toggleTask = (key: string) =>
    setExpandedTasks(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])

  const daysTotal = Math.ceil(
    (new Date(input.dateFinPrevue).getTime() - new Date(input.dateDebut).getTime()) / 86_400_000
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1d1d1b] to-[#3a3a38] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef7c21] to-[#ff9f4b] flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Génération IA du planning</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 'result' && result && result.statsGlobales
                  ? `${result.phases?.length || 0} phases · ${result.statsGlobales.totalTaches || 0} tâches`
                  : 'Analyse intelligente du projet'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          {/* ÉTAPE IDLE - inchangée */}
          {step === 'idle' && (
            <div className="p-6 space-y-6">
              {/* Sélecteur de modèle */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Modèle d'IA</p>
                      <p className="text-xs text-gray-500">Choisissez le modèle pour la génération</p>
                    </div>
                  </div>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </div>
              </div>

              {/* Résumé du projet */}
              <div className="bg-gradient-to-r from-[#ef7c21]/5 to-orange-50 border border-[#ef7c21]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#ef7c21] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 mb-3">L'IA va générer automatiquement :</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                      {[
                        '📋 Tâches et sous-tâches',
                        '⏱️ Durées estimées',
                        '🔗 Dépendances',
                        '👥 Assignation intelligente',
                        '📅 Dates cohérentes',
                        '🎯 Compétences requises',
                        '⚠️ Alertes et risques',
                        '💡 Recommandations',
                      ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques projet */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Projet', value: input.projetNom, icon: Database, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Type', value: input.typeProjet, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Durée', value: `${daysTotal} jours`, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Équipe', value: `${input.equipeDisponible?.length || 0} membre(s)`, icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3 border border-white/60`}>
                    <Icon className={`h-5 w-5 ${color} mb-1.5`} />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Période */}
              <div className="flex items-center justify-between text-sm bg-white rounded-xl px-4 py-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{fmt(input.dateDebut)}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{fmt(input.dateFinPrevue)}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Budget: {input.budgetEstime.toLocaleString()} DH
                </div>
              </div>

              {/* Membres */}
              {input.equipeDisponible && input.equipeDisponible.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" /> Équipe disponible
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {input.equipeDisponible.map(m => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 shadow-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] text-[10px] font-bold">
                          {m.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium">{m.nom}</span>
                        {m.competences.length > 0 && (
                          <span className="text-gray-400 text-[10px]">
                            · {m.competences.slice(0, 2).join(', ')}
                            {m.competences.length > 2 && ` +${m.competences.length - 2}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {input.projetDescription && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Description du projet
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{input.projetDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE LOADING */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#ef7c21]/20 border-t-[#ef7c21] animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-[#ef7c21] animate-pulse" />
              </div>
              <div className="text-center max-w-sm">
                <p className="font-semibold text-gray-800 text-lg">
                  Analyse du projet en cours...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Génération du planning avec {getSelectedModelName()}
                </p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#ef7c21] animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE ERROR */}
          {step === 'error' && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="font-semibold text-red-700 mb-2">Erreur lors de la génération</p>
                <p className="text-sm text-red-600 mb-4 max-w-md mx-auto">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Réessayer
                  </button>
                  <button
                    onClick={() => setSelectedModel('llama-3.1-8b-instant')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Changer de modèle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE RESULT - AVEC GESTION DES UNDEFINED */}
          {step === 'result' && result && (
            <div className="p-6 space-y-5">
              {/* Temps de génération */}
              {generationTime && (
                <div className="flex items-center justify-end text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Généré en {(generationTime / 1000).toFixed(1)} secondes
                </div>
              )}

              {/* Résumé IA */}
              {result.resume && (
                <div className="bg-gradient-to-r from-[#ef7c21]/10 to-orange-50 border border-[#ef7c21]/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-[#ef7c21] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#ef7c21] uppercase tracking-wider mb-1">
                        Analyse IA
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.resume}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats globales - AVEC VÉRIFICATIONS DE SÉCURITÉ */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { 
                    label: 'Phases', 
                    value: result.phases?.length || 0, 
                    icon: BarChart2, 
                    color: 'text-blue-700', 
                    bg: 'bg-blue-50' 
                  },
                  { 
                    label: 'Tâches', 
                    value: result.statsGlobales?.totalTaches || 0, 
                    icon: ListTodo, 
                    color: 'text-purple-700', 
                    bg: 'bg-purple-50' 
                  },
                  { 
                    label: 'Sous-tâches', 
                    value: result.statsGlobales?.totalSousTaches || 0, 
                    icon: CheckCircle, 
                    color: 'text-green-700', 
                    bg: 'bg-green-50' 
                  },
                  { 
                    label: 'Heures', 
                    value: `${result.statsGlobales?.totalHeures || 0}h`, 
                    icon: Clock, 
                    color: 'text-orange-700', 
                    bg: 'bg-orange-50' 
                  },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                    <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Phases générées - AVEC VÉRIFICATIONS */}
              {result.phases && result.phases.length > 0 ? (
                <div className="space-y-3">
                  {result.phases.map((phase, pi) => {
                    const isExpanded = expandedPhases.includes(phase.typePhase)
                    const phaseHours = phase.taches?.reduce(
                      (acc, t) => acc + (t.sousTaches?.reduce((a, s) => a + (s.dureeEstimeeHeures || 0), 0) || 0),
                      0
                    ) || 0

                    return (
                      <div
                        key={phase.typePhase || `phase-${pi}`}
                        className={`border-2 rounded-xl overflow-hidden ${PHASE_COLORS[pi % PHASE_COLORS.length]} transition-all`}
                      >
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/30 transition-colors"
                          onClick={() => togglePhase(phase.typePhase)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-sm font-bold text-gray-700">
                              {pi + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{phase.typePhase || `Phase ${pi + 1}`}</p>
                              <p className="text-xs text-gray-500">
                                {phase.taches?.length || 0} tâche(s) · {phaseHours}h · {phase.pourcentageBudget || 0}% budget
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && phase.description && (
                          <div className="px-4 pb-2">
                            <p className="text-xs text-gray-600 italic border-l-2 border-[#ef7c21] pl-2">
                              {phase.description}
                            </p>
                          </div>
                        )}

                        {isExpanded && phase.taches && phase.taches.length > 0 && (
                          <div className="bg-white/80 border-t-2 border-white/50 divide-y divide-gray-100">
                            {phase.taches.map((task, ti) => {
                              const taskKey = `${phase.typePhase}-${ti}`
                              const isTaskExpanded = expandedTasks.includes(taskKey)
                              const taskHours = task.sousTaches?.reduce((a, s) => a + (s.dureeEstimeeHeures || 0), 0) || 0

                              return (
                                <div key={ti} className="p-4">
                                  <button
                                    type="button"
                                    className="w-full text-left"
                                    onClick={() => toggleTask(taskKey)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <span className="font-semibold text-sm text-gray-800">
                                            {task.titre || 'Tâche sans titre'}
                                          </span>
                                          {task.priorite && (
                                            <span
                                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                PRIORITE_COLORS[task.priorite] || PRIORITE_COLORS.Moyenne
                                              }`}
                                            >
                                              {task.priorite}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {fmt(task.dateDebutPrevue)} → {fmt(task.dateFinPrevue)}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {taskHours}h
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <ListTodo className="h-3 w-3" />
                                            {task.sousTaches?.length || 0} sous-tâches
                                          </span>
                                        </div>
                                      </div>
                                      {isTaskExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                      )}
                                    </div>
                                  </button>

                                  {isTaskExpanded && (
                                    <div className="mt-3 space-y-3">
                                      {task.description && (
                                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                          {task.description}
                                        </p>
                                      )}

                                      <div className="flex flex-wrap gap-2">
                                        {task.responsableNom && (
                                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            <User className="h-3 w-3" />
                                            {task.responsableNom}
                                          </span>
                                        )}
                                        {task.testeurNom && (
                                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            <CheckCircle className="h-3 w-3" />
                                            {task.testeurNom}
                                          </span>
                                        )}
                                        {task.competencesRequises?.map(c => (
                                          <span
                                            key={c}
                                            className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1"
                                          >
                                            <Zap className="h-3 w-3" />
                                            {c}
                                          </span>
                                        ))}
                                      </div>

                                      {task.dependances && task.dependances.length > 0 && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <ArrowRight className="h-3 w-3 shrink-0" />
                                          Dépendances : {task.dependances.join(', ')}
                                        </p>
                                      )}

                                      {task.sousTaches && task.sousTaches.length > 0 && (
                                        <div className="space-y-1.5 pl-2 border-l-2 border-[#ef7c21]/30">
                                          {task.sousTaches.map((st, si) => (
                                            <div
                                              key={si}
                                              className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                                            >
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-1 h-4 bg-[#ef7c21]/60 rounded-full shrink-0" />
                                                <span className="truncate">{st.titre || 'Sous-tâche'}</span>
                                                {st.description && (
                                                  <span className="text-gray-400 hidden md:inline truncate">
                                                    — {st.description}
                                                  </span>
                                                )}
                                              </div>
                                              <span className="flex items-center gap-1 text-gray-400 shrink-0 ml-2">
                                                <Clock className="h-3 w-3" />
                                                {st.dureeEstimeeHeures || 0}h
                                              </span>
                                            </div>
                                          ))}
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
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucune phase générée</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {step === 'result' ? 'Annuler' : 'Fermer'}
          </button>

          <div className="flex items-center gap-3">
            {step === 'result' && (
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 border border-[#ef7c21] rounded-lg text-sm font-medium text-[#ef7c21] hover:bg-[#ef7c21]/5 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Régénérer
              </button>
            )}

            {step === 'idle' && (
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] hover:from-[#d95f0c] hover:to-[#ef7c21] text-white rounded-lg text-sm font-semibold shadow-md transition-all"
              >
                <Sparkles className="h-4 w-4" /> Générer le planning
              </button>
            )}

            {step === 'error' && (
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] hover:from-[#d95f0c] hover:to-[#ef7c21] text-white rounded-lg text-sm font-semibold shadow-md transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Réessayer
              </button>
            )}

            {step === 'loading' && (
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] text-white rounded-lg text-sm font-semibold shadow-md opacity-50 cursor-not-allowed"
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Génération...
              </button>
            )}

            {step === 'result' && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
              >
                <Play className="h-4 w-4" /> Appliquer ce planning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}