import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Edit2, Trash2, Download, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PaginationControls } from '../../components/ui/pagination-controls'
import { CollaboratorForm } from '../../components/CollaboratorForm'
import { contractorsApi, type CollaborateurExterne } from '../../lib/contractorsApi'
import { downloadCsv } from '../../lib/csvExport'
import { useModuleSelectOptions } from '../../lib/selectOptionsConfig'

export function Contractors() {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showContractorForm, setShowContractorForm] = useState(false)
  const [editingContractor, setEditingContractor] = useState<CollaborateurExterne | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: contractors = [], isLoading } = useQuery<CollaborateurExterne[]>({
    queryKey: ['contractors'],
    queryFn: async () => {
      try { return await contractorsApi.getAll() }
      catch { return [] }
    },
  })

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  }

  const filteredContractors = contractors.filter((c) => {
    const matchesSearch = !searchQuery || 
      `${c.nom} ${c.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.poste?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.societeOrigine?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredContractors.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedContractors = filteredContractors.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleExportCsv = () => {
    downloadCsv('sous-traitants', filteredContractors, [
      { header: 'Matricule', value: (contractor) => contractor.matricule },
      { header: 'Prenom', value: (contractor) => contractor.prenom },
      { header: 'Nom', value: (contractor) => contractor.nom },
      { header: 'Email', value: (contractor) => contractor.email },
      { header: 'Telephone', value: (contractor) => contractor.telephone },
      { header: 'Poste', value: (contractor) => contractor.poste },
      { header: 'Societe origine', value: (contractor) => contractor.societeOrigine },
      { header: 'Mission', value: (contractor) => contractor.mission },
      { header: 'Taux journalier', value: (contractor) => contractor.tauxJournalier },
      { header: 'Devise', value: (contractor) => contractor.devise },
      { header: 'Date fin mission', value: (contractor) => contractor.dateFinMission },
      { header: 'Statut', value: (contractor) => contractor.statut },
    ])
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleEditContractor = (contractor: CollaborateurExterne) => {
    setEditingContractor(contractor)
    setShowContractorForm(true)
  }

  const handleViewContractor = (id: number) => {
    navigate(`/rh/contractors/${id}`)
  }

  const handleDeleteContractor = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sous-traitant ?')) return
    
    setDeletingId(id)
    try {
      await contractorsApi.delete(id)
      qc.invalidateQueries({ queryKey: ['contractors'] })
    } catch (error) {
      alert('Erreur: Impossible de supprimer ce sous-traitant')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitContractor = (data: any) => {
    setShowContractorForm(false)
    setEditingContractor(null)
    qc.invalidateQueries({ queryKey: ['contractors'] })
  }

  const handleCloseForm = () => {
    setShowContractorForm(false)
    setEditingContractor(null)
  }

  if (isLoading) return <div className="text-center py-4">Chargement...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Gestion des Sous-traitants</h1>
        <p className="text-gray-600">Accueil &gt; Sous-traitants</p>
      </div>

      {/* Toolbar */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Rechercher par nom, spécialité, société..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[180px] rounded-md border-[#DDD5CD] bg-white text-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7D746C]">Statut:</span>
                  <SelectValue placeholder="Tous" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {(rhSelectOptions.employeeStatuses || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white" onClick={() => setShowContractorForm(true)}>
              <Plus size={18} className="mr-2" />
              Nouveau Sous-traitant
            </Button>

            <Button variant="outline" className="h-9 border-[#DDD5CD] bg-white text-[13px] text-[#5E5650] hover:bg-[#F5F4F2]" onClick={handleExportCsv}>
              <Download size={18} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sous-traitant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Spécialité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Société</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedContractors.map((contractor) => (
                <tr key={contractor.id} className="hover:bg-[#FFF5EC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFF5EC] rounded-full flex items-center justify-center text-[#E67E22] font-medium text-sm flex-shrink-0">
                        {getInitials(contractor.nom, contractor.prenom)}
                      </div>
                      <span className="font-medium text-gray-900">{contractor.prenom} {contractor.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{contractor.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{contractor.poste || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-[#FFF5EC] text-[#E67E22]">
                      {contractor.societeOrigine || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={contractor.statut === 'actif'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }
                    >
                      {contractor.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:text-[#E67E22] hover:bg-[#FFF5EC]"
                        onClick={() => handleViewContractor(contractor.id!)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:text-[#E67E22] hover:bg-[#FFF5EC]"
                        onClick={() => handleEditContractor(contractor)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteContractor(contractor.id!)}
                        disabled={deletingId === contractor.id}
                      >
                        {deletingId === contractor.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-sm text-gray-600">
            Affichage de {filteredContractors.length} sous-traitants sur {contractors.length}
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

      {/* Contractor Form Modal */}
      {showContractorForm && (
        <CollaboratorForm
          open={showContractorForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmitContractor}
          initialData={editingContractor || undefined}
        />
      )}
    </div>
  )
}
