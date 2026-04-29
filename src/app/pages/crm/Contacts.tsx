import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Eye, Edit2, Trash2, Download, Mail, Phone, Loader2, Building, X, Users } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PaginationControls } from '../../components/ui/pagination-controls'
import { ContactForm } from '../../components/ContactForm'
import { contactApi, type Contact } from '../../lib/contactApi'
import { companyApi, type Company } from '../../lib/companyApi'
import { downloadCsv } from '../../lib/csvExport'

export function Contacts() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      try { return await contactApi.getAll() }
      catch { return [] }
    },
  })

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try { return await companyApi.getAll() }
      catch { return [] }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contactApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })

  const handleDelete = (id: number) => {
    if (confirm('Supprimer ce contact ?')) deleteMutation.mutate(id)
  }

  const handleAddContact = (companyId?: number) => {
    setSelectedCompanyId(companyId || null)
    setShowContactForm(true)
  }

  const handleSubmitContact = async (data: any) => {
    const companyId = selectedCompanyId || (companyFilter !== 'all' ? parseInt(companyFilter) : undefined)
    if (!companyId) return
    await contactApi.create({ ...data, companyId })
    setShowContactForm(false)
    setSelectedCompanyId(null)
    qc.invalidateQueries({ queryKey: ['contacts'] })
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.telephone?.includes(searchTerm) ||
      contact.company?.raisonSociale?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCompany = companyFilter === 'all' || contact.companyId === parseInt(companyFilter)
    return matchesSearch && matchesCompany
  })

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedContacts = filteredContacts.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleExportCsv = () => {
    downloadCsv('contacts', filteredContacts, [
      { header: 'Prenom', value: (contact) => contact.prenom },
      { header: 'Nom', value: (contact) => contact.nom },
      { header: 'Email', value: (contact) => contact.email },
      { header: 'Telephone', value: (contact) => `${contact.telephoneCountry || ''} ${contact.telephone || ''}`.trim() },
      { header: 'Poste', value: (contact) => contact.poste },
      { header: 'Societe', value: (contact) => contact.company?.raisonSociale },
      { header: 'Actif', value: (contact) => contact.isActive ? 'Oui' : 'Non' },
      { header: 'Derniere connexion', value: (contact) => contact.lastLogin ? new Date(contact.lastLogin).toLocaleDateString('fr-FR') : '' },
    ])
  }

  useEffect(() => {
    setPage(1)
  }, [searchTerm, companyFilter, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const getInitials = (prenom: string, nom: string) =>
    `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()

  const selectedCompany = selectedCompanyId
    ? companies.find(c => c.id === selectedCompanyId)
    : companyFilter !== 'all'
      ? companies.find(c => c.id === parseInt(companyFilter))
      : null

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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Contacts</h1>
          <p className="text-sm text-slate-400 mt-1">{contacts.length} contacts enregistrés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-xs rounded-lg border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 gap-1.5" onClick={handleExportCsv}>
            <Download size={14} /> Export CSV
          </Button>
          <Button className="h-9 text-xs bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg shadow-sm shadow-orange-200 gap-1.5"
            onClick={() => handleAddContact()}>
            <Plus size={14} /> Nouveau Contact
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <Input
            type="text"
            placeholder="Rechercher par nom, email, téléphone, société..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus:bg-white focus:border-[#E67E22] focus:ring-[#E67E22]/10 transition-all"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[240px] h-9 text-xs border-slate-200 rounded-lg bg-white">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Société:</span>
              <SelectValue placeholder="Toutes les sociétés" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sociétés</SelectItem>
            {companies.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.raisonSociale}</SelectItem>
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
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Téléphone</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Société</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Poste</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedContacts.map((contact) => (
                <tr key={contact.id} className="group hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0">
                        {getInitials(contact.prenom, contact.nom)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{contact.prenom} {contact.nom}</p>
                        <p className="text-[11px] text-slate-400">{contact.isActive ? 'Actif' : 'Inactif'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                      <Mail size={13} />
                      {contact.email}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {contact.telephone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} />
                        {contact.telephoneCountry || ''} {contact.telephone}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <Building size={13} />
                      {contact.company?.raisonSociale || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{contact.poste || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => setViewingContact(contact)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => contact.id && handleDelete(contact.id)} disabled={deleteMutation.isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150 disabled:opacity-40">
                        {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Aucun contact trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            {filteredContacts.length} sur {contacts.length} contacts
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

      {/* Contact Form Modal */}
      <ContactForm
        open={showContactForm}
        onClose={() => { setShowContactForm(false); setSelectedCompanyId(null); }}
        onSubmit={handleSubmitContact}
        companyName={selectedCompany?.raisonSociale || 'Sélectionner une société'}
      />

      {/* View Contact Modal */}
      {viewingContact && <ContactViewModal contact={viewingContact} onClose={() => setViewingContact(null)} />}
    </div>
  )
}

/* ─── Contact View Modal ─── */
function ContactViewModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, [])
  const close = () => { setVisible(false); setTimeout(onClose, 250); }

  const fields = [
    { label: 'Nom', value: `${contact.prenom} ${contact.nom}` },
    { label: 'Poste', value: contact.poste },
    { label: 'Email', value: contact.email },
    { label: 'Téléphone', value: contact.telephone ? `${contact.telephoneCountry || ''} ${contact.telephone}` : null },
    { label: 'Société', value: contact.company?.raisonSociale },
    { label: 'Login', value: contact.login },
    { label: 'Statut', value: contact.isActive ? 'Actif' : 'Inactif' },
    { label: 'Dernière connexion', value: contact.lastLogin ? new Date(contact.lastLogin).toLocaleDateString('fr-FR') : null },
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
                <span className="text-white font-bold text-sm">
                  {(contact.prenom?.[0] || '') + (contact.nom?.[0] || '')}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{contact.prenom} {contact.nom}</h2>
                <p className="text-blue-100 text-xs">{contact.poste || contact.company?.raisonSociale || ''}</p>
              </div>
            </div>
            <button onClick={close}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all duration-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-7">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-1 h-3.5 rounded-full bg-blue-500" />
            Informations
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
      </div>
    </div>
  )
}
