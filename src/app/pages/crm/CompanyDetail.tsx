import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit2, MapPin, Phone, Users, FileText, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { PaginationControls } from '../../components/ui/pagination-controls'
import { companyApi } from '../../lib/companyApi'
import { contactApi } from '../../lib/contactApi'
import { opportunityApi } from '../../lib/opportunityApi'
import { contractApi } from '../../lib/contractApi'
import { crmApi } from '../../lib/api'

interface AgentLite {
  id: number
  nom: string
  prenom: string
}

interface EquipeLite {
  id: number
  nom: string
}

export function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [oppPage, setOppPage] = useState(1)
  const [oppPageSize, setOppPageSize] = useState(10)
  const companyId = Number(id)

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyApi.getById(companyId),
    enabled: !!companyId,
  })

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-company', companyId],
    queryFn: () => contactApi.getByCompany(companyId),
    enabled: !!companyId,
  })

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities-company', companyId],
    queryFn: () => opportunityApi.getByCompany(companyId),
    enabled: !!companyId,
  })

  const oppTotalPages = Math.max(1, Math.ceil(opportunities.length / oppPageSize))
  const safeOppPage = Math.min(oppPage, oppTotalPages)
  const paginatedOpportunities = opportunities.slice((safeOppPage - 1) * oppPageSize, safeOppPage * oppPageSize)

  useEffect(() => {
    setOppPage(1)
  }, [oppPageSize, opportunities.length])

  useEffect(() => {
    if (oppPage > oppTotalPages) setOppPage(oppTotalPages)
  }, [oppPage, oppTotalPages])

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-company', companyId],
    queryFn: () => contractApi.getByCompany(companyId),
    enabled: !!companyId,
  })

  const { data: agents = [] } = useQuery<AgentLite[]>({
    queryKey: ['crm-agents-list-detail'],
    queryFn: async () => {
      const response = await crmApi.get('/api/Agents')
      return response.data
    },
    enabled: !!companyId,
  })

  const { data: equipes = [] } = useQuery<EquipeLite[]>({
    queryKey: ['crm-equipes-list-detail'],
    queryFn: async () => {
      const response = await crmApi.get('/api/Equipes')
      return response.data
    },
    enabled: !!companyId,
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'client': 'bg-green-100 text-green-700',
      'prospect': 'bg-yellow-100 text-yellow-700',
      'inactif': 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      prospection: 'Prospection',
      qualification: 'Qualification',
      negociation: 'Négociation',
      gagnee: 'Gagnée',
      perdue: 'Perdue',
    }
    return labels[stage] || stage
  }

  const getAffectationLabel = (type?: string | null) => {
    const value = (type || 'global').toLowerCase()
    if (value === 'agent') return 'Agent responsable'
    if (value === 'equipe') return 'Equipe responsable'
    return 'Globale (visible pour tous)'
  }

  const formatDateTime = (value?: string) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('fr-FR')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E67E22]" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Société introuvable.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Retour</Button>
      </div>
    )
  }

  const totalContractAmount = contracts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const assignedAgent = company.agentResponsableId
    ? agents.find((a) => a.id === company.agentResponsableId)
    : undefined
  const assignedEquipe = company.equipeResponsableId
    ? equipes.find((e) => e.id === company.equipeResponsableId)
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">
              {company.raisonSociale}
            </h1>
            <p className="text-gray-600">{company.secteur}</p>
          </div>
        </div>
        <Button
          className="bg-[#E67E22] hover:bg-[#D66F1C] text-white flex items-center gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit2 size={18} />
          {isEditing ? 'Annuler' : 'Modifier'}
        </Button>
      </div>

      {/* Status & KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <Badge className={getStatusColor(company.statut || 'prospect')}>
            {company.statut || 'prospect'}
          </Badge>
          <p className="text-sm text-gray-600 mt-2">Statut</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-2xl font-bold text-[#E67E22]">{totalContractAmount.toLocaleString('fr-FR')} €</p>
          <p className="text-sm text-gray-600 mt-2">Total Contrats</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
          <p className="text-sm text-gray-600 mt-2">Contacts</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-2xl font-bold text-blue-600">{opportunities.length}</p>
          <p className="text-sm text-gray-600 mt-2">Opportunités</p>
        </Card>
      </div>

      {/* Company Info + Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations détaillées</h3>
          <div className="space-y-4">
            {company.logo && (
              <div>
                <label className="text-sm text-gray-600 font-medium">Logo</label>
                <img src={company.logo} alt="Logo société" className="mt-2 h-14 w-14 rounded-lg object-cover border" />
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600 font-medium">Raison sociale</label>
              <p className="text-gray-900 mt-1">{company.raisonSociale || '-'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Secteur</label>
              <p className="text-gray-900 mt-1">{company.secteur || '-'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Statut</label>
              <p className="text-gray-900 mt-1">{company.statut || '-'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Devis</label>
              <p className="text-gray-900 mt-1">{company.devis || '-'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Adresse complète</label>
              <p className="text-gray-900 flex items-center gap-2 mt-1">
                <MapPin size={16} />
                {[company.adresse, company.codePostal, company.ville, company.pays].filter(Boolean).join(', ') || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Matricule fiscal</label>
              <p className="text-gray-900 mt-1">
                {[company.matriculeFiscalCountry, company.matriculeFiscal].filter(Boolean).join(' - ') || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Téléphone principal</label>
              {company.telephonePrincipal ? (
                <a href={`tel:${company.telephonePrincipal}`} className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                  <Phone size={16} />
                  {company.telephonePrincipalCountry} {company.telephonePrincipal}
                </a>
              ) : <p className="text-gray-400 mt-1">-</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Téléphone secondaire</label>
              <p className="text-gray-900 mt-1">
                {company.telephoneSecondaire
                  ? `${company.telephoneSecondaireCountry || ''} ${company.telephoneSecondaire}`.trim()
                  : '-'}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Email principal</label>
              {company.emailPrincipal ? (
                <a href={`mailto:${company.emailPrincipal}`} className="text-blue-600 hover:underline mt-1 block">
                  {company.emailPrincipal}
                </a>
              ) : <p className="text-gray-400 mt-1">-</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Email secondaire</label>
              {company.emailSecondaire ? (
                <a href={`mailto:${company.emailSecondaire}`} className="text-blue-600 hover:underline mt-1 block">
                  {company.emailSecondaire}
                </a>
              ) : <p className="text-gray-400 mt-1">-</p>}
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Type d'affectation</label>
              <p className="text-gray-900 mt-1">{getAffectationLabel(company.affectationType)}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Agent responsable</label>
              <p className="text-gray-900 mt-1">
                {assignedAgent
                  ? `${assignedAgent.prenom} ${assignedAgent.nom}`
                  : (company.agentResponsableId ? `ID ${company.agentResponsableId}` : '-')}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Equipe responsable</label>
              <p className="text-gray-900 mt-1">
                {assignedEquipe
                  ? assignedEquipe.nom
                  : (company.equipeResponsableId ? `ID ${company.equipeResponsableId}` : '-')}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Notes</label>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{company.notes || '-'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Créé le</label>
              <p className="text-gray-900 mt-1">{formatDateTime(company.createdAt)}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Mis à jour le</label>
              <p className="text-gray-900 mt-1">{formatDateTime(company.updatedAt)}</p>
            </div>
          </div>
        </Card>

        {/* Contacts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} />
            Contacts ({contacts.length})
          </h3>
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun contact</p>
            ) : contacts.map((contact) => (
              <div key={contact.id} className="p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition">
                <p className="font-medium text-gray-900">{contact.prenom} {contact.nom}</p>
                <p className="text-xs text-gray-600">{contact.poste || '-'}</p>
                <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline">
                  {contact.email}
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Contracts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Contrats ({contracts.length})
          </h3>
          <div className="space-y-3">
            {contracts.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun contrat</p>
            ) : contracts.map((contract) => (
              <div key={contract.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900">{contract.reference}</p>
                  <Badge className={contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {contract.status}
                  </Badge>
                </div>
                <p className="text-sm text-[#E67E22] font-medium mt-1">{(contract.amount || 0).toLocaleString('fr-FR')} €</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Opportunities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunités</h3>
        {opportunities.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune opportunité</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Titre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Valeur</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Étape</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Probabilité</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{opp.titre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{opp.typeProjet || '-'}</td>
                    <td className="px-6 py-4 font-medium text-[#E67E22]">{(opp.valeurEstimee || 0).toLocaleString('fr-FR')} €</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-blue-100 text-blue-700">{getStageLabel(opp.pipelineStage)}</Badge>
                    </td>
                    <td className="px-6 py-4 font-medium">{opp.probabilite}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100">
              <PaginationControls
                page={safeOppPage}
                totalPages={oppTotalPages}
                pageSize={oppPageSize}
                onPageChange={setOppPage}
                onPageSizeChange={setOppPageSize}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
