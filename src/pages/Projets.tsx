import React, { useEffect, useState, useCallback } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { ProjectDetailView } from "./ProjectDetailView"
import { EditProjectView } from "./EditProjectView"
import {
  Search,
  Eye,
  Pencil,
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
  Clock,
  TrendingUp,
  Filter,
  X,
  RefreshCw,
} from "lucide-react"
import { getMesProjetsChef } from "../services/projectService"
import { getTypesProjet, type TypeProjet } from "../services/typeProjetService"

// ================= TYPES =================
type ProjectStatut = 'Planifié' | 'En cours' | 'Terminé' | 'Annulé' | 'En retard'

interface Phase {
  id: string
  typePhase: string
  statut: string
  taches?: {
    id: string
    sousTaches?: {
      id: string
      statut: string
    }[]
  }[]
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
    dateDebut: p.dateDebut?.split("T")[0] || "",
    dateFinPrevue: p.dateFinPrevue?.split("T")[0] || "",
    dateFinReelle: p.dateFinReelle ? p.dateFinReelle.split("T")[0] : undefined,
    budgetEstime: p.budgetEstime || 0,
    budgetReel: p.budgetReel,
    typeProjet: p.typeProjet || "Développement Web",
    statut: mapStatut[p.statut] || "Planifié",
    phases: p.phases || [],
    client: p.client,
    groupeEquipe: p.groupeEquipe
  }
}

// ================= UTILS =================
const calculateProgress = (phases: any[]) => {
  if (!phases || phases.length === 0) return 0

  let totalSousTaches = 0
  let validatedSousTaches = 0

  phases.forEach(phase => {
    ;(phase.taches || []).forEach((tache: any) => {
      ;(tache.sousTaches || []).forEach((st: any) => {
        totalSousTaches++
        const s = (st.statut || '').toLowerCase()
        if (s === 'validee' || s === 'validée') {
          validatedSousTaches++
        }
      })
    })
  })

  if (totalSousTaches === 0) {
    const done = phases.filter(p => {
      const statut = (p.statut || '').toLowerCase()
      return statut === 'terminée' || statut === 'terminee' || statut === 'terminé'
    }).length
    return Math.round((done / phases.length) * 100)
  }

  return Math.round((validatedSousTaches / totalSousTaches) * 100)
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

// Types pour les filtres (maintenant dynamiques)
type FiltreBudget = 'all' | '< 50k' | '50k - 100k' | '100k - 200k' | '> 200k'
type FiltreDate = 'all' | 'ce-mois' | 'ce-trimestre' | 'cette-annee' | 'annee-passee'

export default function ProjectsView() {
  const [projects, setProjects] = useState<Projet[]>([])
  const [typesProjet, setTypesProjet] = useState<TypeProjet[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatut | "All">("All")
  
  // Filtres dynamiques
  const [typeProjetFilter, setTypeProjetFilter] = useState<string>('all')
  const [budgetFilter, setBudgetFilter] = useState<FiltreBudget>('all')
  const [dateFilter, setDateFilter] = useState<FiltreDate>('all')
  
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  // ================= FETCH =================
  const fetchProjects = useCallback(async () => {
    try {
      setRefreshing(true)
      const data = await getMesProjetsChef()
      setProjects(data.map(mapProjectFromApi))
    } catch (e) {
      console.error("Erreur lors du chargement des projets:", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchTypesProjet = useCallback(async () => {
    try {
      setLoadingTypes(true)
      const types = await getTypesProjet()
      setTypesProjet(types)
    } catch (e) {
      console.error("Erreur lors du chargement des types de projet:", e)
    } finally {
      setLoadingTypes(false)
    }
  }, [])

  // ================= RAFRAÎCHISSEMENT AUTOMATIQUE =================
  
  useEffect(() => {
    fetchProjects()
    fetchTypesProjet()
  }, [fetchProjects, fetchTypesProjet])

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      fetchProjects()
      fetchTypesProjet()
    }
  }, [fetchProjects, fetchTypesProjet])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchProjects()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchProjects])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const handleProjectUpdate = () => {
      fetchProjects()
      fetchTypesProjet()
    }
    window.addEventListener('project-updated', handleProjectUpdate)
    window.addEventListener('project-deleted', handleProjectUpdate)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('project-updated', handleProjectUpdate)
      window.removeEventListener('project-deleted', handleProjectUpdate)
    }
  }, [fetchProjects, fetchTypesProjet, handleVisibilityChange])

  useEffect(() => {
    if (!editingProjectId && !selectedProjectId && !loading) {
      fetchProjects()
    }
  }, [editingProjectId, selectedProjectId, loading, fetchProjects])

  // ================= STATS =================
  const active = projects.filter(p => p.statut === 'En cours').length
  const completed = projects.filter(p => p.statut === 'Terminé').length
  const planned = projects.filter(p => p.statut === 'Planifié').length
  const delayed = projects.filter(p => p.statut === 'En retard').length

  // ================= FILTRES AMÉLIORÉS =================
  const filteredProjects = projects.filter(p => {
    // Filtre recherche
    const matchSearch =
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.lieu || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.nom || "").toLowerCase().includes(searchQuery.toLowerCase())

    // Filtre statut
    const matchStatus = statusFilter === "All" || p.statut === statusFilter
    
    // Filtre type de projet (dynamique)
    const matchTypeProjet = typeProjetFilter === 'all' || p.typeProjet === typeProjetFilter
    
    // Filtre budget
    let matchBudget = true
    if (budgetFilter !== 'all') {
      const budget = p.budgetEstime
      switch (budgetFilter) {
        case '< 50k':
          matchBudget = budget < 50000
          break
        case '50k - 100k':
          matchBudget = budget >= 50000 && budget <= 100000
          break
        case '100k - 200k':
          matchBudget = budget >= 100000 && budget <= 200000
          break
        case '> 200k':
          matchBudget = budget > 200000
          break
      }
    }
    
    // Filtre date de début
    let matchDate = true
    if (dateFilter !== 'all') {
      const dateDebut = new Date(p.dateDebut)
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()
      
      switch (dateFilter) {
        case 'ce-mois':
          matchDate = dateDebut.getMonth() === currentMonth && dateDebut.getFullYear() === currentYear
          break
        case 'ce-trimestre':
          const currentQuarter = Math.floor(currentMonth / 3)
          const projectQuarter = Math.floor(dateDebut.getMonth() / 3)
          matchDate = projectQuarter === currentQuarter && dateDebut.getFullYear() === currentYear
          break
        case 'cette-annee':
          matchDate = dateDebut.getFullYear() === currentYear
          break
        case 'annee-passee':
          matchDate = dateDebut.getFullYear() === currentYear - 1
          break
      }
    }
    
    return matchSearch && matchStatus && matchTypeProjet && matchBudget && matchDate
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
    setTypeProjetFilter('all')
    setBudgetFilter('all')
    setDateFilter('all')
    setCurrentPage(1)
  }

  const handleEditSave = useCallback(() => {
    setEditingProjectId(null)
    fetchProjects()
    window.dispatchEvent(new CustomEvent('project-updated'))
  }, [fetchProjects])

  const handleEditCancel = useCallback(() => {
    setEditingProjectId(null)
    fetchProjects()
  }, [fetchProjects])

  // Obtenir le label du type de projet pour l'affichage
  const getTypeProjetLabel = (value: string): string => {
    const type = typesProjet.find(t => t.value === value)
    return type?.label || value
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
    return (
      <EditProjectView 
        projectId={editingProjectId} 
        onBack={handleEditCancel}
        onSave={handleEditSave}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'actualisation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchProjects()
                fetchTypesProjet()
              }}
              disabled={refreshing}
              className="border-gray-200"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Panneau de filtres avancés */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtre Type de projet (DYNAMIQUE) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Type de projet</label>
                <select
                  value={typeProjetFilter}
                  onChange={(e) => {
                    setTypeProjetFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white"
                  disabled={loadingTypes}
                >
                  <option value="all">Tous les types</option>
                  {typesProjet.map(type => (
                    <option key={type.id} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {loadingTypes && (
                  <p className="text-xs text-gray-400 mt-1">Chargement des types...</p>
                )}
              </div>

              {/* Filtre Budget */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Budget (DH)</label>
                <select
                  value={budgetFilter}
                  onChange={(e) => {
                    setBudgetFilter(e.target.value as FiltreBudget)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white"
                >
                  <option value="all">Tous les budgets</option>
                  <option value="< 50k">&lt; 50 000 DH</option>
                  <option value="50k - 100k">50 000 - 100 000 DH</option>
                  <option value="100k - 200k">100 000 - 200 000 DH</option>
                  <option value="> 200k">&gt; 200 000 DH</option>
                </select>
              </div>

              {/* Filtre Date de début */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Date de début</label>
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value as FiltreDate)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="ce-mois">Ce mois-ci</option>
                  <option value="ce-trimestre">Ce trimestre</option>
                  <option value="cette-annee">Cette année</option>
                  <option value="annee-passee">Année passée</option>
                </select>
              </div>
            </div>

            {/* Indicateur de filtres actifs */}
            {(typeProjetFilter !== 'all' || budgetFilter !== 'all' || dateFilter !== 'all') && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Filtres actifs :</span>
                {typeProjetFilter !== 'all' && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Type: {typesProjet.find(t => t.value === typeProjetFilter)?.label || typeProjetFilter}
                  </span>
                )}
                {budgetFilter !== 'all' && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Budget: {budgetFilter}
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Date: {dateFilter === 'ce-mois' ? 'Ce mois' : dateFilter === 'ce-trimestre' ? 'Ce trimestre' : dateFilter === 'cette-annee' ? 'Cette année' : 'Année passée'}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
          <span>{filteredProjects.length} projet(s) trouvé(s)</span>
          {(searchQuery || statusFilter !== "All" || typeProjetFilter !== 'all' || budgetFilter !== 'all' || dateFilter !== 'all') && (
            <button onClick={resetFilters} className="text-[#ef7c21] hover:underline flex items-center gap-1">
              <X className="h-3 w-3" />
              Réinitialiser tous les filtres
            </button>
          )}
        </div>
      </Card>

      {/* Vue Grille */}
      {viewMode === "grid" && (
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
                    <div className="text-xs text-gray-500">
                      {getTypeProjetLabel(project.typeProjet)}
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
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
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
                  <th className="px-4 py-3 text-left">Type</th>
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
                      </td>                      <td className="px-4 py-3 text-gray-600">{project.client?.nom || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{project.lieu || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {getTypeProjetLabel(project.typeProjet)}
                        </span>
                      </td>
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
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
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
                      ? 'bg-[#ef7c21] text-white hover:bg-[#d95f0c]'
                      : 'border-gray-200 hover:border-[#ef7c21] hover:text-[#ef7c21]'
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