// components/AIPlanningModal.tsx
// Modal "Générer planning avec IA" — preview complet avant application.

import React, { useState, useCallback } from 'react'
import {
  Sparkles, X, ChevronDown, ChevronUp, User, Calendar, Clock,
  Zap, RefreshCw, CheckCircle, AlertTriangle, Info, Star,
  ArrowRight, ListTodo, BarChart2, Shield, Lightbulb, Check,
  Loader2, Play,
} from 'lucide-react'
import {
  generatePlanningWithAI,
  type GeneratePlanningInput,
  type GeneratePlanningResponse,
  type PhaseGeneree,
} from '../services/aiPlanningService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIPlanningModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (phases: PhaseGeneree[]) => void
  input: GeneratePlanningInput
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

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

// ─── Composant ────────────────────────────────────────────────────────────────

export function AIPlanningModal({ isOpen, onClose, onApply, input }: AIPlanningModalProps) {
  const [step, setStep] = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
  const [result, setResult] = useState<GeneratePlanningResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])

  const handleGenerate = useCallback(async () => {
    setStep('loading')
    setError('')
    try {
      const res = await generatePlanningWithAI(input)
      setResult(res)
      setExpandedPhases(res.phases.map(p => p.typePhase))
      setStep('result')
    } catch (err: any) {
      setError(err?.message || 'Erreur inconnue')
      setStep('error')
    }
  }, [input])

  const handleApply = useCallback(() => {
    if (!result) return
    onApply(result.phases)
    handleClose()
  }, [result, onApply])

  const handleClose = useCallback(() => {
    setStep('idle')
    setResult(null)
    setError('')
    setExpandedPhases([])
    setExpandedTasks([])
    onClose()
  }, [onClose])

  const togglePhase = (key: string) =>
    setExpandedPhases(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])

  const toggleTask = (key: string) =>
    setExpandedTasks(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])

  const daysTotal = Math.ceil(
    (new Date(input.dateFinPrevue).getTime() - new Date(input.dateDebut).getTime()) / 86_400_000
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#1d1d1b] to-[#3a3a38] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ef7c21] flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Générer planning avec IA</h2>
              <p className="text-xs text-gray-400 mt-0.5">Claude analyse le projet et génère un planning complet</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Contenu ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── ÉTAPE IDLE : formulaire de confirmation ──────────────────── */}
          {step === 'idle' && (
            <div className="p-6 space-y-5">
              {/* Résumé du contexte */}
              <div className="bg-gradient-to-r from-[#ef7c21]/8 to-orange-50 border border-[#ef7c21]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#ef7c21] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-2">L'IA va générer automatiquement</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                      {[
                        '✅ Tâches et sous-tâches détaillées',
                        '✅ Durée estimée par tâche',
                        '✅ Dépendances entre tâches',
                        '✅ Affectation intelligente des membres',
                        '✅ Dates cohérentes (7h/jour max)',
                        '✅ Compétences requises par tâche',
                        '✅ Alertes et risques identifiés',
                        '✅ Recommandations d\'optimisation',
                      ].map(item => <p key={item}>{item}</p>)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Données du projet */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Projet', value: input.projetNom, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Type', value: input.typeProjet, icon: Star, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Durée', value: `${daysTotal} jours`, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Équipe', value: `${input.equipeDisponible?.length || 0} membre(s)`, icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3 border border-white/60`}>
                    <Icon className={`h-5 w-5 ${color} mb-1.5`} />
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-sm font-semibold ${color} truncate`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Période */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{fmt(input.dateDebut)}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span>{fmt(input.dateFinPrevue)}</span>
                <span className="ml-auto text-xs text-gray-400">Budget : {input.budgetEstime.toLocaleString()} DH</span>
              </div>

              {/* Membres */}
              {input.equipeDisponible && input.equipeDisponible.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Membres disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {input.equipeDisponible.map(m => (
                      <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] text-[10px] font-bold shrink-0">
                          {m.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium">{m.nom}</span>
                        {m.competences.length > 0 && (
                          <span className="text-gray-400">· {m.competences.slice(0, 2).join(', ')}{m.competences.length > 2 ? ` +${m.competences.length - 2}` : ''}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {input.projetDescription && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description du projet</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{input.projetDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE LOADING ───────────────────────────────────────────── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#ef7c21]/20 border-t-[#ef7c21] animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-[#ef7c21]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="font-semibold text-gray-800 text-lg">L'IA analyse votre projet…</p>
                <p className="text-sm text-gray-500 mt-2">
                  Génération du planning en cours · 15–40 secondes
                </p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#ef7c21] animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <div className="w-full max-w-sm space-y-2 text-xs text-gray-400 text-center">
                {['Analyse de la description…', 'Planification des phases…', 'Assignation des membres…', 'Estimation des durées…'].map((msg, i) => (
                  <p key={i} className="opacity-0 animate-[fadeIn_0.5s_ease-in-out_forwards]" style={{ animationDelay: `${i * 3}s` }}>{msg}</p>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE ERROR ─────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="font-semibold text-red-700 mb-2">Erreur lors de la génération</p>
                <p className="text-sm text-red-600 mb-4 max-w-md mx-auto">{error}</p>
                <button onClick={handleGenerate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto">
                  <RefreshCw className="h-4 w-4" /> Réessayer
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE RESULT ─────────────────────────────────────────────── */}
          {step === 'result' && result && (
            <div className="p-6 space-y-5">

              {/* Résumé IA */}
              <div className="bg-gradient-to-r from-[#ef7c21]/10 to-orange-50 border border-[#ef7c21]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#ef7c21] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#ef7c21] uppercase tracking-wider mb-1">Analyse IA</p>
                    <p className="text-sm text-gray-700">{result.resume}</p>
                  </div>
                </div>
              </div>

              {/* Stats globales */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Phases', value: result.phases.length, icon: BarChart2, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { label: 'Tâches', value: result.statsGlobales.totalTaches, icon: ListTodo, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                  { label: 'Sous-tâches', value: result.statsGlobales.totalSousTaches, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                  { label: 'Heures tot.', value: `${result.statsGlobales.totalHeures}h`, icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
                ].map(({ label, value, icon: Icon, color, bg, border }) => (
                  <div key={label} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
                    <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

            

              {/* Phases générées */}
              <div className="space-y-3">
                {result.phases.map((phase, pi) => {
                  const isExpanded = expandedPhases.includes(phase.typePhase)
                  const phaseH = phase.taches.reduce((acc, t) => acc + t.sousTaches.reduce((a, s) => a + s.dureeEstimeeHeures, 0), 0)

                  return (
                    <div key={phase.typePhase} className={`border-2 rounded-xl overflow-hidden ${PHASE_COLORS[pi % PHASE_COLORS.length]}`}>
                      {/* Header phase */}
                      <button type="button" className="w-full flex items-center justify-between p-4 text-left"
                        onClick={() => togglePhase(phase.typePhase)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-sm font-bold text-gray-700 shrink-0">{pi + 1}</div>
                          <div>
                            <p className="font-semibold text-gray-800">{phase.typePhase}</p>
                            <p className="text-xs text-gray-500">{phase.taches.length} tâche(s) · {phaseH}h · {phase.pourcentageBudget}% budget</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </button>

                      {/* Description phase */}
                      {isExpanded && phase.description && (
                        <div className="px-4 pb-2">
                          <p className="text-xs text-gray-600 italic">{phase.description}</p>
                        </div>
                      )}

                      {/* Tâches */}
                      {isExpanded && (
                        <div className="bg-white/80 border-t-2 border-white/50 divide-y divide-gray-100">
                          {phase.taches.map((task, ti) => {
                            const taskKey = `${phase.typePhase}-${ti}`
                            const isTaskExpanded = expandedTasks.includes(taskKey)
                            const taskH = task.sousTaches.reduce((a, s) => a + s.dureeEstimeeHeures, 0)

                            return (
                              <div key={ti} className="p-4">
                                {/* Résumé tâche */}
                                <button type="button" className="w-full text-left" onClick={() => toggleTask(taskKey)}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold text-sm text-gray-800">{task.titre}</span>
                                        {task.priorite && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITE_COLORS[task.priorite] || PRIORITE_COLORS.Moyenne}`}>
                                            {task.priorite}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(task.dateDebutPrevue)} → {fmt(task.dateFinPrevue)}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{taskH}h estimées</span>
                                        <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{task.sousTaches.length} sous-tâches</span>
                                      </div>
                                    </div>
                                    {isTaskExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                                  </div>
                                </button>

                                {/* Détails tâche */}
                                {isTaskExpanded && (
                                  <div className="mt-3 space-y-3">
                                    {/* Assignations */}
                                    <div className="flex flex-wrap gap-2">
                                      {task.responsableNom && (
                                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                          <User className="h-3 w-3" />
                                          {task.responsableNom}
                                          {task.responsableId && <Check className="h-3 w-3 text-blue-500" />}
                                        </span>
                                      )}
                                      {task.testeurNom && (
                                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                          <CheckCircle className="h-3 w-3" />
                                          {task.testeurNom}
                                          {task.testeurId && <Check className="h-3 w-3 text-purple-500" />}
                                        </span>
                                      )}
                                      {task.competencesRequises?.map(c => (
                                        <span key={c} className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                                          <Zap className="h-3 w-3" />{c}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Dépendances */}
                                    {task.dependances && task.dependances.length > 0 && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3 shrink-0" />
                                        Après : {task.dependances.join(', ')}
                                      </p>
                                    )}

                                    {/* Sous-tâches */}
                                    <div className="space-y-1.5 pl-2 border-l-2 border-[#ef7c21]/30">
                                      {task.sousTaches.map((st, si) => (
                                        <div key={si} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-1 h-4 bg-[#ef7c21]/60 rounded-full shrink-0" />
                                            <span className="truncate">{st.titre}</span>
                                            {st.description && <span className="text-gray-400 hidden md:inline truncate">— {st.description}</span>}
                                          </div>
                                          <span className="flex items-center gap-1 text-gray-400 shrink-0 ml-2">
                                            <Clock className="h-3 w-3" />{st.dureeEstimeeHeures}h
                                          </span>
                                        </div>
                                      ))}
                                    </div>
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
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3 bg-gray-50/80 shrink-0">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            {step === 'result' ? 'Annuler' : 'Fermer'}
          </button>

          <div className="flex items-center gap-3">
            {/* Régénérer */}
            {step === 'result' && (
              <button type="button" onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 border border-[#ef7c21] rounded-lg text-sm font-medium text-[#ef7c21] hover:bg-[#ef7c21]/5 transition-colors">
                <RefreshCw className="h-4 w-4" /> Régénérer
              </button>
            )}

          {/* Générer */}
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
    <Sparkles className="h-4 w-4" /> Réessayer
  </button>
)}

{step === 'loading' && (
  <button 
    type="button" 
    disabled
    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] text-white rounded-lg text-sm font-semibold shadow-md opacity-50 cursor-not-allowed"
  >
    <Loader2 className="h-4 w-4 animate-spin" /> Génération…
  </button>
)}

            {/* Appliquer */}
            {step === 'result' && (
              <button type="button" onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all">
                <Play className="h-4 w-4" /> Appliquer ce planning
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default AIPlanningModal