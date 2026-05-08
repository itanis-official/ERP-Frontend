import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ChevronDown, ChevronUp, Download, Eye, Trash2, FileText, AlertCircle, Upload, Loader2, X, Building, File } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PaginationControls } from '../../components/ui/pagination-controls'
import { contractApi, type Contract } from '../../lib/contractApi'
import { companyApi, type Company } from '../../lib/companyApi'
import { opportunityApi, type Opportunity } from '../../lib/opportunityApi'
import { useModuleSelectOptions } from '../../lib/selectOptionsConfig'

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  draft: { label: 'Brouillon', style: 'bg-slate-50 text-slate-600 border-slate-200' },
  active: { label: 'Actif', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  replaced: { label: 'Remplacé', style: 'bg-slate-100 text-slate-500 border-slate-200' },
  expired: { label: 'Expiré', style: 'bg-rose-50 text-rose-600 border-rose-200' },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status || 'N/A', style: 'bg-slate-50 text-slate-500 border-slate-200' }
}

export function Contracts() {
  const qc = useQueryClient()
  const [viewMode, setViewMode] = useState<'company' | 'all'>('company')
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [searchCompany, setSearchCompany] = useState('')
  const [searchAll, setSearchAll] = useState('')
  const [allPage, setAllPage] = useState(1)
  const [allPageSize, setAllPageSize] = useState(10)
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [viewingContract, setViewingContract] = useState<Contract | null>(null)

  const { data: companies = [], isLoading: loadingCompanies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try { return await companyApi.getAll() }
      catch { return [] }
    },
  })

  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: async () => {
      try { return await opportunityApi.getAll() }
      catch { return [] }
    },
  })

  const { data: allContracts = [], isLoading: loadingContracts } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      try { return await contractApi.getAll() }
      catch { return [] }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contractApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  })

  // Auto-select first company
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id!)
    }
  }, [companies, selectedCompanyId])

  const filteredCompanies = companies.filter(c =>
    !searchCompany || c.raisonSociale?.toLowerCase().includes(searchCompany.toLowerCase())
  )

  const companyContracts = allContracts.filter(c => c.companyId === selectedCompanyId)
  const contractGroups = groupByReference(companyContracts)

  const filteredAll = allContracts.filter(c =>
    !searchAll ||
    c.reference?.toLowerCase().includes(searchAll.toLowerCase()) ||
    c.company?.raisonSociale?.toLowerCase().includes(searchAll.toLowerCase())
  )

  const allTotalPages = Math.max(1, Math.ceil(filteredAll.length / allPageSize))
  const safeAllPage = Math.min(allPage, allTotalPages)
  const paginatedAll = filteredAll.slice((safeAllPage - 1) * allPageSize, safeAllPage * allPageSize)

  useEffect(() => {
    setAllPage(1)
  }, [searchAll, allPageSize])

  useEffect(() => {
    if (allPage > allTotalPages) setAllPage(allTotalPages)
  }, [allPage, allTotalPages])

  const toggleRef = (ref: string) => {
    setExpandedRefs(prev => {
      const next = new Set(prev)
      if (next.has(ref)) next.delete(ref)
      else next.add(ref)
      return next
    })
  }

  const handleDelete = (id: number) => {
    if (confirm('Supprimer ce contrat ?')) deleteMutation.mutate(id)
  }

  const handleDownload = (contract: Contract) => {
    if (contract.id && contract.filePath) {
      window.open(contractApi.getDownloadUrl(contract.id), '_blank')
    }
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    qc.invalidateQueries({ queryKey: ['contracts'] })
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const contractCountByCompany = (companyId: number) => allContracts.filter(c => c.companyId === companyId).length

  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(v)

  // Get project name from opportunity
  const getProjectName = (projectId?: number | null) => {
    if (!projectId) return null
    const opp = opportunities.find(o => o.id === projectId)
    return opp?.titre || null
  }

  const isLoading = loadingCompanies || loadingContracts

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 animate-spin text-[#E67E22]" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestion des Contrats</h1>
          <p className="text-sm text-slate-400 mt-1">{allContracts.length} contrats enregistrés</p>
        </div>
        <Button onClick={() => setShowForm(true)}
          className="h-9 text-xs bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg shadow-sm shadow-orange-200 gap-1.5">
          <Plus size={14} /> Nouveau Contrat
        </Button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'company' as const, label: 'Vue par Société' },
          { id: 'all' as const, label: 'Tous les Contrats' },
        ].map(mode => (
          <button key={mode.id} onClick={() => setViewMode(mode.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === mode.id
                ? 'bg-[#E67E22] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            {mode.label}
          </button>
        ))}
      </div>

      {/* ─── Company View ─── */}
      {viewMode === 'company' && (
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar - Companies */}
          <div className="col-span-1 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <Input placeholder="Rechercher..." value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus:border-[#E67E22]" />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredCompanies.map(company => {
                const count = contractCountByCompany(company.id!)
                return (
                  <button key={company.id} onClick={() => { setSelectedCompanyId(company.id!); setExpandedRefs(new Set()); }}
                    className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                      selectedCompanyId === company.id
                        ? 'border-[#E67E22] bg-orange-50/60 shadow-sm'
                        : 'border-slate-200/60 hover:border-[#E67E22]/50 bg-white'
                    }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#E67E22] to-[#D35400] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {company.raisonSociale?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{company.raisonSociale}</p>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E67E22]/10 text-[#E67E22]">
                          {count} contrat{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main - Contract Versions */}
          <div className="col-span-3 space-y-5">
            {selectedCompany ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedCompany.raisonSociale}</h2>
                    <p className="text-sm text-slate-400">{companyContracts.length} contrats</p>
                  </div>
                  <Button onClick={() => setShowForm(true)}
                    className="h-9 text-xs bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg shadow-sm shadow-orange-200 gap-1.5">
                    <Plus size={14} /> Nouveau Contrat
                  </Button>
                </div>

                {contractGroups.length === 0 ? (
                  <Card className="bg-white border border-slate-200/60 rounded-xl p-10 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Aucun contrat pour cette société</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {contractGroups.map(group => {
                      const isExpanded = expandedRefs.has(group.baseRef)
                      const latest = group.contracts[group.contracts.length - 1]
                      const latestSc = getStatusConfig(latest.status)

                      return (
                        <Card key={group.baseRef} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                          {/* Group Header */}
                          <button onClick={() => toggleRef(group.baseRef)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="text-white" size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800">{group.baseRef}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs text-slate-400">{group.contracts.length} version(s)</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${latestSc.style}`}>
                                    {latestSc.label}
                                  </span>
                                  <span className="text-xs font-semibold text-[#E67E22]">{formatCurrency(latest.amount)}</span>
                                  {getProjectName(latest.projectId) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                                      {getProjectName(latest.projectId)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-slate-400" />
                              : <ChevronDown className="w-4 h-4 text-slate-400" />
                            }
                          </button>

                          {/* Versions */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3 bg-slate-50/50 border-t border-slate-100">
                              {group.contracts.map((contract, idx) => {
                                const sc = getStatusConfig(contract.status)
                                const isLatest = idx === group.contracts.length - 1
                                return (
                                  <div key={contract.id} className="bg-white rounded-xl p-4 border border-slate-200/60 mt-3 first:mt-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className="w-11 h-11 bg-gradient-to-br from-[#E67E22] to-[#D35400] rounded-lg flex items-center justify-center flex-shrink-0">
                                          <span className="text-white font-bold text-sm">V{contract.version}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-bold text-slate-800">{contract.reference}</p>
                                          <p className="text-xs text-slate-400 mt-0.5">
                                            {formatDate(contract.dateStart)} → {formatDate(contract.dateEnd)}
                                          </p>
                                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="text-base font-bold text-[#E67E22]">{formatCurrency(contract.amount)}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${sc.style}`}>
                                              {sc.label}
                                            </span>
                                            {isLatest && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                                Dernière version
                                              </span>
                                            )}
                                            {contract.filePath && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                PDF
                                              </span>
                                            )}
                                          </div>
                                          {getProjectName(contract.projectId) && (
                                            <p className="text-xs text-blue-500 mt-1.5 font-medium">
                                              Projet: {getProjectName(contract.projectId)}
                                            </p>
                                          )}
                                          {contract.notes && (
                                            <p className="text-xs text-slate-400 mt-2">{contract.notes}</p>
                                          )}
                                          <p className="text-[11px] text-slate-300 mt-2">
                                            Uploadé le {formatDate(contract.uploadDate)} • Créé le {formatDate(contract.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5 flex-shrink-0 ml-3">
                                        <button onClick={() => setViewingContract(contract)}
                                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                          <Eye size={15} />
                                        </button>
                                        {contract.filePath && (
                                          <button onClick={() => handleDownload(contract)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                            <Download size={15} />
                                          </button>
                                        )}
                                        <button onClick={() => contract.id && handleDelete(contract.id)}
                                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <Card className="bg-white border border-slate-200/60 rounded-xl p-10 text-center">
                <Building className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Sélectionnez une société</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── All Contracts View ─── */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input placeholder="Rechercher par référence, société..."
                value={searchAll} onChange={(e) => setSearchAll(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus:border-[#E67E22]" />
            </div>
          </div>

          <Card className="bg-white border border-slate-200/60 shadow-sm overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Référence</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Version</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Société</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projet</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Montant</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Période</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAll.map(contract => {
                    const sc = getStatusConfig(contract.status)
                    const comp = contract.company || companies.find(c => c.id === contract.companyId)
                    const projName = getProjectName(contract.projectId)
                    return (
                      <tr key={contract.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{contract.reference}</p>
                              {contract.filePath && (
                                <span className="text-[10px] text-emerald-500 font-medium">PDF joint</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E67E22]/10 text-[#E67E22]">
                            V{contract.version}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{comp?.raisonSociale || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-blue-500 font-medium">{projName || '—'}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#E67E22]">{formatCurrency(contract.amount)}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {formatDate(contract.dateStart)} → {formatDate(contract.dateEnd)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${sc.style}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewingContract(contract)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                              <Eye size={15} />
                            </button>
                            {contract.filePath && (
                              <button onClick={() => handleDownload(contract)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                <Download size={15} />
                              </button>
                            )}
                            <button onClick={() => contract.id && handleDelete(contract.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAll.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">Aucun contrat trouvé</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">{filteredAll.length} sur {allContracts.length} contrats</p>
              <PaginationControls
                page={safeAllPage}
                totalPages={allTotalPages}
                pageSize={allPageSize}
                onPageChange={setAllPage}
                onPageSizeChange={setAllPageSize}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Form Modal */}
      <ContractFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        companies={companies}
        opportunities={opportunities}
        allContracts={allContracts}
        defaultCompanyId={selectedCompanyId}
      />

      {/* View Modal */}
      {viewingContract && (
        <ContractViewModal
          contract={viewingContract}
          companies={companies}
          opportunities={opportunities}
          onClose={() => setViewingContract(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}

/* ─── Group contracts by base reference ─── */
function groupByReference(contracts: Contract[]) {
  const map = new Map<string, Contract[]>()
  const sorted = [...contracts].sort((a, b) => a.version - b.version)
  for (const c of sorted) {
    const base = c.reference.replace(/-V\d+$/i, '').replace(/-v\d+$/i, '')
    if (!map.has(base)) map.set(base, [])
    map.get(base)!.push(c)
  }
  return Array.from(map.entries()).map(([baseRef, contracts]) => ({ baseRef, contracts }))
}

/* ─── Contract Form Modal ─── */
function ContractFormModal({ open, onClose, onSubmit, companies, opportunities, allContracts, defaultCompanyId }: {
  open: boolean; onClose: () => void; onSubmit: () => void
  companies: Company[]; opportunities: Opportunity[]; allContracts: Contract[]; defaultCompanyId: number | null
}) {
  const crmSelectOptions = useModuleSelectOptions('crm')
  const [isVisible, setIsVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contractType, setContractType] = useState<'new' | 'updated'>('new')
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    reference: '', companyId: '', projectId: '', amount: '', dateStart: '', dateEnd: '', status: 'draft', notes: '',
  })

  useEffect(() => {
    if (open) {
      setFormData({
        reference: '', companyId: defaultCompanyId ? String(defaultCompanyId) : '',
        projectId: '', amount: '', dateStart: '', dateEnd: '', status: 'draft', notes: '',
      })
      setContractType('new')
      setSelectedFile(null)
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [open, defaultCompanyId])

  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 250) }

  // Filter opportunities by selected company
  const companyOpps = formData.companyId
    ? opportunities.filter(o => o.companyId === Number(formData.companyId))
    : []

  // Calculate next version when "Version mise à jour"
  const getNextVersion = () => {
    if (contractType !== 'updated' || !formData.reference || !formData.companyId) return 1
    const baseRef = formData.reference.replace(/-V\d+$/i, '')
    const existing = allContracts.filter(c =>
      c.companyId === Number(formData.companyId) &&
      c.reference.replace(/-V\d+$/i, '') === baseRef
    )
    if (existing.length === 0) return 1
    return Math.max(...existing.map(c => c.version)) + 1
  }

  // Get existing references for version update mode
  const existingRefs = formData.companyId
    ? [...new Set(
        allContracts
          .filter(c => c.companyId === Number(formData.companyId))
          .map(c => c.reference.replace(/-V\d+$/i, ''))
      )]
    : []

  const handleFileSelect = (file: globalThis.File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.reference || !formData.companyId || !selectedFile) return
    setSaving(true)
    try {
      const version = contractType === 'updated' ? getNextVersion() : 1
      const ref = contractType === 'updated'
        ? `${formData.reference}-V${version}`
        : formData.reference

      await contractApi.create({
        reference: ref,
        companyId: Number(formData.companyId),
        projectId: formData.projectId ? Number(formData.projectId) : null,
        amount: Number(formData.amount) || 0,
        dateStart: formData.dateStart || null,
        dateEnd: formData.dateEnd || null,
        status: formData.status,
        notes: formData.notes || null,
        version,
        file: selectedFile,
      })
      onSubmit()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'
      }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[600px] w-full my-8 overflow-hidden flex flex-col max-h-[88vh] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="border-b border-slate-100 px-7 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {contractType === 'updated' ? 'Nouvelle Version' : 'Nouveau Contrat'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">Uploadez le fichier PDF du contrat</p>
            </div>
            <button onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-5">
          {/* Type */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Type d'ajout
            </h3>
            <div className="flex gap-3">
              {[
                { id: 'new' as const, label: 'Nouveau contrat', desc: 'Première version' },
                { id: 'updated' as const, label: 'Version mise à jour', desc: 'Ajouter à un contrat existant' },
              ].map(t => (
                <label key={t.id}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    contractType === t.id
                      ? 'border-[#E67E22] bg-orange-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <input type="radio" name="contractType" checked={contractType === t.id}
                    onChange={() => { setContractType(t.id); setFormData(f => ({ ...f, reference: '' })) }}
                    className="accent-[#E67E22]" />
                  <div>
                    <span className="text-sm font-medium text-slate-700 block">{t.label}</span>
                    <span className="text-[11px] text-slate-400">{t.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Société & Projet */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Société & Projet
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Société *</Label>
                <Select value={formData.companyId} onValueChange={(v) => setFormData({ ...formData, companyId: v, projectId: '', reference: '' })}>
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Sélectionner une société" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.raisonSociale}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Projet (Opportunité)</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder={companyOpps.length > 0 ? 'Sélectionner un projet' : 'Aucun projet pour cette société'} />
                  </SelectTrigger>
                  <SelectContent>
                    {companyOpps.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.titre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Référence */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Informations
            </h3>
            <div className="space-y-4">
              {contractType === 'updated' && existingRefs.length > 0 ? (
                <div>
                  <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Contrat existant *</Label>
                  <Select value={formData.reference} onValueChange={(v) => setFormData({ ...formData, reference: v })}>
                    <SelectTrigger className="h-10 border-slate-200">
                      <SelectValue placeholder="Sélectionner le contrat à mettre à jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingRefs.map(ref => (
                        <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.reference && (
                    <p className="text-xs text-[#E67E22] mt-1.5 font-medium">
                      Sera créé en tant que V{getNextVersion()}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Référence *</Label>
                  <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="CTR-2026-001" className="h-10 border-slate-200 focus:border-[#E67E22]" required />
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Montant (DT)</Label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00" className="h-10 border-slate-200 focus:border-[#E67E22]" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Dates & Statut
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Date début</Label>
                <Input type="date" value={formData.dateStart} onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                  className="h-10 border-slate-200 focus:border-[#E67E22]" />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Date fin</Label>
                <Input type="date" value={formData.dateEnd} onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                  className="h-10 border-slate-200 focus:border-[#E67E22]" />
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Statut</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(crmSelectOptions.contractStatuses || []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PDF Upload */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Document PDF *
            </h3>
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />

            {selectedFile ? (
              <div className="border-2 border-emerald-200 bg-emerald-50/50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <File className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#E67E22] bg-orange-50/50'
                    : 'border-slate-200 hover:border-[#E67E22]/50'
                }`}>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Cliquez ou déposez le fichier PDF</p>
                <p className="text-xs text-slate-300 mt-1">Format PDF uniquement, max 10MB</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium text-slate-600 mb-1.5 block">Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes internes..." rows={3} className="border-slate-200 focus:border-[#E67E22]" />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 px-7 py-4 bg-slate-50/50 flex items-center justify-end gap-3 flex-shrink-0">
          <Button type="button" variant="outline" onClick={handleClose} className="border-slate-200 text-slate-500">
            Annuler
          </Button>
          <Button onClick={(e) => { e.preventDefault(); const form = (e.target as HTMLElement).closest('.flex-col')?.querySelector('form'); form?.requestSubmit() }}
            disabled={saving || !formData.reference || !formData.companyId || !selectedFile}
            className="bg-[#E67E22] hover:bg-[#D35400] text-white shadow-sm shadow-orange-200 gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Uploader le Contrat
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── Contract View Modal ─── */
function ContractViewModal({ contract, companies, opportunities, onClose, onDownload }: {
  contract: Contract; companies: Company[]; opportunities: Opportunity[]; onClose: () => void; onDownload: (c: Contract) => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  const close = () => { setVisible(false); setTimeout(onClose, 250) }
  const sc = getStatusConfig(contract.status)
  const comp = contract.company || companies.find(c => c.id === contract.companyId)
  const proj = contract.projectId ? opportunities.find(o => o.id === contract.projectId) : null
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(v)

  const fields = [
    { label: 'Référence', value: contract.reference },
    { label: 'Version', value: `V${contract.version}` },
    { label: 'Société', value: comp?.raisonSociale },
    { label: 'Projet', value: proj?.titre || '—' },
    { label: 'Montant', value: formatCurrency(contract.amount) },
    { label: 'Date début', value: formatDate(contract.dateStart) },
    { label: 'Date fin', value: formatDate(contract.dateEnd) },
    { label: 'Statut', value: sc.label },
    { label: 'Date upload', value: formatDate(contract.uploadDate) },
  ]

  return (
    <div onClick={(e) => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${visible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        <div className="relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700" />
          <div className="relative px-7 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <span className="text-white font-bold text-sm">V{contract.version}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{contract.reference}</h2>
                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${sc.style}`}>
                  {sc.label}
                </span>
              </div>
            </div>
            <button onClick={close}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-7 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-blue-500" />
              Détails
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f, i) => (
                <div key={i} className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                  <p className="text-sm font-medium text-slate-700">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Download */}
          {contract.filePath && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-3.5 rounded-full bg-blue-500" />
                Document
              </h3>
              <button onClick={() => onDownload(contract)}
                className="w-full flex items-center gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 transition-colors">
                  <File className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-700">{contract.reference}.pdf</p>
                  <p className="text-xs text-slate-400">Cliquez pour télécharger</p>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>
          )}

          {contract.notes && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-3.5 rounded-full bg-blue-500" />
                Notes
              </h3>
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed">{contract.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
