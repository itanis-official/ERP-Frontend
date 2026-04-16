import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, CheckCircle, ArrowRight, X, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { opportunityApi, type Opportunity } from '../../lib/opportunityApi'
import { companyApi } from '../../lib/companyApi'
import { crmApi } from '../../lib/api'
import { OpportunityForm } from '../../components/OpportunityForm'
import { OpportunityDetailModal } from '../../components/OpportunityDetailModal'

const STAGES = [
  { id: 'prospection', name: 'Prospection', color: '#64748b', light: '#f1f5f9', headerBg: 'bg-slate-50' },
  { id: 'qualification', name: 'Qualification', color: '#6366f1', light: '#eef2ff', headerBg: 'bg-indigo-50/60' },
  { id: 'negociation', name: 'Négociation', color: '#E67E22', light: '#fff7ed', headerBg: 'bg-orange-50/60' },
  { id: 'gagnee', name: 'Gagnée', color: '#10b981', light: '#ecfdf5', headerBg: 'bg-emerald-50/60' },
  { id: 'perdue', name: 'Perdue', color: '#f43f5e', light: '#fff1f2', headerBg: 'bg-rose-50/60' },
]

export function Pipeline() {
  const qc = useQueryClient()
  const [isOpportunityFormOpen, setIsOpportunityFormOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [lossModalOpp, setLossModalOpp] = useState<Opportunity | null>(null)
  const [conversionModalOpp, setConversionModalOpp] = useState<Opportunity | null>(null)

  const { data: opportunities = [], isLoading } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: async () => {
      try { return await opportunityApi.getAll() }
      catch { return [] }
    },
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      try { return await companyApi.getAll() }
      catch { return [] }
    },
  })

  const changeStage = useMutation({
    mutationFn: ({ id, stage, raisonPerte }: { id: number; stage: string; raisonPerte?: string }) =>
      opportunityApi.changeStage(id, stage, raisonPerte),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['opportunities'] })
      const previous = qc.getQueryData<Opportunity[]>(['opportunities'])
      qc.setQueryData<Opportunity[]>(['opportunities'], (old) =>
        old?.map(o => o.id === id ? { ...o, pipelineStage: stage } : o) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['opportunities'], context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })

  const createOpportunity = useMutation({
    mutationFn: (payload: Partial<Opportunity>) => opportunityApi.create(payload as Opportunity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      setIsOpportunityFormOpen(false)
    },
  })

  const handleOpportunitySubmit = (data: any) => {
    createOpportunity.mutate({
      companyId: Number(data.societe) || 0,
      titre: data.titre,
      typeProjet: data.typeProjet || null,
      valeurEstimee: Number(data.valeurEstimee) || 0,
      probabilite: Number(data.probabilite) || 50,
      pipelineStage: data.pipelineStage || 'prospection',
      dateCloturePrevu: data.dateCloturePrevu || null,
      type: data.opportunityType || 'nouveau',
      subType: data.typeAjout || null,
      projectParentId: data.projetParent ? Number(data.projetParent) : null,
      agentCommercialId: data.agentCommercial ? Number(data.agentCommercial) : null,
      agentCdcId: data.agentCdc ? Number(data.agentCdc) : null,
      echeanceCdc: data.echeanceCdc || null,
      notes: data.notes || null,
    })
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const id = Number(result.draggableId)
    const stage = result.destination.droppableId
    if (result.source.droppableId === stage) return

    if (stage === 'perdue') {
      const opp = opportunities.find(o => o.id === id)
      if (opp) { setLossModalOpp(opp); return }
    }
    changeStage.mutate({ id, stage })
  }

  const handleLossConfirm = (reason: string) => {
    if (!lossModalOpp?.id) return
    changeStage.mutate({ id: lossModalOpp.id, stage: 'perdue', raisonPerte: reason })
    setLossModalOpp(null)
  }

  const getCompanyInfo = (companyId: number) => companies.find(c => c.id === companyId)
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'
  const getOppsByStage = (stage: string) => opportunities.filter(o => o.pipelineStage === stage)
  const getTotalByStage = (stage: string) => getOppsByStage(stage).reduce((sum, o) => sum + (o.valeurEstimee || 0), 0)
  const totalPipeline = opportunities.reduce((sum, o) => sum + (o.valeurEstimee || 0), 0)
  const wonTotal = getTotalByStage('gagnee')
  const wonCount = getOppsByStage('gagnee').length
  const conversionRate = opportunities.length > 0 ? Math.round((wonCount / opportunities.length) * 100) : 0
  const fmtCurrency = (v: number) => new Intl.NumberFormat('fr-FR').format(v)

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 animate-spin text-[#E67E22]" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pipeline Commercial</h1>
          <p className="text-sm text-slate-500 mt-1">{opportunities.length} opportunités</p>
        </div>
        <Button onClick={() => setIsOpportunityFormOpen(true)}
          className="h-9 text-xs bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg shadow-sm shadow-orange-200 gap-1.5">
          <Plus size={14} /> Nouvelle Opportunité
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E67E22] to-[#D35400] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pipeline Total</p>
            <p className="text-lg font-bold text-slate-800">{fmtCurrency(totalPipeline)} DT</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gagné</p>
            <p className="text-lg font-bold text-slate-800">{fmtCurrency(wonTotal)} DT</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Taux Conversion</p>
            <p className="text-lg font-bold text-slate-800">{conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Kanban Board - Table style */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto">
            <div className="flex divide-x divide-slate-200/60 min-w-[1200px]" style={{ blockSize: 560 }}>
            {STAGES.map((stage) => {
              const stageOpps = getOppsByStage(stage.id)
              const stageTotal = getTotalByStage(stage.id)
              const isWon = stage.id === 'gagnee'
              const isLost = stage.id === 'perdue'

              return (
                <div key={stage.id} className="flex-1 min-w-[240px] flex flex-col">
                  {/* Column Header */}
                  <div className={`px-3 py-3 ${stage.headerBg} border-b border-slate-200/60 flex-shrink-0`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-bold text-slate-700 flex-1">{stage.name}</span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: stage.color, backgroundColor: stage.light }}>
                        {stageOpps.length}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 pl-4">{fmtCurrency(stageTotal)} DT</p>
                  </div>

                  {/* Cards */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex flex-col gap-2 p-2 flex-1 min-h-0 overflow-y-auto transition-colors duration-200"
                      style={{ backgroundColor: snapshot.isDraggingOver ? stage.light : undefined }}
                      >
                        {stageOpps.map((opp, index) => {
                          const company = getCompanyInfo(opp.companyId)
                          return (
                            <Draggable key={opp.id} draggableId={String(opp.id)} index={index}>
                              {(p, snap) => (
                                <div
                                  ref={p.innerRef}
                                  {...p.draggableProps}
                                  {...p.dragHandleProps}
                                  style={{
                                    ...p.draggableProps.style,
                                    opacity: snap.isDragging ? 0.7 : isLost ? 0.6 : 1,
                                    transition: snap.isDragging ? undefined : 'opacity 0.2s ease',
                                  }}
                                >
                                  <div
                                    onClick={() => setSelectedOpportunity(opp)}
                                    className="bg-white rounded-lg border border-slate-200/80 p-3 cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
                                    style={{ borderInlineStart: `3px solid ${stage.color}` }}
                                  >
                                    {/* Company */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: stage.color }}>
                                        <span className="text-white text-[10px] font-bold">{getInitials(company?.raisonSociale)}</span>
                                      </div>
                                      <span className="text-xs text-slate-500 truncate">{company?.raisonSociale || 'Société'}</span>
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-2">{opp.titre}</h4>

                                    {/* Amount + Probability */}
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm font-bold" style={{ color: stage.color }}>
                                        {fmtCurrency(opp.valeurEstimee || 0)} DT
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-500">{opp.probabilite}%</span>
                                    </div>

                                    {/* Probability bar */}
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-500"
                                        style={{ inlineSize: `${opp.probabilite || 0}%`, backgroundColor: stage.color, opacity: 0.7 }} />
                                    </div>

                                    {/* Loss reason */}
                                    {isLost && opp.raisonPerte && (
                                      <p className="text-[11px] text-rose-500 mt-2 pt-2 border-t border-slate-100 line-clamp-2">
                                        {opp.raisonPerte}
                                      </p>
                                    )}

                                    {/* Convert button */}
                                    {isWon && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setConversionModalOpp(opp) }}
                                        className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold animate-pulse hover:animate-none hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                                        style={{ color: '#fff', background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)` }}>
                                        <CheckCircle size={12} />
                                        Convertir en Projet
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}

                        {stageOpps.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex-1 flex items-center justify-center py-8">
                            <p className="text-xs text-slate-400">Vide</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <OpportunityForm
        open={isOpportunityFormOpen}
        onClose={() => setIsOpportunityFormOpen(false)}
        onSubmit={handleOpportunitySubmit}
      />
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
      {lossModalOpp && (
        <LossReasonModal
          opportunity={lossModalOpp}
          onConfirm={handleLossConfirm}
          onClose={() => setLossModalOpp(null)}
        />
      )}
      {conversionModalOpp && (
        <ConversionModal
          opportunity={conversionModalOpp}
          company={getCompanyInfo(conversionModalOpp.companyId)}
          onClose={() => setConversionModalOpp(null)}
        />
      )}
    </div>
  )
}

/* ─── Loss Reason Modal ─── */
function LossReasonModal({ opportunity, onConfirm, onClose }: {
  opportunity: Opportunity; onConfirm: (reason: string) => void; onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  const close = () => { setVisible(false); setTimeout(onClose, 250) }

  return (
    <div onClick={(e) => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        visible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'
      }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 ease-out ${
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        <div className="px-7 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Raison de la perte</h2>
              <p className="text-sm text-slate-500 mt-0.5">{opportunity.titre}</p>
            </div>
            <button onClick={close}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-7">
          <FieldLabel text="Raison *" />
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Prix trop élevé, concurrent retenu, projet annulé..."
            rows={4} className="border-slate-200 focus:border-[#E67E22]" />
        </div>
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <Button variant="outline" className="flex-1 border-slate-200 text-slate-500" onClick={close}>Annuler</Button>
          <Button className="flex-1 bg-[#E67E22] hover:bg-[#D35400] text-white" disabled={!reason.trim()}
            onClick={() => { if (reason.trim()) { onConfirm(reason); close() } }}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── Conversion Modal ─── */
function ConversionModal({ opportunity, company, onClose }: {
  opportunity: Opportunity; company?: { id?: number; raisonSociale: string; secteur?: string }; onClose: () => void
}) {
  interface AgentLite {
    id: number
    nom: string
    prenom: string
    role?: string
  }

  const [visible, setVisible] = useState(false)
  const [projectName, setProjectName] = useState(opportunity.titre)
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [confirmedBudget, setConfirmedBudget] = useState(String(opportunity.valeurEstimee || 0))
  const [chefProjetId, setChefProjetId] = useState('none')

  const { data: agents = [] } = useQuery<AgentLite[]>({
    queryKey: ['crm-agents-list-conversion'],
    queryFn: async () => {
      const response = await crmApi.get('/api/Agents')
      return response.data
    },
    enabled: !!opportunity?.id,
  })

  const chefsProjet = agents.filter((a) => {
    const role = (a.role || '').toLowerCase()
    return role.includes('chef') || role.includes('manager') || role.includes('projet')
  })

  const canSubmit = Boolean(
    projectName.trim() &&
    description.trim() &&
    startDate &&
    Number(confirmedBudget) > 0 &&
    chefProjetId !== 'none'
  )

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  const close = () => { setVisible(false); setTimeout(onClose, 250) }

  return (
    <div onClick={(e) => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        visible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'
      }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[550px] w-full my-8 overflow-hidden flex flex-col max-h-[88vh] transition-all duration-300 ease-out ${
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        <div className="px-7 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Convertir en Projet Technique</h2>
              <p className="text-sm text-slate-500 mt-0.5">{opportunity.titre}</p>
            </div>
            <button onClick={close}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-7 space-y-5">
          {/* Flow */}
          <div className="flex items-center justify-center gap-4 py-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#E67E22] rounded-xl flex items-center justify-center mx-auto mb-1.5">
                <span className="text-lg">💼</span>
              </div>
              <p className="text-xs font-semibold text-slate-600">Opportunité</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#E67E22]" />
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-1.5">
                <span className="text-lg">📋</span>
              </div>
              <p className="text-xs font-semibold text-slate-600">Projet</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Société</p>
              <p className="text-sm font-semibold text-slate-700">{company?.raisonSociale || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget estimé</p>
              <p className="text-sm font-semibold text-slate-700">{(opportunity.valeurEstimee || 0).toLocaleString('fr-FR')} DT</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <FieldLabel text="Nom du projet *" />
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)}
                className="h-10 border-slate-200 focus:border-[#E67E22]" />
            </div>
            <div>
              <FieldLabel text="Description *" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Objectifs et périmètre du projet..." rows={3}
                className="border-slate-200 focus:border-[#E67E22]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel text="Date de début *" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 border-slate-200 focus:border-[#E67E22]" />
              </div>
              <div>
                <FieldLabel text="Budget confirmé (DT) *" />
                <Input type="number" value={confirmedBudget} onChange={(e) => setConfirmedBudget(e.target.value)}
                  className="h-10 border-slate-200 focus:border-[#E67E22]" />
              </div>
            </div>

            <div>
              <FieldLabel text="Affectation Chef de Projet *" />
              <Select value={chefProjetId} onValueChange={setChefProjetId}>
                <SelectTrigger className="h-10 border-slate-200 focus:border-[#E67E22]">
                  <SelectValue placeholder="Sélectionner un chef de projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sélectionner...</SelectItem>
                  {chefsProjet.map((chef) => (
                    <SelectItem key={chef.id} value={String(chef.id)}>
                      {chef.prenom} {chef.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chefsProjet.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Aucun profil chef de projet détecté pour le moment.</p>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              Une fois convertie, l'opportunité sera marquée comme "Converti" et ne pourra plus être modifiée dans le pipeline.
            </p>
          </div>
        </div>

        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 flex-shrink-0">
          <Button variant="outline" className="flex-1 border-slate-200 text-slate-500" onClick={close}>Annuler</Button>
          <Button className="flex-1 bg-[#E67E22] hover:bg-[#D35400] text-white shadow-sm shadow-orange-200"
            disabled={!canSubmit}
            onClick={close}>
            Confirmer et Créer le Projet
          </Button>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ text }: { text: string }) {
  return <p className="text-sm font-medium text-slate-600 mb-1.5">{text}</p>
}
