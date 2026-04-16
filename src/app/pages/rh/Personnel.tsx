import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Edit2, Eye, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PaginationControls } from '../../components/ui/pagination-controls'
import { EmployeeFormMultiStep } from '../../components/EmployeeFormMultiStep'
import { personnelApi, type CollaborateurInterne } from '../../lib/personnelApi'
import { downloadCsv } from '../../lib/csvExport'
import { useModuleSelectOptions } from '../../lib/selectOptionsConfig'

const avatarPalette = ['#4E79A7', '#59A14F', '#9C755F', '#AF7AA1', '#76B7B2', '#EDC948', '#E07B2A', '#7E8AA2']

const hashNameToColor = (fullName: string) => {
  const hash = Array.from(fullName).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return avatarPalette[hash % avatarPalette.length]
}

export function Personnel() {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<CollaborateurInterne | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<{ login: string; password: string; role: string } | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: employees = [], isLoading } = useQuery<CollaborateurInterne[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        return await personnelApi.getAll()
      } catch {
        return []
      }
    },
  })

  const getInitials = (nom: string, prenom: string) => `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      !searchQuery ||
      `${employee.nom} ${employee.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.poste?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.matricule?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment = departmentFilter === 'all' || employee.departement === departmentFilter
    const matchesStatus = statusFilter === 'all' || employee.statut === statusFilter
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedEmployees = filteredEmployees.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleExportCsv = () => {
    downloadCsv('personnel', filteredEmployees, [
      { header: 'Matricule', value: (employee) => employee.matricule },
      { header: 'Prenom', value: (employee) => employee.prenom },
      { header: 'Nom', value: (employee) => employee.nom },
      { header: 'Email', value: (employee) => employee.email },
      { header: 'Telephone', value: (employee) => employee.telephone },
      { header: 'Poste', value: (employee) => employee.poste },
      { header: 'Departement', value: (employee) => employee.departement },
      { header: 'Type employe', value: (employee) => employee.typeEmploye },
      { header: 'Date embauche', value: (employee) => employee.dateEmbauche },
      { header: 'Statut', value: (employee) => employee.statut },
    ])
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery, departmentFilter, statusFilter, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleEditEmployee = async (employee: CollaborateurInterne) => {
    try {
      const fullEmployee = await personnelApi.getById(employee.id!)
      setEditingEmployee(fullEmployee)
    } catch {
      setEditingEmployee(employee)
    }
    setShowEmployeeForm(true)
  }

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Etes-vous sur de vouloir supprimer cet employe ?')) return

    setDeletingId(id)
    try {
      await personnelApi.delete(id)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitEmployee = (data: any) => {
    if (data?.credentials) {
      setNewEmployeeCredentials(data.credentials)
    }
    setShowEmployeeForm(false)
    setEditingEmployee(null)
    queryClient.invalidateQueries({ queryKey: ['employees'] })
  }

  if (isLoading) return <div className="py-6 text-center text-[14px] text-[#857B72]">Chargement...</div>

  return (
    <div className="space-y-6">
      {newEmployeeCredentials && (
        <Card className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-green-900">Identifiants du nouvel employe</p>
              <p className="mt-1 text-[12px] text-green-800">Login: {newEmployeeCredentials.login}</p>
              <p className="text-[12px] text-green-800">Mot de passe temporaire: {newEmployeeCredentials.password}</p>
              <p className="text-[12px] text-green-800">Role: {newEmployeeCredentials.role}</p>
            </div>
            <Button variant="outline" onClick={() => setNewEmployeeCredentials(null)} className="h-9 border-green-300 text-green-900 hover:bg-green-100">
              Fermer
            </Button>
          </div>
        </Card>
      )}

      <header>
        <h1 className="itanis-page-title">Gestion du personnel</h1>
        <p className="mt-1 text-[14px] text-[#857B72]">Annuaire des collaborateurs internes.</p>
      </header>

      <Card className="rounded-xl border border-[#E8E1DA] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9087]" size={16} strokeWidth={1.5} />
            <Input
              type="text"
              placeholder="Rechercher par nom, poste, matricule..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 rounded-md border-[#DDD5CD] pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-9 w-[220px] rounded-md border-[#DDD5CD] bg-white text-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7D746C]">Département:</span>
                  <SelectValue placeholder="Tous" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {(rhSelectOptions.departments || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Button variant="outline" className="h-9 border-[#DDD5CD] bg-white text-[13px] text-[#5E5650] hover:bg-[#F5F4F2]" onClick={handleExportCsv}>
              <Download size={16} className="mr-1.5" />
              Export CSV
            </Button>

            <Button
              className="h-9 bg-[#E07B2A] px-4 text-[13px] font-medium text-white hover:bg-[#C7661B]"
              onClick={() => setShowEmployeeForm(true)}
            >
              <Plus size={16} className="mr-1.5" />
              Nouvel employe
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-xl border border-[#E8E1DA] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#ECE4DC] bg-[#FCFAF8]">
              <tr>
                <th className="px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-[#8B837B]">Employe</th>
                <th className="px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-[#8B837B]">Matricule</th>
                <th className="px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-[#8B837B]">Poste</th>
                <th className="px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-[#8B837B]">Departement</th>
                <th className="px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-[#8B837B]">Statut</th>
                <th className="px-6 py-3 text-right text-[12px] font-medium uppercase tracking-wider text-[#8B837B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8E1]">
              {paginatedEmployees.map((employee) => {
                const fullName = `${employee.prenom || ''} ${employee.nom || ''}`.trim()
                return (
                  <tr key={employee.id} className="group transition-colors hover:bg-[#F5F4F2]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-medium text-white"
                          style={{ backgroundColor: hashNameToColor(fullName) }}
                        >
                          {getInitials(employee.nom, employee.prenom)}
                        </div>
                        <span className="text-[14px] font-medium text-[#2F2A26]">{fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[14px] text-[#6B625B]">{employee.matricule || '-'}</td>
                    <td className="px-6 py-3.5 text-[14px] text-[#4A433E]">{employee.poste || '-'}</td>
                    <td className="px-6 py-3.5 text-[14px] text-[#6B625B]">{employee.departement || '-'}</td>
                    <td className="px-6 py-3.5">
                      <Badge
                        className={
                          employee.statut === 'actif'
                            ? 'h-6 rounded-full border border-green-200 bg-green-100 px-2 text-[11px] font-medium text-green-800 hover:bg-green-100'
                            : 'h-6 rounded-full border border-slate-200 bg-slate-100 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100'
                        }
                      >
                        {employee.statut === 'actif' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#8B837B] hover:bg-[#EFE8DF] hover:text-[#4A433E]" onClick={() => navigate(`/rh/personnel/${employee.id}`)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#8B837B] hover:bg-[#EFE8DF] hover:text-[#4A433E]" onClick={() => handleEditEmployee(employee)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#8B837B] hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteEmployee(employee.id!)}
                          disabled={deletingId === employee.id}
                        >
                          {deletingId === employee.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#EFE8E1] px-6 py-3 text-[13px] text-[#857B72]">
          <div className="flex items-center justify-between gap-3">
            <span>Affichage de {filteredEmployees.length} employes sur {employees.length}</span>
            <PaginationControls
              page={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </Card>

      {showEmployeeForm && (
        <EmployeeFormMultiStep
          open={showEmployeeForm}
          onClose={() => {
            setShowEmployeeForm(false)
            setEditingEmployee(null)
          }}
          onSubmit={handleSubmitEmployee}
          initialData={editingEmployee || undefined}
          mode={editingEmployee ? 'edit' : 'create'}
        />
      )}
    </div>
  )
}
