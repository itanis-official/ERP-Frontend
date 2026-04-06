import React, { useEffect, useState } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { ProjectDetailView } from "./ProjectDetailView"
import { EditProjectView } from "./EditProjectView"
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  FolderOpen,
  Activity,
  CheckCircle,
  AlertCircle,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MapPin,
  Layers,
  Clock,
  TrendingUp,
  Filter,
  X,
} from "lucide-react"
import { getMesProjetsChef } from "../services/projectService"

// ================= TYPES =================
type ProjectStatut = 'Planifié' | 'En cours' | 'Terminé' | 'Annulé' | 'En retard'

interface Phase {
  id: string
  typePhase: string
  statut: string
}

interface Projet {
  id: string
  nom: string
  description: string
  lieu?: string
  dateDebut: string
  dateFinPrevue: string
  dateFinReelle?: string
  budgetEstime: number
  budgetReel?: number
  typeProjet: string
  statut: ProjectStatut
  phases: Phase[]
  client?: {
    id: number
    nom: string
  }

  // ✅ AJOUT ICI
  groupeEquipe?: {
    id: number
    nom: string
    employes: {
      id: number
      nomComplet: string
      role?: string
      email?: string
    }[]
  }
}

// ================= MAPPING =================
const mapProjectFromApi = (p: any): Projet => {
  const mapStatut: any = {
    Planifie: "Planifié",
    EnCours: "En cours",
    Termine: "Terminé",
    Annule: "Annulé",
    EnRetard: "En retard",
  }

  return {
    id: p.id.toString(),
    nom: p.nom,
    description: p.description,
    lieu: p.lieu,
    dateDebut: p.dateDebut.split("T")[0],
    dateFinPrevue: p.dateFinPrevue.split("T")[0],
    dateFinReelle: p.dateFinReelle ? p.dateFinReelle.split("T")[0] : undefined,
    budgetEstime: p.budgetEstime,
    budgetReel: p.budgetReel,
    typeProjet: p.typeProjet,
    statut: mapStatut[p.statut] || "Planifié",
    phases: p.phases || [],
    client: p.client,
    groupeEquipe: p.groupeEquipe // ✅ AJOUT IMPORTANT
  }
}

// ================= UTILS =================
const calculateProgress = (phases: Phase[]) => {
  if (!phases || phases.length === 0) return 0

  const done = phases.filter(p => {
    const statut = p.statut.toLowerCase()
    return statut === "terminée" || statut === "terminee" || statut === "terminé"
  }).length

  return Math.round((done / phases.length) * 100)
}

const getStatusVariant = (s: ProjectStatut) => {
  switch (s) {
    case 'Terminé': return 'success'
    case 'Annulé': return 'danger'
    case 'Planifié': return 'warning'
    case 'En retard': return 'danger'
    default: return 'default'
  }
}

const getStatusColor = (s: ProjectStatut) => {
  switch (s) {
    case 'Terminé':
      return 'bg-green-500/10 text-green-600 border-green-200'
    case 'Annulé':
      return 'bg-red-500/10 text-red-600 border-red-200'
    case 'Planifié':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
    case 'En retard':
      return 'bg-red-500/10 text-red-600 border-red-200'
    default:
      return 'bg-[#ef7c21]/10 text-[#ef7c21] border-[#ef7c21]/20'
  }
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 70) return 'bg-[#ef7c21]'
  if (progress >= 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function ProjectsView() {
  const [projects, setProjects] = useState<Projet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatut | "All">("All")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
 const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  // ================= FETCH =================
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getMesProjetsChef()
        setProjects(data.map(mapProjectFromApi))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // ================= STATS =================
  const active = projects.filter(p => p.statut === 'En cours').length
  const completed = projects.filter(p => p.statut === 'Terminé').length
  const planned = projects.filter(p => p.statut === 'Planifié').length
  const delayed = projects.filter(p => p.statut === 'En retard').length

  // ================= FILTER =================
  const filteredProjects = projects.filter(p => {
    const matchSearch =
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.lieu || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.nom || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchStatus = statusFilter === "All" || p.statut === statusFilter
    return matchSearch && matchStatus
  })

  // ================= SORT =================
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortField) return 0

    let aVal: any = a[sortField as keyof Projet]
    let bVal: any = b[sortField as keyof Projet]

    if (sortField === "progress") {
      aVal = calculateProgress(a.phases)
      bVal = calculateProgress(b.phases)
    }

    if (sortField === "budget") {
      aVal = a.budgetEstime
      bVal = b.budgetEstime
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  // ================= PAGINATION =================
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const paginated = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("All")
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ef7c21]/20 border-t-[#ef7c21] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  if (selectedProjectId) {
    return <ProjectDetailView projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
  }

 if (editingProjectId) {
  return <EditProjectView projectId={editingProjectId} onBack={() => setEditingProjectId(null)} />
}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez et suivez tous vos projets 
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'En cours', value: active, icon: Activity, color: 'from-blue-500/20 to-blue-500/5', textColor: 'text-blue-600' },
          { label: 'Terminés', value: completed, icon: CheckCircle, color: 'from-green-500/20 to-green-500/5', textColor: 'text-green-600' },
          { label: 'Planifiés', value: planned, icon: Calendar, color: 'from-yellow-500/20 to-yellow-500/5', textColor: 'text-yellow-600' },
          { label: 'En retard', value: delayed, icon: AlertCircle, color: 'from-red-500/20 to-red-500/5', textColor: 'text-red-600' },
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden p-4 bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</p>
              </div>
              <div className={`h-10 w-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="p-4 bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, description, client ou lieu..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]/40 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ProjectStatut | 'All')
                setCurrentPage(1)
              }}
            >
              <option value="All">Tous les statuts</option>
              <option value="Planifié">Planifié</option>
              <option value="En cours">En cours</option>
              <option value="En retard">En retard</option>
              <option value="Terminé">Terminé</option>
              <option value="Annulé">Annulé</option>
            </select>

            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#ef7c21]' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vue grille"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#ef7c21]' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vue tableau"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-200"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Type de projet</option>
                <option>Développement Web</option>
                <option>Mobile</option>
                <option>Infrastructure</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Budget</option>
                <option>&lt; 50k MAD</option>
                <option>50k - 100k MAD</option>
                <option>&gt; 100k MAD</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Date de début</option>
                <option>Ce mois</option>
                <option>Ce trimestre</option>
                <option>Cette année</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          {filteredProjects.length} projet(s) trouvé(s)
          {searchQuery && (
            <button onClick={resetFilters} className="ml-2 text-[#ef7c21] hover:underline">
              <X className="h-3 w-3 inline mr-1" />
              Réinitialiser
            </button>
          )}
        </div>
      </Card>

      {/* Vue Grille */}
      {viewMode === "grid" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map(project => {
              const progress = calculateProgress(project.phases)
              return (
                <Card
                  key={project.id}
                  className="group relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ef7c21] to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#ef7c21] transition-colors">
                        {project.nom}
                      </h3>
                      <Badge
                        variant={getStatusVariant(project.statut)}
                        className={`shrink-0 ml-2 ${getStatusColor(project.statut)} rounded-full px-2 py-0.5 text-xs font-medium`}
                      >
                        {project.statut}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[40px]">
                      {project.description}
                    </p>

                    {project.client && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                        <span className="font-medium">Client:</span>
                        <span>{project.client.nom}</span>
                      </div>
                    )}

                    {project.lieu && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-[#ef7c21]" />
                        <span>{project.lieu}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium">{project.budgetEstime.toLocaleString()} MAD</span>
                      </div>
                     
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Progression</span>
                        <span className="font-semibold text-gray-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#ef7c21]" />
                        <span>{project.dateDebut}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#ef7c21]" />
                        <span>{project.dateFinPrevue}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        className="flex-1 bg-gray-50 hover:bg-[#ef7c21] hover:text-white text-gray-700 border-gray-200 transition-all duration-300"
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Détails
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-gray-400 hover:text-[#ef7c21] hover:bg-[#ef7c21]/5"
                        onClick={() => setEditingProjectId(project.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Vue Tableau */}
      {viewMode === "table" && (
        <Card className="overflow-hidden bg-white/90 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort("nom")} className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-[#ef7c21]">
                      Projet <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort("statut")} className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-[#ef7c21]">
                      Statut <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Lieu</th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort("budget")} className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-[#ef7c21]">
                      Budget <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => handleSort("progress")} className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-[#ef7c21]">
                      Progression <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(project => {
                  const progress = calculateProgress(project.phases)
                  return (
                    <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{project.nom}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{project.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(project.statut)} className={`${getStatusColor(project.statut)} rounded-full px-2 py-0.5 text-xs`}>
                          {project.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{project.client?.nom || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{project.lieu || "-"}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{project.budgetEstime.toLocaleString()} MAD</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-medium w-10 text-center">{progress}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full ${getProgressColor(progress)}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="p-1.5 text-gray-400 hover:text-[#ef7c21]" onClick={() => setSelectedProjectId(project.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1.5 text-gray-400 hover:text-[#ef7c21]" onClick={() => setEditingProjectId(project.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1.5 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Affichage {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredProjects.length)} sur {filteredProjects.length} projets
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 par page</option>
              <option value={9}>9 par page</option>
              <option value={12}>12 par page</option>
              <option value={24}>24 par page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="border-gray-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i
                if (pageNum > totalPages) return null
              }
              return (
                <Button
                  key={i}
                  variant={currentPage === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }
                >
                  {pageNum}
                </Button>
              )
            }).filter(Boolean)}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="border-gray-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message si aucun projet */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16 bg-white/50 rounded-xl">
          <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun projet trouvé</h3>
          <p className="text-sm text-gray-500 mb-6">
            Aucun projet ne correspond à vos critères de recherche.
          </p>
          <Button
            onClick={resetFilters}
            variant="outline"
            className="border-[#ef7c21] text-[#ef7c21] hover:bg-[#ef7c21] hover:text-white transition-all"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  )
}