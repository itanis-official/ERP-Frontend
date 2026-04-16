import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Eye, Edit2, Trash2, Download, Building, Loader2, X, Mail, Phone, UserPlus, Users } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PaginationControls } from '../../components/ui/pagination-controls'
import { CompanyForm } from '../../components/CompanyForm'
import { ContactForm } from '../../components/ContactForm'
import { companyApi, type Company } from '../../lib/companyApi'
import { contactApi, type Contact } from '../../lib/contactApi'
import { crmApi } from '../../lib/api'
import { downloadCsv } from '../../lib/csvExport'
import { useModuleSelectOptions } from '../../lib/selectOptionsConfig'

interface AgentLite {
  id: number
  nom: string
  prenom: string
}

interface EquipeLite {
  id: number
  nom: string
}

export function Companies() {
  const qc = useQueryClient()
  const crmSelectOptions = useModuleSelectOptions('crm')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactCompany, setContactCompany] = useState<Company | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try { return await companyApi.getAll() }
      catch { return [] }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => companyApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'client': case 'actif':
        return { label: 'Actif', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'prospect':
        return { label: 'Prospect', style: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'inactif':
        return { label: 'Inactif', style: 'bg-slate-50 text-slate-500 border-slate-200' }
      default:
        return { label: status || 'N/A', style: 'bg-blue-50 text-blue-700 border-blue-200' }
    }
  }

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = !searchTerm ||
      c.raisonSociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ville?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const companyStatusOptions = crmSelectOptions.companyStatus || []

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedCompanies = filteredCompanies.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleExportCsv = () => {
    downloadCsv('societes', filteredCompanies, [
      { header: 'Raison sociale', value: (company) => company.raisonSociale },
      { header: 'Matricule fiscal', value: (company) => company.matriculeFiscal },
      { header: 'Secteur', value: (company) => company.secteur },
      { header: 'Ville', value: (company) => company.ville },
      { header: 'Pays', value: (company) => company.pays },
      { header: 'Email principal', value: (company) => company.emailPrincipal },
      { header: 'Telephone principal', value: (company) => `${company.telephonePrincipalCountry || ''} ${company.telephonePrincipal || ''}`.trim() },
      { header: 'Statut', value: (company) => company.statut },
      { header: 'Contacts', value: (company) => company.contacts?.length || 0 },
    ])
  }

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleSubmitCompany = () => {
    setShowCompanyForm(false)
    setEditingCompany(null)
    qc.invalidateQueries({ queryKey: ['companies'] })
  }

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleAddContact = (company: Company) => {
    setContactCompany(company)
    setShowContactForm(true)
  }

  const handleContactSubmit = async (data: any) => {
    if (!contactCompany?.id) return
    await contactApi.create({ ...data, companyId: contactCompany.id })
    setShowContactForm(false)
    setContactCompany(null)
    qc.invalidateQueries({ queryKey: ['contacts', 'company', contactCompany.id] })
    qc.invalidateQueries({ queryKey: ['companies'] })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 animate-spin text-[#E67E22]" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sociétés</h1>
          <p className="text-sm text-slate-400 mt-1">{companies.length} sociétés enregistrées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-xs rounded-lg border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 gap-1.5" onClick={handleExportCsv}>
            <Download size={14} /> Export CSV
          </Button>
          <Button className="h-9 text-xs bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg shadow-sm shadow-orange-200 gap-1.5"
            onClick={() => setShowCompanyForm(true)}>
            <Plus size={14} /> Nouvelle Société
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <Input
            type="text"
            placeholder="Rechercher par nom, secteur, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus:bg-white focus:border-[#E67E22] focus:ring-[#E67E22]/10 transition-all"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[190px] h-9 text-xs border-slate-200 rounded-lg bg-white">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Statut:</span>
              <SelectValue placeholder="Tous les statuts" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {companyStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-white border border-slate-200/60 shadow-sm overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Société</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Secteur</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ville</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contacts</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCompanies.map((company) => {
                const sc = getStatusConfig(company.statut || 'prospect')
                return (
                  <tr key={company.id} className="group hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E67E22] to-[#D35400] flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0">
                          {getInitials(company.raisonSociale)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{company.raisonSociale}</p>
                          <p className="text-[11px] text-slate-400">{company.matriculeFiscal || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{company.secteur || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{company.ville || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{company.contacts?.length || 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${sc.style}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={() => setViewingCompany(company)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => { setEditingCompany(company); setShowCompanyForm(true); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => company.id && handleDelete(company.id)} disabled={deleteMutation.isPending}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150 disabled:opacity-40">
                          {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                    Aucune société trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            {filteredCompanies.length} sur {companies.length} sociétés
          </p>
          <PaginationControls
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Company Form Modal */}
      <CompanyForm
        open={showCompanyForm}
        onClose={() => { setShowCompanyForm(false); setEditingCompany(null); }}
        onSubmit={handleSubmitCompany}
        initialData={editingCompany || undefined}
        editMode={!!editingCompany}
        companyName={editingCompany?.raisonSociale}
      />

      {/* View Company Modal */}
      {viewingCompany && <CompanyViewModal company={viewingCompany} onClose={() => setViewingCompany(null)} getInitials={getInitials} getStatusConfig={getStatusConfig} onAddContact={handleAddContact} />}

      {/* Contact Form Modal (top-level, outside all other modals) */}
      <ContactForm
        open={showContactForm}
        onClose={() => { setShowContactForm(false); setContactCompany(null); }}
        onSubmit={handleContactSubmit}
        companyName={contactCompany?.raisonSociale || ''}
      />
    </div>
  )
}

/* ─── View Modal ─── */
function CompanyViewModal({ company, onClose, getInitials, getStatusConfig, onAddContact }: {
  company: any; onClose: () => void;
  getInitials: (n: string) => string;
  getStatusConfig: (s: string) => { label: string; style: string };
  onAddContact: (company: any) => void;
}) {
  const qc = useQueryClient()
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'contacts'>('info')

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, [])
  const close = () => { setVisible(false); setTimeout(onClose, 250); }
  const sc = getStatusConfig(company.statut)

  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({
    queryKey: ['contacts', 'company', company.id],
    queryFn: () => contactApi.getByCompany(company.id),
    enabled: !!company.id,
  })

  const { data: agents = [] } = useQuery<AgentLite[]>({
    queryKey: ['crm-agents-list-company-modal'],
    queryFn: async () => {
      const response = await crmApi.get('/api/Agents')
      return response.data
    },
    enabled: !!company?.id,
  })

  const { data: equipes = [] } = useQuery<EquipeLite[]>({
    queryKey: ['crm-equipes-list-company-modal'],
    queryFn: async () => {
      const response = await crmApi.get('/api/Equipes')
      return response.data
    },
    enabled: !!company?.id,
  })

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => contactApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', 'company', company.id] }),
  })

  const handleDeleteContact = (id: number) => {
    if (confirm('Supprimer ce contact ?')) deleteContactMutation.mutate(id)
  }

  const getAffectationLabel = (type?: string | null) => {
    const value = (type || 'global').toLowerCase()
    if (value === 'agent') return 'Agent responsable'
    if (value === 'equipe') return 'Equipe responsable'
    return 'Globale (visible pour tous)'
  }

  const formatDateTime = (value?: string) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('fr-FR')
  }

  const assignedAgent = company.agentResponsableId
    ? agents.find((a) => a.id === company.agentResponsableId)
    : undefined
  const assignedEquipe = company.equipeResponsableId
    ? equipes.find((e) => e.id === company.equipeResponsableId)
    : undefined

  const fields = [
    [
      { label: 'Raison Sociale', value: company.raisonSociale },
      { label: 'Matricule Fiscal', value: company.matriculeFiscal },
      { label: 'Pays Matricule', value: company.matriculeFiscalCountry },
      { label: 'Secteur', value: company.secteur },
      { label: 'Devis', value: company.devis || '—' },
      { label: 'Statut', value: company.statut },
    ],
    [
      { label: 'Adresse', value: company.adresse },
      { label: 'Code Postal', value: company.codePostal },
      { label: 'Ville', value: company.ville },
      { label: 'Pays', value: company.pays },
      { label: 'Email', value: company.emailPrincipal },
      { label: 'Email Secondaire', value: company.emailSecondaire },
      { label: 'Téléphone', value: `${company.telephonePrincipalCountry || ''} ${company.telephonePrincipal || ''}`.trim() },
      { label: 'Téléphone Secondaire', value: `${company.telephoneSecondaireCountry || ''} ${company.telephoneSecondaire || ''}`.trim() },
    ],
    [
      { label: 'Type Affectation', value: getAffectationLabel(company.affectationType) },
      { label: 'Agent Responsable', value: assignedAgent ? `${assignedAgent.prenom} ${assignedAgent.nom}` : (company.agentResponsableId ? `ID ${company.agentResponsableId}` : '—') },
      { label: 'Equipe Responsable', value: assignedEquipe ? assignedEquipe.nom : (company.equipeResponsableId ? `ID ${company.equipeResponsableId}` : '—') },
      { label: 'Créé le', value: formatDateTime(company.createdAt) },
      { label: 'Mis à jour le', value: formatDateTime(company.updatedAt) },
    ],
  ]

  const tabs = [
    { key: 'info' as const, label: 'Informations', icon: Building },
    { key: 'contacts' as const, label: `Contacts (${contacts.length})`, icon: Users },
  ]

  return (
    <div onClick={(e) => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${visible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
        }`}>
          {/* Header */}
          <div className="relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E67E22] via-[#D35400] to-[#C0392B]" />
            <div className="relative px-7 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                  <span className="text-white font-bold text-lg">{getInitials(company.raisonSociale)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{company.raisonSociale}</h2>
                  <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${sc.style}`}>
                    {sc.label}
                  </span>
                </div>
              </div>
              <button onClick={close}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all duration-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-7 flex-shrink-0">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-[#E67E22] text-[#E67E22]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6">
            {activeTab === 'info' && (
              <>
                {[
                  { title: 'Informations', data: fields[0] },
                  { title: 'Coordonnées', data: fields[1] },
                  { title: 'Affectation & Suivi', data: fields[2] },
                ].map((section, si) => (
                  <div key={si}>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {section.data.map((f, fi) => (
                        <div key={fi} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                          <p className="text-sm font-medium text-slate-700">{f.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {company.notes && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
                      Notes Internes
                    </h3>
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed">{company.notes}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'contacts' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
                    Contacts ({contacts.length})
                  </h3>
                  <button onClick={() => onAddContact(company)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#E67E22] hover:bg-[#D35400] rounded-lg transition-colors shadow-sm shadow-orange-200">
                    <UserPlus size={13} />
                    Ajouter
                  </button>
                </div>

                {loadingContacts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E67E22]" />
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 mb-3">Aucun contact pour cette société</p>
                    <button onClick={() => onAddContact(company)}
                      className="text-xs font-semibold text-[#E67E22] hover:text-[#D35400] transition-colors">
                      + Ajouter le premier contact
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="group bg-slate-50/80 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-all duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                              {(contact.prenom?.[0] || '') + (contact.nom?.[0] || '')}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{contact.prenom} {contact.nom}</p>
                              <p className="text-[11px] text-slate-400">{contact.poste || 'Pas de poste'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => contact.id && handleDeleteContact(contact.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pl-[52px]">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                              <Mail size={12} />
                              {contact.email}
                            </a>
                          )}
                          {contact.telephone && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone size={12} />
                              {contact.telephoneCountry || ''} {contact.telephone}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
