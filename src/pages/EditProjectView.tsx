import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { getLoads, getOverloaded, getSuggestions} from '../services/loadBalancingService'
import {
  ArrowLeft,
  Save,
  Plus,
  User,
  Calendar,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Search,
  Trash2,
  MapPin,
  Briefcase,
  Code,
  Smartphone,
  PenTool,
  CheckCircle,
  AlertCircle,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  Star,
  RefreshCw,
} from 'lucide-react'
import { getProjetById, updateProjet, addProjectMembers, removeProjectMember, getAvailableMembers } from '../services/projectService'

type ProjectStatut = 'Planifié' | 'En cours' | 'Terminé' | 'Annulé'

type TypePhase = 'Analyse' | 'Conception' | 'MiseEnOeuvre' | 'Validation' | 'MiseEnService'
interface SousTache {
  id: string
  titre: string
  dureeEstimeeHeures: number
  statut: string
}

interface Tache {
  id: string
  titre: string
  dateDebutPrevue: string
  dateFinPrevue: string
  statut: string
  responsableId?: number
  testeurId?: number
  sousTaches: SousTache[]
}

interface Phase {
  id: string
  typePhase: TypePhase
  pourcentageBudget: number
  statut: string
  taches: Tache[]
}

interface TeamMember {
  id: number
  nomComplet: string
  role: string
  email: string
  phone?: string
  specialites?: string[]
  dateArrivee?: string
  statut?: 'actif' | 'inactif'
}

interface EditProjectViewProps {
  project?: any
  projectId?: string
  onBack: () => void
  onSave?: (updatedProject: any) => void
  onDelete?: (projectId: string) => void
}

const PROJECT_TYPES = [
  { id: 'mobile', name: 'Développement Mobile', icon: Smartphone },
  { id: 'web', name: 'Développement Web', icon: Code },
  { id: 'design', name: 'Design UI/UX', icon: PenTool },
  { id: 'consulting', name: 'Consulting', icon: Briefcase },
]
const PHASE_TYPES: TypePhase[] = ['Analyse', 'Conception', 'MiseEnOeuvre', 'Validation', 'MiseEnService']

export function EditProjectView({ project: propProject, projectId, onBack, onSave, onDelete }: EditProjectViewProps) {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showTeamSelector, setShowTeamSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'phases'>('details')
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [addingMembers, setAddingMembers] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)
  const [loads, setLoads] = useState<any[]>([])
  const [overloaded, setOverloaded] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    clientId: '',
    lieu: '',
    dateDebut: '',
    dateFinPrevue: '',
    budgetEstime: '',
    budgetReel: '',
    typeProjet: 'Développement Web',
    statut: 'Planifié' as ProjectStatut,
  })

  const [phases, setPhases] = useState<Phase[]>([])
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // ==================== FONCTIONS DE VÉRIFICATION INTELLIGENTE ====================
  
  /**
   * Vérifie si un employé a un conflit de dates avec une autre tâche
   * @param memberId - ID de l'employé
   * @param start - Date de début de la nouvelle tâche
   * @param end - Date de fin de la nouvelle tâche
   * @param excludeTaskId - ID de la tâche à exclure (pour l'édition)
   * @returns true s'il y a un conflit
   */
const hasDateConflict = (
  memberId?: number,
  start?: string,
  end?: string,
  excludeTaskId?: string
): boolean => {
  if (!memberId || !start || !end) return false

  const startDate = new Date(start)
  const endDate = new Date(end)

  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {
    const load = getDailyLoad(memberId, d, excludeTaskId)

    if (load >= 7) {
      return true // ❌ journée saturée
    }
  }

  return false // ✅ dispo
}

  /**
   * Vérifie tous les conflits de dates dans le projet avant soumission
   */
  const validateAllDateConflicts = (): boolean => {
    for (const phase of phases) {
      for (const task of phase.taches) {
        // Vérifier le responsable
        if (task.responsableId) {
          const hasResponsableConflict = hasDateConflict(
            task.responsableId,
            task.dateDebutPrevue,
            task.dateFinPrevue,
            task.id
          )
          if (hasResponsableConflict) {
            alert(`⛔ Conflit de dates pour le responsable "${getMemberName(task.responsableId)}" sur la tâche "${task.titre}" (${task.dateDebutPrevue} → ${task.dateFinPrevue})`)
            return false
          }
        }
        
        // Vérifier le testeur
        if (task.testeurId) {
          const hasTesteurConflict = hasDateConflict(
            task.testeurId,
            task.dateDebutPrevue,
            task.dateFinPrevue,
            task.id
          )
          if (hasTesteurConflict) {
            alert(`⛔ Conflit de dates pour le testeur "${getMemberName(task.testeurId)}" sur la tâche "${task.titre}" (${task.dateDebutPrevue} → ${task.dateFinPrevue})`)
            return false
          }
        }
      }
    }
    return true
  }

  const genId = () => Math.random().toString(36).substring(2, 11)

  const safeDate = (d?: string) => {
    const parsed = new Date(d || '')
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
  }
const getDailyLoad = (memberId: number, date: Date, excludeTaskId?: string): number => {
  let totalHours = 0

  // 🔹 Charges depuis API (loads)
  loads.forEach(load => {
    if (load.employeId !== memberId) return

    const start = new Date(load.dateDebut)
    const end = new Date(load.dateFin)

    if (date >= start && date <= end) {
      totalHours += load.heuresParJour || 7 // fallback si non défini
    }
  })

  // 🔹 Charges du projet courant
  phases.forEach(phase => {
    phase.taches.forEach(task => {
      if (excludeTaskId && task.id === excludeTaskId) return

      if (task.responsableId === memberId || task.testeurId === memberId) {
        const start = new Date(task.dateDebutPrevue)
        const end = new Date(task.dateFinPrevue)

        if (date >= start && date <= end) {
          const totalTaskHours = task.sousTaches.reduce(
            (sum, st) => sum + st.dureeEstimeeHeures,
            0
          )

          const nbDays = Math.max(
            1,
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
          )

          const hoursPerDay = totalTaskHours / nbDays

          totalHours += hoursPerDay
        }
      }
    })
  })

  return totalHours
}
  const mapEmployee = (emp: any): TeamMember => ({
    id: emp.id,
    nomComplet: emp.nomComplet || `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim() || 'Inconnu',
    role: emp.role || 'Employé',
    email: emp.email || '',
    phone: emp.telephone || emp.phone || '',
    specialites: emp.specialites || emp.competences || [],
    dateArrivee: emp.dateArrivee,
    statut: emp.statut || 'actif',
  })

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  useEffect(() => {
    const init = async () => {
      try {
        setInitialLoading(true)

        const [
         
          loadsData,
          overloadedData,
          suggestionsData,
          membersData,
          projectData
        ] = await Promise.all([
         
          getLoads(),
          getOverloaded(),
          getSuggestions(),
          getAvailableMembers(),
          projectId && !propProject ? getProjetById(projectId) : propProject
        ])

        setLoads(loadsData)
        setOverloaded(overloadedData)
        setSuggestions(suggestionsData)
        setAvailableMembers(membersData.map(mapEmployee))

        if (projectData) {
          setProject(projectData)

          setFormData({
            nom: projectData.nom || '',
            description: projectData.description || '',
            clientId: projectData.client?.id?.toString() || '',
            lieu: projectData.lieu || '',
            dateDebut: projectData.dateDebut?.split('T')[0] || '',
            dateFinPrevue: projectData.dateFinPrevue?.split('T')[0] || '',
            budgetEstime: projectData.budgetEstime?.toString() || '',
            budgetReel: projectData.budgetReel?.toString() || '',
            typeProjet: projectData.typeProjet || 'Développement Web',
            statut: projectData.statut || 'Planifié',
          })

          const mappedPhases = PHASE_TYPES.map(type => {
            const existing = projectData.phases?.find((p: any) => p.typePhase === type)

            return existing ? {
              id: existing.id?.toString() || genId(),
              typePhase: existing.typePhase,
              pourcentageBudget: existing.pourcentageBudget || 0,
              statut: existing.statut || 'AFaire',
              taches: (existing.taches || []).map((t: any) => ({
                id: t.id?.toString() || genId(),
                titre: t.titre,
                dateDebutPrevue: t.dateDebutPrevue?.split('T')[0] || '',
                dateFinPrevue: t.dateFinPrevue?.split('T')[0] || '',
                statut: t.statut || 'AFaire',
                responsableId: t.responsable?.id,
                testeurId: t.testeur?.id,
                sousTaches: (t.sousTaches || []).map((st: any) => ({
                  id: st.id?.toString() || genId(),
                  titre: st.titre,
                  dureeEstimeeHeures: st.dureeEstimeeHeures || 0,
                  statut: st.statut || 'AFaire',
                }))
              }))
            } : {
              id: genId(),
              typePhase: type,
              pourcentageBudget: Math.floor(100 / PHASE_TYPES.length),
              statut: 'AFaire',
              taches: []
            }
          })

          setPhases(mappedPhases)
          setExpandedPhases(mappedPhases.map(p => p.id))
          setTeamMembers(projectData.groupeEquipe?.employes?.map(mapEmployee) || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setInitialLoading(false)
      }
    }

    init()
  }, [projectId, propProject])

 
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    
    setLoading(true)

    if (!validateAllDateConflicts()) {
      setLoading(false)
      return
    }

    try {
      const dateDebut = formData.dateDebut ? new Date(formData.dateDebut) : new Date()
      const dateFinPrevue = formData.dateFinPrevue ? new Date(formData.dateFinPrevue) : new Date()
      
      if (isNaN(dateDebut.getTime()) || isNaN(dateFinPrevue.getTime())) {
        alert('Veuillez vérifier les dates')
        setLoading(false)
        return
      }

      const payload = {
        nom: formData.nom,
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        description: formData.description,
        lieu: formData.lieu,
        dateDebut: dateDebut.toISOString(),
        dateFinPrevue: dateFinPrevue.toISOString(),
        budgetEstime: formData.budgetEstime ? parseFloat(formData.budgetEstime) : 0,
        budgetReel: formData.budgetReel ? parseFloat(formData.budgetReel) : null,
        typeProjet: formData.typeProjet,
        phases: phases.map(phase => ({
          typePhase: phase.typePhase,
          pourcentageBudget: phase.pourcentageBudget,
          taches: phase.taches.map(task => ({
            titre: task.titre,
            dateDebutPrevue: safeDate(task.dateDebutPrevue),
            dateFinPrevue: safeDate(task.dateFinPrevue),
            responsableId: task.responsableId || null,
            testeurId: task.testeurId || null,
            sousTaches: task.sousTaches.map(st => ({
              titre: st.titre,
              dureeEstimeeHeures: st.dureeEstimeeHeures,
              statut: st.statut
            })),
          })),
        })),
      }

      const updatedProject = await updateProjet(project.id, payload)
      onSave?.(updatedProject)
      onBack()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour du projet')
    } finally {
      setLoading(false)
    }
  }

  // ==================== GESTION DE L'ÉQUIPE ====================
  
  const addTeamMember = async (member: TeamMember) => {
    if (teamMembers.some(m => m.id === member.id)) {
      alert('Ce membre est déjà dans l\'équipe')
      return
    }

    setAddingMembers(true)
    try {
      if (project?.id) {
        await addProjectMembers(project.id, [member.id])
      }
      setTeamMembers([...teamMembers, member])
      setShowTeamSelector(false)
      setSearchTerm('')
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error)
      alert('Erreur lors de l\'ajout du membre')
    } finally {
      setAddingMembers(false)
    }
  }

  const removeTeamMember = async (id: number) => {
    const member = teamMembers.find(m => m.id === id)
    if (!member) return

    if (!window.confirm(`Voulez-vous vraiment retirer ${member.nomComplet} de l'équipe ?`)) return

    setRemovingMemberId(id)
    try {
      if (project?.id) {
        await removeProjectMember(project.id, id)
      }
      setTeamMembers(teamMembers.filter(m => m.id !== id))
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error)
      alert('Erreur lors de la suppression du membre')
    } finally {
      setRemovingMemberId(null)
    }
  }

  const getMemberName = (id?: number) => {
    const member = teamMembers.find(m => m.id === id)
    return member ? member.nomComplet : ''
  }

  const availableMembersFiltered = availableMembers.filter(
    e => !teamMembers.some(m => m.id === e.id)
  ).filter(
    e => e.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
         e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (e.specialites && e.specialites.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  // ==================== GESTION DES PHASES ET TÂCHES ====================
  
  const togglePhase = (id: string) => {
    setExpandedPhases(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const updatePhaseBudget = (phaseId: string, value: number) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, pourcentageBudget: Math.min(100, Math.max(0, value)) } : p))
  }

  const addTask = (phaseId: string) => {
    const newTask: Tache = {
      id: genId(),
      titre: 'Nouvelle tâche',
      dateDebutPrevue: new Date().toISOString().split('T')[0],
      dateFinPrevue: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      statut: 'AFaire',
      responsableId: undefined,
      testeurId: undefined,
      sousTaches: [],
    }
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, taches: [...p.taches, newTask] } : p))
    setExpandedTasks(prev => [...prev, newTask.id])
  }

  const updateTask = (phaseId: string, taskId: string, field: string, value: any) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? {
      ...p,
      taches: p.taches.map(t => t.id === taskId ? { ...t, [field]: value } : t),
    } : p))
  }

  const deleteTask = (phaseId: string, taskId: string) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, taches: p.taches.filter(t => t.id !== taskId) } : p))
    }
  }

  const addSubTask = (phaseId: string, taskId: string) => {
    const st: SousTache = {
      id: genId(),
      titre: 'Nouvelle sous-tâche',
      dureeEstimeeHeures: 2,
      statut: 'AFaire',
    }
    setPhases(prev => prev.map(p => p.id === phaseId ? {
      ...p,
      taches: p.taches.map(t => t.id === taskId ? { ...t, sousTaches: [...t.sousTaches, st] } : t),
    } : p))
  }

  const updateSubTask = (phaseId: string, taskId: string, stId: string, field: string, value: any) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? {
      ...p,
      taches: p.taches.map(t => t.id === taskId ? {
        ...t,
        sousTaches: t.sousTaches.map(s => s.id === stId ? { ...s, [field]: value } : s),
      } : t),
    } : p))
  }

  const deleteSubTask = (phaseId: string, taskId: string, stId: string) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? {
      ...p,
      taches: p.taches.map(t => t.id === taskId ? {
        ...t,
        sousTaches: t.sousTaches.filter(s => s.id !== stId),
      } : t),
    } : p))
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ef7c21]/20 border-t-[#ef7c21] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Projet non trouvé</h3>
        <Button onClick={onBack} variant="outline">Retour</Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <nav className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <span>Projets</span>
              <span className="text-gray-300">/</span>
              <span className="text-[#1d1d1b] font-medium">Modification</span>
            </nav>
            <h1 className="text-3xl font-bold text-[#1d1d1b]">Modifier le projet</h1>
          </div>
        </div>
        {onDelete && (
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
            if (window.confirm('Supprimer ce projet ?')) onDelete(project.id)
          }}>
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
          </Button>
        )}
      </div>


      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {(['details', 'team', 'phases'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-[#ef7c21] text-[#ef7c21]' : 'border-b-2 border-transparent text-gray-500 hover:text-[#1d1d1b]'}`}>
              {tab === 'details' && 'Détails du projet'}
              {tab === 'team' && 'Équipe projet'}
              {tab === 'phases' && 'Phases & Tâches'}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">INFORMATIONS GÉNÉRALES</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Nom du projet</label>
                  <input type="text" required value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Type de projet</label>
                  <select value={formData.typeProjet} onChange={e => setFormData({ ...formData, typeProjet: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                    {PROJECT_TYPES.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value as ProjectStatut })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                    <option value="Planifié">Planifié</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Lieu</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={formData.lieu} onChange={e => setFormData({ ...formData, lieu: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Date de début</label>
                  <input type="date" value={formData.dateDebut} onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Date de fin prévue</label>
                  <input type="date" value={formData.dateFinPrevue} onChange={e => setFormData({ ...formData, dateFinPrevue: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Budget estimé (DH)</label>
                  <input type="number" value={formData.budgetEstime} onChange={e => setFormData({ ...formData, budgetEstime: e.target.value })} min="0" step="1000" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Budget réel (DH)</label>
                  <input type="number" value={formData.budgetReel} onChange={e => setFormData({ ...formData, budgetReel: e.target.value })} min="0" step="1000" placeholder="Optionnel" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">COMPOSITION DE L'ÉQUIPE</h3>
                <p className="text-xs text-gray-500 mt-1">Gérez les membres de l'équipe projet ({teamMembers.length} membres)</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTeamSelector(!showTeamSelector)} 
                className="text-xs border-[#ef7c21] text-[#ef7c21] hover:bg-[#ef7c21] hover:text-white"
                disabled={addingMembers}
              >
                {addingMembers ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3 mr-1" />
                )}
                Ajouter un membre
              </Button>
            </div>
            <div className="p-6">
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {teamMembers.map((member) => {
                    const isRemoving = removingMemberId === member.id
                    return (
                      <div 
                        key={member.id} 
                        className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ef7c21]/20 to-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] font-semibold text-lg">
                              {member.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            {member.role?.toLowerCase().includes('chef') && (
                              <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-[#1d1d1b]">{member.nomComplet}</span>
                              <span className="text-xs px-2 py-0.5 bg-[#ef7c21]/10 text-[#ef7c21] rounded-full">
                                {member.role}
                              </span>
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </div>
                            )}
                            {member.specialites && member.specialites.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {member.specialites.slice(0, 3).map((spec, idx) => (
                                  <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                    {spec}
                                  </span>
                                ))}
                                {member.specialites.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                    +{member.specialites.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeTeamMember(member.id)} 
                          disabled={isRemoving}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Aucun membre dans l'équipe</h4>
                  <p className="text-sm text-gray-500 mb-4">Ajoutez des membres pour constituer votre équipe</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowTeamSelector(true)}
                    className="border-[#ef7c21] text-[#ef7c21]"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un membre
                  </Button>
                </div>
              )}

              {showTeamSelector && (
                <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-[#1d1d1b]">Ajouter des membres</h4>
                      <button 
                        onClick={() => setShowTeamSelector(false)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, rôle ou compétence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
                      />
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {loadingMembers ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-6 w-6 text-[#ef7c21] animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">Chargement des membres...</span>
                      </div>
                    ) : availableMembersFiltered.length > 0 ? (
                      availableMembersFiltered.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => addTeamMember(emp)}
                          className="flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm group-hover:bg-[#ef7c21]/10 group-hover:text-[#ef7c21] transition-colors">
                            {emp.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium group-hover:text-[#ef7c21] transition-colors">
                                {emp.nomComplet}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {emp.role}
                              </span>
                            </div>
                            {emp.email && (
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {emp.email}
                              </div>
                            )}
                            {emp.phone && (
                              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {emp.phone}
                              </div>
                            )}
                            {emp.specialites && emp.specialites.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {emp.specialites.slice(0, 2).map((spec, idx) => (
                                  <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                    {spec}
                                  </span>
                                ))}
                                {emp.specialites.length > 2 && (
                                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">
                                    +{emp.specialites.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Plus className="h-5 w-5 text-gray-400 group-hover:text-[#ef7c21] transition-colors" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {searchTerm ? 'Aucun membre ne correspond à votre recherche' : 'Aucun membre disponible'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Phases Tab */}
        {activeTab === 'phases' && (
          <div className="space-y-4">
            {phases.map((phase, phaseIdx) => (
              <Card key={phase.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer" onClick={() => togglePhase(phase.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ef7c21]/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#ef7c21]">{phaseIdx + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{phase.typePhase}</h3>
                     
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{phase.taches.length} tâche(s)</span>
                    {expandedPhases.includes(phase.id) ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {expandedPhases.includes(phase.id) && (
                  <div className="p-6 space-y-4">
                    {phase.taches.map((task) => {
                      const responsableConflict = task.responsableId ? hasDateConflict(task.responsableId, task.dateDebutPrevue, task.dateFinPrevue, task.id) : false
                      const testeurConflict = task.testeurId ? hasDateConflict(task.testeurId, task.dateDebutPrevue, task.dateFinPrevue, task.id) : false
                      
                      return (
                        <div key={task.id} className={`border rounded-xl overflow-hidden transition-all ${responsableConflict || testeurConflict ? 'border-red-300 bg-red-50/30' : 'border-gray-100'}`}>
                          <div className="p-4 bg-gray-50/50 cursor-pointer" onClick={() => toggleTask(task.id)}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <input type="text" value={task.titre} onChange={(e) => updateTask(phase.id, task.id, 'titre', e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full px-2 py-1 border border-transparent hover:border-gray-300 rounded-lg bg-transparent font-medium focus:outline-none focus:border-[#ef7c21]" placeholder="Titre de la tâche" />
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={(e) => { e.stopPropagation(); deleteTask(phase.id, task.id) }} className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                {expandedTasks.includes(task.id) ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[#ef7c21]" />
                                <select
                                  value={task.responsableId || ''}
                                  onChange={(e) => {
                                    const selectedId = e.target.value ? parseInt(e.target.value) : undefined
                                    const conflict = hasDateConflict(selectedId, task.dateDebutPrevue, task.dateFinPrevue, task.id)
                                    
                                    if (selectedId && conflict) {
                                      alert(`⛔ ${getMemberName(selectedId)} est déjà occupé(e) sur cette période (${task.dateDebutPrevue} → ${task.dateFinPrevue})`)
                                      return
                                    }
                                    updateTask(phase.id, task.id, 'responsableId', selectedId)
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                >
                                  <option value="">Choisir un responsable</option>
                                  {teamMembers.map(m => {
                                    const conflict = hasDateConflict(m.id, task.dateDebutPrevue, task.dateFinPrevue, task.id)
                                    return (
                                      <option key={m.id} value={m.id} disabled={conflict}>
                                        {m.nomComplet} {conflict ? '⛔ (Occupé sur cette période)' : ''}
                                      </option>
                                    )
                                  })}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-[#ef7c21]" />
                                <select 
                                  value={task.testeurId || ''} 
                                  onChange={(e) => {
                                    const selectedId = e.target.value ? parseInt(e.target.value) : undefined
                                    const conflict = hasDateConflict(selectedId, task.dateDebutPrevue, task.dateFinPrevue, task.id)
                                    
                                    if (selectedId && conflict) {
                                      alert(`⛔ ${getMemberName(selectedId)} est déjà occupé(e) sur cette période (${task.dateDebutPrevue} → ${task.dateFinPrevue})`)
                                      return
                                    }
                                    updateTask(phase.id, task.id, 'testeurId', selectedId)
                                  }} 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
                                >
                                  <option value="">Choisir un testeur</option>
                                  {teamMembers.map(m => {
                                    const conflict = hasDateConflict(m.id, task.dateDebutPrevue, task.dateFinPrevue, task.id)
                                    return (
                                      <option key={m.id} value={m.id} disabled={conflict}>
                                        {m.nomComplet} - {m.role} {conflict ? '⛔ (Occupé)' : ''}
                                      </option>
                                    )
                                  })}
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <input type="date" value={task.dateDebutPrevue} onChange={(e) => updateTask(phase.id, task.id, 'dateDebutPrevue', e.target.value)} onClick={(e) => e.stopPropagation()} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white" />
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <input type="date" value={task.dateFinPrevue} onChange={(e) => updateTask(phase.id, task.id, 'dateFinPrevue', e.target.value)} onClick={(e) => e.stopPropagation()} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white" />
                              </div>
                            </div>

                            {(task.responsableId || task.testeurId) && (
                              <div className="flex gap-4 mt-2 text-xs">
                                {task.responsableId && (
                                  <div className={`flex items-center gap-1 ${responsableConflict ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                    <User className="h-3 w-3" />
                                    Responsable: {getMemberName(task.responsableId)}
                                    {responsableConflict && <span className="text-red-500 ml-1">⚠️ Conflit de dates</span>}
                                  </div>
                                )}
                                {task.testeurId && (
                                  <div className={`flex items-center gap-1 ${testeurConflict ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                    <CheckCircle className="h-3 w-3" />
                                    Testeur: {getMemberName(task.testeurId)}
                                    {testeurConflict && <span className="text-red-500 ml-1">⚠️ Conflit de dates</span>}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {expandedTasks.includes(task.id) && (
                            <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                              {task.sousTaches.map((st) => (
                                <div key={st.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg group">
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-[#ef7c21] rounded-full" />
                                    <input type="text" value={st.titre} onChange={(e) => updateSubTask(phase.id, task.id, st.id, 'titre', e.target.value)} className="flex-1 px-2 py-1 border border-transparent hover:border-gray-300 rounded-lg text-sm bg-transparent focus:outline-none focus:border-[#ef7c21]" placeholder="Sous-tâche" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input type="number" value={st.dureeEstimeeHeures} onChange={(e) => updateSubTask(phase.id, task.id, st.id, 'dureeEstimeeHeures', parseInt(e.target.value))} min="1" className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs" />
                                    <span className="text-xs text-gray-500">h</span>
                                    <select value={st.statut} onChange={(e) => updateSubTask(phase.id, task.id, st.id, 'statut', e.target.value)} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white">
                                      <option value="AFaire">À faire</option>
                                      <option value="EnCours">En cours</option>
                                      <option value="ATester">À tester</option>
                                      <option value="Validee">Validée</option>
                                      <option value="Rejetee">Rejetée</option>
                                    </select>
                                    <button type="button" onClick={() => deleteSubTask(phase.id, task.id, st.id)} className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button type="button" onClick={() => addSubTask(phase.id, task.id)} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-colors flex items-center justify-center gap-1">
                                <Plus className="h-3 w-3" /> Ajouter une sous-tâche
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button type="button" onClick={() => addTask(phase.id)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-colors flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Ajouter une tâche
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <X className="h-4 w-4 mr-2" /> Annuler
          </Button>
          <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] text-white hover:from-[#d95f0c] hover:to-[#ef7c21]">
            <Save className="h-4 w-4 mr-2" /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditProjectView