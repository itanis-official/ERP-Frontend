import { useState, useEffect, type FormEvent } from 'react'
import { X, Calendar, DollarSign, Clock, FileText, Users, Download, Upload, Eye, Trash2, Check, CheckCircle2, Play, Pause, AlertCircle, Send, Pencil, Plus, Save, Loader2, HandshakeIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { type Opportunity } from '../lib/opportunityApi'
import { companyApi } from '../lib/companyApi'
import { phaseApi, type Phase } from '../lib/phaseApi'
import { contractApi, type Contract } from '../lib/contractApi'

interface OpportunityDetailModalProps {
  opportunity: Opportunity
  onClose: () => void
}

const STAGE_CONFIG: Record<string, { label: string; style: string }> = {
  prospection: { label: 'Prospection', style: 'bg-gray-100 text-gray-800' },
  qualification: { label: 'Qualification', style: 'bg-blue-100 text-blue-800' },
  negociation: { label: 'Negotiation', style: 'bg-orange-100 text-orange-800' },
  gagnee: { label: 'Gagnee', style: 'bg-green-100 text-green-800' },
  perdue: { label: 'Perdue', style: 'bg-red-100 text-red-800' },
}

const PHASE_TYPES: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  meeting: { label: 'Reunion', icon: Users, color: '#8b5cf6' },
  study: { label: 'Etude & CDC', icon: FileText, color: '#6366f1' },
  offer: { label: 'Offre', icon: Send, color: '#E67E22' },
  contract: { label: 'Contrat', icon: HandshakeIcon, color: '#10b981' },
}

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  completed: { label: 'Termine', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'En cours', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending: { label: 'En attente', style: 'bg-slate-50 text-slate-500 border-slate-200' },
  not_sent: { label: 'Non envoye', style: 'bg-slate-50 text-slate-500 border-slate-200' },
  sent: { label: 'Envoye', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  accepted: { label: 'Accepte', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  refused: { label: 'Refuse', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  negotiated: { label: 'Negocie', style: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function getStatusCfg(s: string) { return STATUS_CONFIG[s] || { label: s, style: 'bg-slate-50 text-slate-500 border-slate-200' } }
function getStageCfg(s: string) { return STAGE_CONFIG[s] || { label: s, style: 'bg-gray-100 text-gray-800' } }

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtCurrency = (v: number) => new Intl.NumberFormat('fr-FR').format(v)

const agents = [
  { id: "1", name: "Jean Dupont", avatar: "JD" },
  { id: "2", name: "Marie Martin", avatar: "MM" },
  { id: "3", name: "Pierre Durand", avatar: "PD" },
  { id: "4", name: "Sophie Bernard", avatar: "SB" },
]

const phaseKeys = ["meeting", "study", "offer", "contract"]
const phaseLabels = ["Reunion", "Etude", "Offre", "Contrat"]
const phaseIcons = ["👥", "📊", "💰", "📄"]

export function OpportunityDetailModal({ opportunity, onClose }: OpportunityDetailModalProps) {
  const qc = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [currentPhase, setCurrentPhase] = useState(0)
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  const close = () => { setVisible(false); setTimeout(onClose, 250) }

  const { data: company } = useQuery({
    queryKey: ['company', opportunity.companyId],
    queryFn: async () => { try { return await companyApi.getById(opportunity.companyId) } catch { return null } },
    enabled: !!opportunity.companyId,
  })

  const { data: phases = [], isLoading: loadingPhases } = useQuery<Phase[]>({
    queryKey: ['phases', 'opp', opportunity.id],
    queryFn: async () => { try { return await phaseApi.getByOpportunity(opportunity.id!) } catch { return [] } },
    enabled: !!opportunity.id,
  })

  const { data: contracts = [], isLoading: loadingContracts } = useQuery<Contract[]>({
    queryKey: ['contracts', 'opp', opportunity.id],
    queryFn: async () => {
      try {
        const all = await contractApi.getAll()
        return all.filter(c => c.projectId === opportunity.id)
      } catch { return [] }
    },
    enabled: !!opportunity.id,
  })

  const initMutation = useMutation({
    mutationFn: () => phaseApi.initForOpportunity(opportunity.id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phases', 'opp', opportunity.id] }),
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => phaseApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phases', 'opp', opportunity.id] }),
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => phaseApi.changeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phases', 'opp', opportunity.id] }),
  })

  const companyName = company?.raisonSociale || opportunity.company?.raisonSociale || 'Societe'
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'
  const stageCfg = getStageCfg(opportunity.pipelineStage)
  const sortedPhases = [...phases].sort((a, b) => (a.id || 0) - (b.id || 0))
  const completedCount = phases.filter(p => p.status === 'completed').length
  const progress = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0

  // Map sorted phases to phase keys for the stepper
  const getPhaseByType = (type: string) => sortedPhases.find(p => p.type === type)

  const goToPhase = (index: number) => setCurrentPhase(index)
  const nextPhase = () => { if (currentPhase < 3) setCurrentPhase(currentPhase + 1) }
  const previousPhase = () => { if (currentPhase > 0) setCurrentPhase(currentPhase - 1) }

  const getPhaseStatus = (phaseKey: string) => {
    const phase = getPhaseByType(phaseKey)
    return phase?.status || 'pending'
  }

  // History from phases
  const history = sortedPhases.map((p, idx) => ({
    id: String(p.id || idx),
    type: p.type,
    description: `Phase ${PHASE_TYPES[p.type]?.label || p.type} - ${getStatusCfg(p.status).label}`,
    user: 'Systeme',
    avatar: 'SY',
    date: p.updatedAt ? new Date(p.updatedAt).toLocaleString('fr-FR') : (p.createdAt ? new Date(p.createdAt).toLocaleString('fr-FR') : '—'),
  }))

  return (
    <div onClick={(e) => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[1200px] w-full h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#E67E22] to-[#D35400] px-8 py-5 flex items-center justify-between text-white shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#E67E22] font-bold text-sm">{getInitials(companyName)}</span>
            </div>
            <div>
              <p className="text-xs text-orange-100">{companyName}</p>
              <h2 className="text-xl font-bold text-white">{opportunity.titre}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${stageCfg.style} px-2 py-1 text-xs font-semibold`}>
              {stageCfg.label}
            </Badge>
            <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-[#E9ECEF] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#E67E22]">💰 {fmtCurrency(opportunity.valeurEstimee || 0)} DT</span>
          </div>

          <div className="h-8 w-px bg-[#E9ECEF]"></div>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="none" stroke="#E9ECEF" strokeWidth="2.5" />
                <circle cx="16" cy="16" r="14" fill="none" stroke="#E67E22" strokeWidth="2.5"
                  strokeDasharray={`${(opportunity.probabilite || 0) * 0.88} 88`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#E67E22]">{opportunity.probabilite || 0}%</span>
            </div>
            <span className="text-sm text-[#7F8C8D]">Probabilite</span>
          </div>

          <div className="h-8 w-px bg-[#E9ECEF]"></div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E67E22] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{opportunity.agent?.avatar || getInitials(companyName)}</span>
            </div>
            <span className="text-sm font-medium text-[#2C3E50]">{opportunity.agent?.name || 'Agent'}</span>
          </div>

          <div className="h-8 w-px bg-[#E9ECEF]"></div>

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-[#7F8C8D]" />
            <span className="text-sm text-[#7F8C8D]">{fmtDate(opportunity.dateCloturePrevu)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E9ECEF] px-6 bg-white flex-shrink-0">
          <div className="flex gap-1">
            {[
              { id: "overview", label: "Vue d'ensemble", icon: "📋" },
              { id: "phases", label: `Phases du Projet (${phases.length})`, icon: "🔄" },
              { id: "contracts", label: `Contrats (${contracts.length})`, icon: "📁" },
              { id: "history", label: "Historique", icon: "⏱️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 font-semibold border-b-2 transition-all duration-200 flex items-center gap-1 text-sm ${
                  activeTab === tab.id
                    ? "border-[#E67E22] text-[#E67E22]"
                    : "border-transparent text-[#7F8C8D] hover:text-[#2C3E50]"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ─── Overview ─── */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-4">
              {/* Description */}
              <Card className="p-4 border border-[#E9ECEF] shadow-sm">
                <h3 className="text-base font-bold text-[#2C3E50] mb-2">Description</h3>
                <p className="text-sm text-[#5A6B7F] leading-relaxed">
                  {opportunity.description || 'Aucune description disponible.'}
                </p>
              </Card>

              {/* Informations Cles */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">SOCIETE</p>
                  <p className="text-sm font-bold text-[#2C3E50]">{companyName}</p>
                </Card>
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">SECTEUR</p>
                  <p className="text-sm font-bold text-[#2C3E50]">{company?.secteur || opportunity.sector || '—'}</p>
                </Card>
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">VALEUR</p>
                  <p className="text-base font-bold text-[#E67E22]">{fmtCurrency(opportunity.valeurEstimee || 0)} DT</p>
                </Card>
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">PROBABILITE</p>
                  <p className="text-base font-bold text-[#E67E22]">{opportunity.probabilite || 0}%</p>
                </Card>
              </div>

              {/* Quick Phases Summary */}
              {phases.length > 0 && (
                <Card className="p-4 border border-[#E9ECEF]">
                  <h4 className="text-xs font-bold text-[#2C3E50] mb-3">Avancement des Phases</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#E67E22] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{progress}%</span>
                  </div>
                  <div className="flex gap-2">
                    {sortedPhases.map(p => {
                      const cfg = PHASE_TYPES[p.type] || { label: p.type, icon: FileText, color: '#64748b' }
                      return (
                        <div key={p.id} className="flex-1 text-center">
                          <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 ${
                            p.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                            p.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {p.status === 'completed' ? <CheckCircle2 size={14} /> : <cfg.icon size={14} />}
                          </div>
                          <p className="text-[10px] font-semibold text-slate-500">{cfg.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Labels */}
              <Card className="p-4 border border-[#E9ECEF]">
                <h4 className="text-xs font-bold text-[#2C3E50] mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">🎯 {opportunity.type || 'Nouveau'}</Badge>
                  {opportunity.pipelineStage === 'gagnee' && <Badge className="bg-green-100 text-green-800 text-xs">✅ Gagnee</Badge>}
                  {(opportunity.valeurEstimee || 0) > 0 && <Badge className="bg-purple-100 text-purple-800 text-xs">💼 Budget OK</Badge>}
                </div>
              </Card>

              {/* Notes */}
              {opportunity.notes && (
                <Card className="p-4 border border-[#E9ECEF] shadow-sm">
                  <h3 className="text-base font-bold text-[#2C3E50] mb-2">Notes</h3>
                  <p className="text-sm text-[#5A6B7F] leading-relaxed">{opportunity.notes}</p>
                </Card>
              )}
            </div>
          )}

          {/* ─── Phases Tab ─── */}
          {activeTab === 'phases' && (
            <div className="flex flex-col h-full">
              {loadingPhases ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-7 h-7 animate-spin text-[#E67E22]" />
                </div>
              ) : phases.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-3">Aucune phase initialisee</p>
                  <Button onClick={() => initMutation.mutate()}
                    disabled={initMutation.isPending}
                    className="bg-[#E67E22] hover:bg-[#D35400] text-white gap-1.5">
                    {initMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Initialiser les phases
                  </Button>
                </div>
              ) : (
                <>
                  {/* Phase Stepper */}
                  <div className="bg-[#FAFAFA] px-8 py-4 border-b border-[#E9ECEF] flex-shrink-0">
                    <div className="flex items-center justify-center">
                      {phaseKeys.map((phaseKey, idx) => {
                        const status = getPhaseStatus(phaseKey)
                        const isActive = idx === currentPhase
                        const isCompleted = status === 'completed'

                        return (
                          <div key={phaseKey} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => goToPhase(idx)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all cursor-pointer ${
                                  isCompleted
                                    ? "bg-[#27AE60] text-white shadow-lg ring-2 ring-green-200"
                                    : isActive
                                    ? "bg-[#E67E22] text-white shadow-lg ring-2 ring-orange-200"
                                    : "bg-[#E9ECEF] text-[#7F8C8D] hover:bg-[#DDD]"
                                }`}
                              >
                                {isCompleted ? "✓" : phaseIcons[idx]}
                              </button>
                              <p className={`text-xs font-semibold mt-2 ${isActive ? "text-[#E67E22]" : "text-[#7F8C8D]"}`}>
                                {phaseLabels[idx]}
                              </p>
                            </div>
                            {idx < 3 && (
                              <div className={`w-16 h-1 mx-3 rounded-full transition-all ${
                                isCompleted ? "bg-[#27AE60]" : "bg-[#E9ECEF]"
                              }`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-sm font-medium text-[#7F8C8D]">{currentPhase + 1}/4</span>
                    </div>
                  </div>

                  {/* Phase Content */}
                  <div className="flex-1 overflow-y-auto px-10 py-8" style={{ minHeight: "400px" }}>
                    {(() => {
                      const currentPhaseKey = phaseKeys[currentPhase]
                      const currentPhaseData = getPhaseByType(currentPhaseKey)
                      const isEditing = editingPhase?.id === currentPhaseData?.id

                      if (!currentPhaseData) {
                        return (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-3xl">{phaseIcons[currentPhase]}</span>
                            </div>
                            <h4 className="text-lg font-semibold text-[#2C3E50] mb-2">Phase non initialisee</h4>
                            <p className="text-sm text-[#7F8C8D]">Cette phase n'a pas encore ete creee.</p>
                          </div>
                        )
                      }

                      if (isEditing) {
                        return (
                          <PhaseInlineEdit
                            phase={currentPhaseData}
                            onSave={() => { setEditingPhase(null); qc.invalidateQueries({ queryKey: ['phases', 'opp', opportunity.id] }) }}
                            onCancel={() => setEditingPhase(null)}
                          />
                        )
                      }

                      return (
                        <div className="space-y-8">
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-4xl">{phaseIcons[currentPhase]}</span>
                              <div>
                                <h3 className="text-2xl font-bold text-[#2C3E50]">{phaseLabels[currentPhase]}</h3>
                                <div className="h-1 w-16 bg-[#E67E22] rounded mt-1"></div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {/* Status */}
                            <div>
                              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Statut</Label>
                              <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                                <Badge className={`${getStatusCfg(currentPhaseData.status).style} border text-sm px-3 py-1`}>
                                  {getStatusCfg(currentPhaseData.status).label}
                                </Badge>
                              </div>
                            </div>

                            {/* Phase 0 - Meeting */}
                            {currentPhase === 0 && (
                              <>
                                {currentPhaseData.meetingDate && (
                                  <div className="grid grid-cols-2 gap-6">
                                    <div>
                                      <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date</Label>
                                      <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4 text-base text-[#2C3E50]">
                                        {fmtDate(currentPhaseData.meetingDate)}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Heure</Label>
                                      <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4 text-base text-[#2C3E50]">
                                        {currentPhaseData.meetingTime || '—'}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {currentPhaseData.notes && (
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Notes de la Reunion</Label>
                                    <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4 min-h-[100px]">
                                      <p className="text-sm text-[#2C3E50] leading-relaxed">{currentPhaseData.notes}</p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Phase 1 - Study */}
                            {currentPhase === 1 && (
                              <>
                                {currentPhaseData.dueDate && (
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Echeance</Label>
                                    <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4 text-base text-[#2C3E50]">
                                      {fmtDate(currentPhaseData.dueDate)}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium text-[#7F8C8D]">Progression</Label>
                                    <span className="text-xl font-bold text-[#E67E22]">{currentPhaseData.progress || 0}%</span>
                                  </div>
                                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#E67E22] to-[#F39C12] rounded-full transition-all duration-500"
                                      style={{ width: `${currentPhaseData.progress || 0}%` }} />
                                  </div>
                                </div>

                                <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                      currentPhaseData.validated ? 'bg-emerald-500 text-white' : 'border-2 border-[#BDC3C7]'
                                    }`}>
                                      {currentPhaseData.validated && <Check size={12} />}
                                    </div>
                                    <span className="text-base text-[#2C3E50]">
                                      Etude {currentPhaseData.validated ? 'validee' : 'non validee'} par le client
                                    </span>
                                  </div>
                                </div>

                                {currentPhaseData.notes && (
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Notes</Label>
                                    <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                                      <p className="text-sm text-[#2C3E50] leading-relaxed">{currentPhaseData.notes}</p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Phase 2 - Offer */}
                            {currentPhase === 2 && (
                              <>
                                {(currentPhaseData.montant != null && currentPhaseData.montant > 0) && (
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Montant Total Propose</Label>
                                    <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4 text-lg font-bold text-[#E67E22]">
                                      {fmtCurrency(currentPhaseData.montant)} DT
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date d'envoi</Label>
                                    <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4 text-sm text-[#2C3E50]">
                                      {fmtDate(currentPhaseData.dateEnvoi)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Validite jusqu'au</Label>
                                    <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4 text-sm text-[#2C3E50]">
                                      {fmtDate(currentPhaseData.dateValidite)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Statut Offre</Label>
                                    <div className="h-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl flex items-center px-4">
                                      <Badge className={`${getStatusCfg(currentPhaseData.status).style} border text-xs`}>
                                        {getStatusCfg(currentPhaseData.status).label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {currentPhaseData.feedbackClient && (
                                  <div>
                                    <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Retour du Client</Label>
                                    <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4 min-h-[100px]">
                                      <p className="text-sm text-[#2C3E50] leading-relaxed">{currentPhaseData.feedbackClient}</p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Phase 3 - Contract */}
                            {currentPhase === 3 && (
                              <>
                                {!currentPhaseData.signed ? (
                                  <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-6">
                                      <Upload className="w-12 h-12 text-[#BDC3C7]" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-[#2C3E50] mb-2">Aucun contrat signe</h4>
                                    <p className="text-sm text-[#7F8C8D] mb-6">Le contrat n'a pas encore ete signe.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                                        <p className="text-sm text-[#7F8C8D] mb-1">Reference du Contrat</p>
                                        <p className="text-base font-semibold text-[#2C3E50]">{currentPhaseData.reference || '—'}</p>
                                      </div>
                                      <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                                        <p className="text-sm text-[#7F8C8D] mb-1">Date de Signature</p>
                                        <p className="text-base font-semibold text-[#2C3E50]">{fmtDate(currentPhaseData.dateSignature)}</p>
                                      </div>
                                    </div>

                                    {currentPhaseData.notes && (
                                      <div>
                                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Notes</Label>
                                        <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                                          <p className="text-sm text-[#2C3E50] leading-relaxed">{currentPhaseData.notes}</p>
                                        </div>
                                      </div>
                                    )}

                                    <Button className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white h-12 rounded-xl text-base font-medium shadow-md">
                                      <CheckCircle2 className="w-5 h-5 mr-2" />
                                      Convertir en Projet Technique
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3">
                              <Button
                                onClick={() => setEditingPhase(currentPhaseData)}
                                variant="outline"
                                className="border border-[#E67E22] text-[#E67E22] hover:bg-[#FFF5EC] h-11 px-6 rounded-xl"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Modifier
                              </Button>
                              {currentPhaseData.status !== 'completed' && currentPhaseData.status !== 'in_progress' && (
                                <Button
                                  onClick={() => currentPhaseData.id && changeStatusMutation.mutate({ id: currentPhaseData.id, status: 'in_progress' })}
                                  className="bg-blue-500 hover:bg-blue-600 text-white h-11 px-6 rounded-xl"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Demarrer
                                </Button>
                              )}
                              {currentPhaseData.status !== 'completed' && (
                                <Button
                                  onClick={() => currentPhaseData.id && completeMutation.mutate(currentPhaseData.id)}
                                  className="bg-[#27AE60] hover:bg-[#229954] text-white h-11 px-6 rounded-xl"
                                >
                                  <Check className="w-5 h-5 mr-2" />
                                  Marquer comme Terminee
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Navigation Footer */}
                  {phases.length > 0 && (
                    <div className="bg-white border-t-2 border-[#F0F0F0] px-8 py-4 flex items-center justify-between flex-shrink-0">
                      <Button
                        variant="outline"
                        onClick={previousPhase}
                        disabled={currentPhase === 0}
                        className="border border-[#E9ECEF] text-[#7F8C8D] hover:bg-[#F8F9FA] h-11 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Precedent
                      </Button>

                      <Button
                        onClick={nextPhase}
                        disabled={currentPhase === 3}
                        className="bg-[#E67E22] hover:bg-[#D35400] text-white h-11 px-8 rounded-lg font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── Contracts Tab ─── */}
          {activeTab === 'contracts' && (
            <div className="p-6">
              {loadingContracts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E67E22]" />
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Aucun contrat lie a cette opportunite</p>
                  <p className="text-xs text-slate-400 mt-1">Ajoutez un contrat depuis la page Contrats</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map(contract => (
                    <Card
                      key={contract.id}
                      className="p-4 flex items-center justify-between hover:shadow-md transition-shadow border border-[#E9ECEF]"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">V{contract.version}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#2C3E50] text-sm">{contract.reference}</p>
                            {contract.filePath && (
                              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px]">PDF</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#7F8C8D]">
                            <span className="font-semibold text-[#E67E22]">{fmtCurrency(contract.amount)} DT</span>
                            <span>{fmtDate(contract.dateStart)} → {fmtDate(contract.dateEnd)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {contract.filePath && contract.id && (
                          <Button variant="ghost" size="sm" className="hover:bg-green-50"
                            onClick={() => window.open(contractApi.getDownloadUrl(contract.id!), '_blank')}>
                            <Download className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── History Tab ─── */}
          {activeTab === 'history' && (
            <div className="p-6">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Aucun historique disponible</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#E67E22] to-[#BDC3C7]"></div>

                  <div className="space-y-3 relative z-10">
                    {history.map((event) => (
                      <Card key={event.id} className="p-4 ml-12 border border-[#E9ECEF] shadow-sm hover:shadow-md transition-shadow">
                        <div className="absolute left-0 top-4 w-9 h-9 -ml-4">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-md">
                            <div className="w-6 h-6 bg-[#E67E22] rounded-full flex items-center justify-center">
                              <span className="text-white text-[9px] font-bold">{event.avatar}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-[#2C3E50] text-sm">{event.description}</p>
                          <p className="text-xs text-[#7F8C8D] mt-1">
                            {event.user} &bull; {event.date}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Bar - Only for non-phases tabs */}
        {activeTab !== 'phases' && (
          <div className="bg-white border-t border-[#E9ECEF] px-6 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
            <Button variant="outline" className="border-2 border-[#E9ECEF] text-[#2C3E50] hover:bg-[#F8F9FA] font-semibold">
              ✏️ Modifier
            </Button>
            <div className="flex gap-2">
              {opportunity.pipelineStage === 'gagnee' && (
                <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white font-semibold shadow-lg gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Convertir
                </Button>
              )}
              <Button variant="outline" className="border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold gap-2">
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Phase Inline Edit ─── */
function PhaseInlineEdit({ phase, onSave, onCancel }: {
  phase: Phase; onSave: () => void; onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  const cfg = PHASE_TYPES[phase.type] || { label: phase.type, icon: FileText, color: '#64748b' }

  const STATUSES_BY_TYPE: Record<string, string[]> = {
    meeting: ['pending', 'in_progress', 'completed'],
    study: ['pending', 'in_progress', 'completed'],
    offer: ['not_sent', 'sent', 'negotiated', 'accepted', 'refused'],
    contract: ['pending', 'in_progress', 'completed'],
  }

  const [form, setForm] = useState({
    status: phase.status,
    notes: phase.notes || '',
    meetingDate: phase.meetingDate?.split('T')[0] || '',
    meetingTime: phase.meetingTime || '',
    dueDate: phase.dueDate?.split('T')[0] || '',
    progress: String(phase.progress || 0),
    validated: phase.validated,
    montant: phase.montant != null ? String(phase.montant) : '',
    dateEnvoi: phase.dateEnvoi?.split('T')[0] || '',
    dateValidite: phase.dateValidite?.split('T')[0] || '',
    feedbackClient: phase.feedbackClient || '',
    reference: phase.reference || '',
    dateSignature: phase.dateSignature?.split('T')[0] || '',
    signed: phase.signed,
  })

  const set = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!phase.id) return
    setSaving(true)
    try {
      await phaseApi.update(phase.id, {
        ...phase,
        status: form.status,
        notes: form.notes || null,
        meetingDate: form.meetingDate || null,
        meetingTime: form.meetingTime || null,
        dueDate: form.dueDate || null,
        progress: Number(form.progress) || 0,
        validated: form.validated,
        montant: form.montant ? Number(form.montant) : null,
        dateEnvoi: form.dateEnvoi || null,
        dateValidite: form.dateValidite || null,
        feedbackClient: form.feedbackClient || null,
        reference: form.reference || null,
        dateSignature: form.dateSignature || null,
        signed: form.signed,
      })
      onSave()
    } finally { setSaving(false) }
  }

  const availableStatuses = STATUSES_BY_TYPE[phase.type] || ['pending', 'in_progress', 'completed']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {phase.type === 'meeting' ? '👥' : phase.type === 'study' ? '📊' : phase.type === 'offer' ? '💰' : '📄'}
          </span>
          <div>
            <h3 className="text-2xl font-bold text-[#2C3E50]">Modifier - {cfg.label}</h3>
            <div className="h-1 w-16 bg-[#E67E22] rounded mt-1"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}
            className="border-[#E9ECEF] text-[#7F8C8D] h-10 px-4 rounded-xl">
            Annuler
          </Button>
          <Button type="submit" disabled={saving}
            className="bg-[#E67E22] hover:bg-[#D35400] text-white h-10 px-6 rounded-xl gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Status */}
      <div>
        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Statut</Label>
        <Select value={form.status} onValueChange={(v) => set('status', v)}>
          <SelectTrigger className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableStatuses.map(s => <SelectItem key={s} value={s}>{getStatusCfg(s).label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Meeting fields */}
      {phase.type === 'meeting' && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date</Label>
              <Input type="date" value={form.meetingDate} onChange={(e) => set('meetingDate', e.target.value)}
                className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Heure</Label>
              <Input type="time" value={form.meetingTime} onChange={(e) => set('meetingTime', e.target.value)}
                className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base" />
            </div>
          </div>
        </>
      )}

      {/* Study fields */}
      {phase.type === 'study' && (
        <>
          <div>
            <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Echeance</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)}
              className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-[#7F8C8D]">Progression</Label>
              <span className="text-xl font-bold text-[#E67E22]">{form.progress}%</span>
            </div>
            <Slider
              value={[Number(form.progress)]}
              onValueChange={(value) => set('progress', String(value[0]))}
              min={0}
              max={100}
              step={5}
              className="h-2"
            />
          </div>
          <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="validated" checked={form.validated}
                onChange={(e) => set('validated', e.target.checked)}
                className="w-5 h-5 rounded border-[#BDC3C7] text-[#E67E22] focus:ring-[#E67E22]" />
              <Label htmlFor="validated" className="text-base cursor-pointer">
                Etude validee par le client
              </Label>
            </div>
          </div>
        </>
      )}

      {/* Offer fields */}
      {phase.type === 'offer' && (
        <>
          <div>
            <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Montant Total Propose (DT)</Label>
            <Input type="number" placeholder="0.00" value={form.montant}
              onChange={(e) => set('montant', e.target.value)}
              className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date d'envoi</Label>
              <Input type="date" value={form.dateEnvoi} onChange={(e) => set('dateEnvoi', e.target.value)}
                className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Validite jusqu'au</Label>
              <Input type="date" value={form.dateValidite} onChange={(e) => set('dateValidite', e.target.value)}
                className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Retour du Client</Label>
            <Textarea placeholder="Commentaires ou demandes du client..."
              value={form.feedbackClient}
              onChange={(e) => set('feedbackClient', e.target.value)}
              className="min-h-[120px] bg-[#F8F9FA] border-[#E9ECEF] rounded-xl resize-none text-base p-4" />
          </div>
        </>
      )}

      {/* Contract fields */}
      {phase.type === 'contract' && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Reference</Label>
              <Input value={form.reference} onChange={(e) => set('reference', e.target.value)}
                placeholder="CTR-..." className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date de signature</Label>
              <Input type="date" value={form.dateSignature} onChange={(e) => set('dateSignature', e.target.value)}
                className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base" />
            </div>
          </div>
          <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="signed" checked={form.signed}
                onChange={(e) => set('signed', e.target.checked)}
                className="w-5 h-5 rounded border-[#BDC3C7] text-[#E67E22] focus:ring-[#E67E22]" />
              <Label htmlFor="signed" className="text-base cursor-pointer">
                Contrat signe
              </Label>
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Notes</Label>
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
          placeholder="Ajouter des notes..."
          className="min-h-[120px] bg-[#F8F9FA] border-[#E9ECEF] rounded-xl resize-none text-base p-4" />
      </div>
    </form>
  )
}
