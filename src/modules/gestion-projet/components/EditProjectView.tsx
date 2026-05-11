import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '../../../ui/Card'
import { Button } from '../../../ui/Button'
import {
  getAllLoads,
  getOverloaded,
  type GlobalLoad,
} from '../services/loadBalancingService'
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
  Star,
  RefreshCw,
  Eye,
  EyeOff,
  CalendarOff,
  Clock,
  Zap,
  Tag,
  Award,
  BarChart2,
  Sparkles,
  Download,
  FileText,
  Upload,
} from 'lucide-react'
import {
  getProjetById,
  updateProjet,
  addProjectMembers,
  removeProjectMember,
  getAvailableMembers,
  uploadCdcFile,
  deleteCdcFile,
  downloadCdcFile,
  checkCdcExists,
} from '../services/projectService'
import { AIPlanningModal } from './Aiplanningmodal'
import type { PhaseGeneree } from '../services/aiPlanningService'
import {
  getCompetences,
  ajouterCompetence,
  supprimerCompetence,
  assignerCompetence,
  retirerCompetenceEmploye,
  getCompetencesByEmploye,
  type Competence as ApiCompetence,
} from '../services/competenceService'
import {
  fetchTunisiaHolidays,
  fetchHolidaysForRange,
} from '../services/holidayService'
import { getTypesProjet, type TypeProjet } from '../services/typeProjetService'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatut = 'Planifié' | 'En cours' | 'Terminé' | 'Annulé'
type TypePhase = 'Analyse' | 'Conception' | 'MiseEnOeuvre' | 'Validation' | 'MiseEnService'
type NiveauCompetence = 'Débutant' | 'Intermédiaire' | 'Expert'

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
  competencesRequises?: string[]
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

interface JourFerie {
  id: string
  date: string
  nom: string
  recurrent: boolean
}

interface Competence {
  id: string
  nom: string
  categorie: string
  niveau: NiveauCompetence
  description?: string
}

interface EditProjectViewProps {
  project?: Record<string, unknown>
  projectId?: string
  onBack: () => void
  onSave?: (updatedProject: Record<string, unknown>) => void
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PHASE_TYPES: TypePhase[] = [
  'Analyse', 'Conception', 'MiseEnOeuvre', 'Validation', 'MiseEnService',
]

const MAX_HOURS_PER_DAY = 8

const CATEGORIES_COMPETENCES = [
  'Frontend', 'Backend', 'Mobile', 'Design', 'DevOps', 'Base de données',
  'Management', 'Analyse', 'Test QA', 'Sécurité', 'IA / Data', 'Autre',
]

const NIVEAUX: NiveauCompetence[] = ['Débutant', 'Intermédiaire', 'Expert']

const NIVEAU_COLOR: Record<NiveauCompetence, string> = {
  Débutant: 'bg-blue-100 text-blue-700',
  Intermédiaire: 'bg-yellow-100 text-yellow-700',
  Expert: 'bg-green-100 text-green-700',
}

// Mapping des icônes pour les types de projet
const getProjectTypeIcon = (typeValue: string): { icon: React.ElementType; color: string; bg: string } => {
  const typeLower = typeValue.toLowerCase()
  if (typeLower.includes('web')) return { icon: Code, color: 'text-[#ef7c21]', bg: 'bg-orange-50' }
  if (typeLower.includes('mobile')) return { icon: Smartphone, color: 'text-[#ef7c21]', bg: 'bg-orange-50' }
  if (typeLower.includes('design')) return { icon: PenTool, color: 'text-[#ef7c21]', bg: 'bg-orange-50' }
  if (typeLower.includes('consulting')) return { icon: Briefcase, color: 'text-[#ef7c21]', bg: 'bg-orange-50' }
  return { icon: Briefcase, color: 'text-[#ef7c21]', bg: 'bg-orange-50' }
}

// ─── Helpers hors composant ──────────────────────────────────────────────────

interface ApiEmployee {
  id: number
  nomComplet?: string
  prenom?: string
  nom?: string
  role?: string
  email?: string
  telephone?: string
  phone?: string
  specialites?: string[]
  dateArrivee?: string
  statut?: string
}

function mapEmployee(emp: ApiEmployee): TeamMember {
  return {
    id: emp.id,
    nomComplet: emp.nomComplet || `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim() || 'Inconnu',
    role: emp.role || 'Employé',
    email: emp.email || '',
    phone: emp.telephone || emp.phone || '',
    specialites: emp.specialites || [],
    dateArrivee: emp.dateArrivee,
    statut: emp.statut || 'actif',
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function EditProjectView({
  project: propProject,
  projectId,
  onBack,
  onSave,
}: EditProjectViewProps) {
  // ── État général ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showTeamSelector, setShowTeamSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'phases' | 'feries' | 'competences'>('details')
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [addingMembers, setAddingMembers] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)
  const [loads, setLoads] = useState<GlobalLoad[]>([])
  const [showValidatedSubtasks, setShowValidatedSubtasks] = useState(true)
  const [showAIModal, setShowAIModal] = useState(false)

  // ── Types de projet dynamiques ──────────────────────────────────────────
  const [projectTypes, setProjectTypes] = useState<TypeProjet[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)

  // ── Cahier des charges ──────────────────────────────────────────────────
  const [cdcFile, setCdcFile] = useState<File | null>(null)
  const [cdcExists, setCdcExists] = useState(false)
  const [isUploadingCdc, setIsUploadingCdc] = useState(false)
  const [cdcUploadProgress, setCdcUploadProgress] = useState(0)
  const [isDeletingCdc, setIsDeletingCdc] = useState(false)
  const [isDownloadingCdc, setIsDownloadingCdc] = useState(false)

  // ── Chef de projet ──────────────────────────────────────────────────────
  const [chefEquipeId, setChefEquipeId] = useState<number | null>(null)

  // ── Jours fériés ────────────────────────────────────────────────────────
  const [joursFeries, setJoursFeries] = useState<JourFerie[]>([])
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false)
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear())
  const [holidayError, setHolidayError] = useState<string | null>(null)

  // ── Compétences ──────────────────────────────────────────────────────────
  const [competences, setCompetences] = useState<Competence[]>([])
  const [newComp, setNewComp] = useState<Omit<Competence, 'id'>>({
    nom: '', categorie: CATEGORIES_COMPETENCES[0], niveau: 'Intermédiaire', description: '',
  })
  const [showAddComp, setShowAddComp] = useState(false)
  const [filterCategorie, setFilterCategorie] = useState<string>('all')
  const [employeCompetences, setEmployeCompetences] = useState<Map<number, string[]>>(new Map())
  const [showMemberCompetenceModal, setShowMemberCompetenceModal] = useState(false)
  const [selectedMemberForCompetence, setSelectedMemberForCompetence] = useState<TeamMember | null>(null)
  const [compModalTaskId, setCompModalTaskId] = useState<string | null>(null)
  const [compModalPhaseId, setCompModalPhaseId] = useState<string | null>(null)

  // ── Formulaire projet ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    nom: '', description: '', clientId: '', lieu: '',
    dateDebut: '', dateFinPrevue: '',
    budgetEstime: '', budgetReel: '',
    typeProjet: '',
    statut: 'Planifié' as ProjectStatut,
  })
  const [phases, setPhases] = useState<Phase[]>([])
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([])

  // ==================== CHEF DE PROJET ====================
  const chefProjet = useMemo(() => {
    if (chefEquipeId) {
      const byId = teamMembers.find(m => m.id === chefEquipeId)
      if (byId) return byId
    }
    return teamMembers.find(m =>
      m.role?.toLowerCase().includes('chef') ||
      m.role?.toLowerCase().includes('lead') ||
      m.role?.toLowerCase().includes('manager') ||
      m.role?.toLowerCase().includes('directeur') ||
      m.role?.toLowerCase().includes('scrum master')
    )
  }, [teamMembers, chefEquipeId])

  // ==================== CHARGEMENT DES TYPES DE PROJET ====================
  // Ref pour capturer la valeur initiale de typeProjet sans créer de dépendance
  const initialTypeProjetRef = React.useRef(formData.typeProjet)

  useEffect(() => {
    const initialTypeProjet = initialTypeProjetRef.current
    const loadProjectTypes = async () => {
      try {
        setLoadingTypes(true)
        const types = await getTypesProjet()
        if (types && types.length > 0) {
          setProjectTypes(types)
          if (!initialTypeProjet && types.length > 0) {
            setFormData(prev => ({ ...prev, typeProjet: types[0].value }))
          }
        }
      } catch (error) {
        console.error('Erreur chargement types de projet:', error)
        const defaultTypes = [
          { id: 1, typeProjetGuid: 'web', value: 'Développement Web', label: 'Développement Web', isActive: true, ordre: 1, updatedAt: '' },
          { id: 2, typeProjetGuid: 'mobile', value: 'Développement Mobile', label: 'Développement Mobile', isActive: true, ordre: 2, updatedAt: '' },
          { id: 3, typeProjetGuid: 'design', value: 'Design UI/UX', label: 'Design UI/UX', isActive: true, ordre: 3, updatedAt: '' },
          { id: 4, typeProjetGuid: 'consulting', value: 'Consulting', label: 'Consulting', isActive: true, ordre: 4, updatedAt: '' },
          { id: 5, typeProjetGuid: 'it', value: 'IT', label: 'IT', isActive: true, ordre: 5, updatedAt: '' },
        ]
        setProjectTypes(defaultTypes)
        if (!initialTypeProjet && defaultTypes.length > 0) {
          setFormData(prev => ({ ...prev, typeProjet: defaultTypes[0].value }))
        }
      } finally {
        setLoadingTypes(false)
      }
    }
    loadProjectTypes()
  }, [initialTypeProjetRef])

  // ==================== JOURS FÉRIÉS ====================
  const loadHolidaysFromAPI = useCallback(async (year: number) => {
    try {
      setIsLoadingHolidays(true)
      setHolidayError(null)
      const holidays = await fetchTunisiaHolidays(year)
      const mappedHolidays: JourFerie[] = holidays.map(holiday => ({
        id: `holiday-${holiday.date}`,
        date: holiday.date,
        nom: holiday.localName || holiday.name,
        recurrent: holiday.fixed || false,
      }))
      setJoursFeries(mappedHolidays)
    } catch (err) {
      console.error('Erreur chargement jours fériés:', err)
      setHolidayError('Impossible de charger les jours fériés')
      setJoursFeries([])
    } finally {
      setIsLoadingHolidays(false)
    }
  }, [])

  const loadHolidaysForDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setIsLoadingHolidays(true)
      setHolidayError(null)
      const holidays = await fetchHolidaysForRange(startDate, endDate)
      const mappedHolidays: JourFerie[] = holidays.map(holiday => ({
        id: `holiday-${holiday.date}`,
        date: holiday.date,
        nom: holiday.localName || holiday.name,
        recurrent: holiday.fixed || false,
      }))
      setJoursFeries(mappedHolidays)
    } catch (err) {
      console.error('Erreur chargement jours fériés:', err)
      setHolidayError('Impossible de charger les jours fériés pour cette période')
    } finally {
      setIsLoadingHolidays(false)
    }
  }, [])

  const isJourFerie = useCallback((date: Date): boolean => {
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    return joursFeries.some(jf => {
      if (jf.recurrent) {
        const jfMmDd = jf.date.slice(5)
        return jfMmDd === `${mm}-${dd}`
      } else {
        return jf.date === `${yyyy}-${mm}-${dd}`
      }
    })
  }, [joursFeries])

  const isWorkDay = useCallback((date: Date): boolean => {
    const day = date.getDay()
    return day !== 0 && day !== 6 && !isJourFerie(date)
  }, [isJourFerie])

  const countWorkDays = useCallback((start: Date, end: Date): number => {
    let count = 0
    const current = new Date(start)
    const endDate = new Date(end)
    while (current <= endDate) {
      if (isWorkDay(new Date(current))) count++
      current.setDate(current.getDate() + 1)
    }
    return Math.max(1, count)
  }, [isWorkDay])

  const getFeriesInRange = useCallback((start: Date, end: Date): JourFerie[] => {
    const result: JourFerie[] = []
    const uniqueDates = new Set<string>()
    joursFeries.forEach(jf => {
      if (jf.recurrent) {
        const mmdd = jf.date.slice(5)
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const cur = new Date(d)
          const curMmdd = `${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
          if (curMmdd === mmdd) {
            const dateStr = cur.toISOString().split('T')[0]
            if (!uniqueDates.has(dateStr)) {
              uniqueDates.add(dateStr)
              result.push({ ...jf, date: dateStr })
            }
            break
          }
        }
      } else {
        const jfDate = new Date(jf.date)
        if (jfDate >= start && jfDate <= end) {
          const dateStr = jfDate.toISOString().split('T')[0]
          if (!uniqueDates.has(dateStr)) {
            uniqueDates.add(dateStr)
            result.push(jf)
          }
        }
      }
    })
    return result
  }, [joursFeries])

  const joursFeriesSorted = useMemo(() =>
    [...joursFeries].sort((a, b) => a.date.localeCompare(b.date)),
    [joursFeries])

  const holidaysByMonth = useMemo(() => {
    const groups: Record<string, JourFerie[]> = {}
    joursFeriesSorted.forEach(jf => {
      const month = new Date(jf.date).toLocaleDateString('fr-FR', { month: 'long' })
      if (!groups[month]) groups[month] = []
      groups[month].push(jf)
    })
    return groups
  }, [joursFeriesSorted])

  // ==================== COMPÉTENCES ====================
  const loadEmployeCompetences = useCallback(async (employeId: number) => {
    try {
      const data = await getCompetencesByEmploye(employeId)
      const skills = data.map(ec => ec.competenceNom)
      setEmployeCompetences(prev => new Map(prev).set(employeId, skills))
      return skills
    } catch (err) {
      console.error(`Erreur chargement compétences employé ${employeId}:`, err)
      return []
    }
  }, [])

  const addCompetence = async () => {
    if (!newComp.nom.trim()) { alert('Renseignez le nom de la compétence.'); return }
    if (competences.some(c => c.nom.toLowerCase() === newComp.nom.trim().toLowerCase())) {
      alert('Cette compétence existe déjà.')
      return
    }
    try {
      const newCompetence = await ajouterCompetence({
        nom: newComp.nom.trim(),
        categorie: newComp.categorie,
        niveau: newComp.niveau,
        description: newComp.description,
      })
      setCompetences(prev => [...prev, {
        id: newCompetence.id.toString(),
        nom: newCompetence.nom,
        categorie: newCompetence.categorie,
        niveau: newCompetence.niveau as NiveauCompetence,
        description: newCompetence.description,
      }])
      setNewComp({ nom: '', categorie: CATEGORIES_COMPETENCES[0], niveau: 'Intermédiaire', description: '' })
      setShowAddComp(false)
    } catch (err) {
      console.error('Erreur ajout compétence:', err)
      alert("Erreur lors de l'ajout de la compétence")
    }
  }

  const removeCompetence = async (id: string) => {
    const competence = competences.find(c => c.id === id)
    if (!competence) return
    if (!window.confirm(`Supprimer la compétence "${competence.nom}" ?`)) return
    try {
      await supprimerCompetence(parseInt(id))
      setCompetences(prev => prev.filter(c => c.id !== id))
      const nom = competence.nom
      if (nom) {
        setPhases(prev => prev.map(p => ({
          ...p,
          taches: p.taches.map(t => ({
            ...t,
            competencesRequises: (t.competencesRequises || []).filter(cr => cr !== nom),
          })),
        })))
      }
    } catch (err) {
      console.error('Erreur suppression compétence:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleAssignCompetenceToMember = async (employeId: number, competenceId: number) => {
    try {
      const competence = competences.find(c => parseInt(c.id) === competenceId)
      await assignerCompetence(employeId, competenceId, competence?.niveau || 'Intermédiaire')
      await loadEmployeCompetences(employeId)
      alert('Compétence assignée avec succès')
    } catch (err) {
      console.error('Erreur assignation compétence:', err)
      alert("Erreur lors de l'assignation")
    }
  }

  const handleRemoveCompetenceFromMember = async (employeId: number, competenceNom: string) => {
    try {
      const competence = competences.find(c => c.nom === competenceNom)
      if (!competence) return
      await retirerCompetenceEmploye(employeId, parseInt(competence.id))
      await loadEmployeCompetences(employeId)
      alert('Compétence retirée avec succès')
    } catch (err) {
      console.error('Erreur retrait compétence:', err)
      alert('Erreur lors du retrait')
    }
  }

  const toggleTaskCompetence = (phaseId: string, taskId: string, nomComp: string) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p
      return {
        ...p,
        taches: p.taches.map(t => {
          if (t.id !== taskId) return t
          const current = t.competencesRequises || []
          const next = current.includes(nomComp)
            ? current.filter(c => c !== nomComp)
            : [...current, nomComp]
          return { ...t, competencesRequises: next }
        }),
      }
    }))
  }

  const getMemberSkillMatch = useCallback((member: TeamMember, task: Tache): number => {
    const required = task.competencesRequises || []
    if (required.length === 0) return 100
    const memberSkills = employeCompetences.get(member.id) || member.specialites || []
    const memberSkillsLower = memberSkills.map(s => s.toLowerCase())
    const matched = required.filter(r => memberSkillsLower.includes(r.toLowerCase())).length
    return Math.round((matched / required.length) * 100)
  }, [employeCompetences])

  const getMembersSortedBySkillMatch = useCallback((task: Tache): (TeamMember & { matchPct: number; missing: string[] })[] => {
    return teamMembers.map(m => {
      const required = task.competencesRequises || []
      const memberSkills = employeCompetences.get(m.id) || m.specialites || []
      const memberSkillsLower = memberSkills.map(s => s.toLowerCase())
      const missing = required.filter(r => !memberSkillsLower.includes(r.toLowerCase()))
      const matchPct = getMemberSkillMatch(m, task)
      return { ...m, matchPct, missing }
    }).sort((a, b) => b.matchPct - a.matchPct)
  }, [teamMembers, employeCompetences, getMemberSkillMatch])

  const competencesFiltrees = useMemo(() => {
    if (filterCategorie === 'all') return competences
    return competences.filter(c => c.categorie === filterCategorie)
  }, [competences, filterCategorie])

  const competencesParCategorie = useMemo(() => {
    const groups: Record<string, Competence[]> = {}
    competencesFiltrees.forEach(c => {
      if (!groups[c.categorie]) groups[c.categorie] = []
      groups[c.categorie].push(c)
    })
    return groups
  }, [competencesFiltrees])

  // ==================== UTILITAIRES ====================
  const isSubTaskValidated = (statut: string) =>
    statut === 'Validee' || statut === 'validée' || statut === 'VALIDEE'

  const getRemainingTaskHours = useCallback((task: Tache) =>
    task.sousTaches.filter(st => !isSubTaskValidated(st.statut)).reduce((s, st) => s + st.dureeEstimeeHeures, 0)
  , [])

  const getValidatedSubTasksCount = (task: Tache) =>
    task.sousTaches.filter(st => isSubTaskValidated(st.statut)).length

  const isTaskFullyValidated = (task: Tache) =>
    task.sousTaches.length > 0 && task.sousTaches.every(st => isSubTaskValidated(st.statut))

  const genId = () => Math.random().toString(36).substring(2, 11)

  const safeDate = (d?: string) => {
    const p = new Date(d || '')
    return isNaN(p.getTime()) ? new Date().toISOString() : p.toISOString()
  }

  const getMemberName = useCallback((id?: number) => teamMembers.find(m => m.id === id)?.nomComplet ?? '', [teamMembers])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Non définie'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  // ==================== VALIDATION DATES ====================
  const validateTaskDates = (start: string, end: string): boolean => {
    if (!formData.dateDebut || !formData.dateFinPrevue) {
      alert("⚠️ Définissez d'abord les dates du projet.")
      return false
    }
    const pS = new Date(formData.dateDebut), pE = new Date(formData.dateFinPrevue)
    const tS = new Date(start), tE = new Date(end)
    if (isNaN(tS.getTime()) || isNaN(tE.getTime())) return false
    if (tS < pS) { alert(`⚠️ Début (${formatDate(start)}) avant le début du projet (${formatDate(formData.dateDebut)}).`); return false }
    if (tE > pE) { alert(`⚠️ Fin (${formatDate(end)}) après la fin du projet (${formatDate(formData.dateFinPrevue)}).`); return false }
    if (tS > tE) { alert('⚠️ Date de début postérieure à la date de fin.'); return false }
    return true
  }

  const validateAllTaskDates = (): boolean => {
    const pS = new Date(formData.dateDebut), pE = new Date(formData.dateFinPrevue)
    if (isNaN(pS.getTime()) || isNaN(pE.getTime())) { alert('⚠️ Définissez les dates du projet.'); return false }
    for (const phase of phases) {
      for (const task of phase.taches) {
        const s = new Date(task.dateDebutPrevue), e = new Date(task.dateFinPrevue)
        if (isNaN(s.getTime()) || isNaN(e.getTime())) { alert(`⚠️ Tâche "${task.titre}" : dates invalides.`); return false }
        if (s < pS) { alert(`⚠️ Tâche "${task.titre}" commence avant le projet.`); return false }
        if (e > pE) { alert(`⚠️ Tâche "${task.titre}" se termine après le projet.`); return false }
        if (s > e) { alert(`⚠️ Tâche "${task.titre}" : début postérieur à la fin.`); return false }
      }
    }
    return true
  }

  const validateAllTasksHaveSubTasks = (): boolean => {
    for (const phase of phases)
      for (const task of phase.taches)
        if (!task.sousTaches?.length) { alert(`⚠️ Tâche "${task.titre}" n'a aucune sous-tâche.`); return false }
    return true
  }

  const validateAllSubTasksHaveTitle = (): boolean => {
    for (const phase of phases)
      for (const task of phase.taches)
        for (const st of task.sousTaches)
          if (!st.titre?.trim()) { alert(`⚠️ Sous-tâche de "${task.titre}" sans titre.`); return false }
    return true
  }

  const validateAllSubTasksHaveDuration = (): boolean => {
    for (const phase of phases)
      for (const task of phase.taches)
        for (const st of task.sousTaches)
          if (!st.dureeEstimeeHeures || st.dureeEstimeeHeures <= 0) {
            alert(`⚠️ Sous-tâche "${st.titre || 'Sans titre'}" de "${task.titre}" : durée invalide.`); return false
          }
    return true
  }

  // ==================== LOAD BALANCING ====================
  const getExistingDailyLoad = useCallback((memberId: number, date: Date, excludeTaskId?: string): number => {
    if (!isWorkDay(date)) return 0
    let total = 0
    loads.forEach((load: GlobalLoad) => {
      if (load.employeId !== memberId) return
      if (project && load.projetId === project.id) return
      const loadDate = new Date(load.date)
      if (loadDate.toDateString() === date.toDateString()) {
        total += load.totalHeures
      }
    })
    phases.forEach(phase => {
      phase.taches.forEach(task => {
        if (excludeTaskId && task.id === excludeTaskId) return
        if (task.responsableId !== memberId) return
        const s = new Date(task.dateDebutPrevue), e = new Date(task.dateFinPrevue)
        if (date < s || date > e) return
        const h = task.sousTaches.filter(st => !isSubTaskValidated(st.statut)).reduce((sum, st) => sum + st.dureeEstimeeHeures, 0)
        const wd = Math.max(1, countWorkDays(s, e))
        total += h / wd
      })
    })
    return total
  }, [loads, phases, isWorkDay, countWorkDays, project])

  const getTaskDailyContribution = useCallback((task: Tache): number => {
    const s = new Date(task.dateDebutPrevue), e = new Date(task.dateFinPrevue)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
    const h = task.sousTaches.filter(st => !isSubTaskValidated(st.statut)).reduce((sum, st) => sum + st.dureeEstimeeHeures, 0)
    const wd = Math.max(1, countWorkDays(s, e))
    return h / wd
  }, [countWorkDays])

  const getAssignmentConflict = useCallback((
    memberId: number | undefined,
    task: Tache,
    excludeTaskId?: string
  ): { hasConflict: boolean; conflictingDates: string[]; message: string; suggestedAction?: string; dailyLoad?: number } => {
    if (!memberId || !task.dateDebutPrevue || !task.dateFinPrevue)
      return { hasConflict: false, conflictingDates: [], message: '' }

    const startDate = new Date(task.dateDebutPrevue), endDate = new Date(task.dateFinPrevue)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      return { hasConflict: false, conflictingDates: [], message: '' }

    const totalWorkDays = countWorkDays(startDate, endDate)
    let blockedDaysCount = 0

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d)
      if (!isWorkDay(cur)) continue
      const existing = getExistingDailyLoad(memberId, cur, excludeTaskId)
      if (existing >= MAX_HOURS_PER_DAY) blockedDaysCount++
    }

    const availableWorkDays = totalWorkDays - blockedDaysCount

    if (availableWorkDays <= 0) {
      return {
        hasConflict: true, conflictingDates: [],
        message: "Aucun jour ouvré disponible pour cette période",
        suggestedAction: "Déplacer la tâche ou changer le responsable",
        dailyLoad: 0,
      }
    }

    const totalHours = getRemainingTaskHours(task)
    const effectiveDailyContribution = totalHours / availableWorkDays
    const conflictingDates: string[] = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d)
      if (!isWorkDay(cur)) continue
      const existing = getExistingDailyLoad(memberId, cur, excludeTaskId)
      if (existing >= MAX_HOURS_PER_DAY) continue
      const totalLoad = existing + effectiveDailyContribution
      if (totalLoad > MAX_HOURS_PER_DAY) {
        conflictingDates.push(`${cur.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} (${totalLoad.toFixed(1)}h > ${MAX_HOURS_PER_DAY}h)`)
      }
    }

    let message = ''
    if (conflictingDates.length === 1) message = `Dépasse ${MAX_HOURS_PER_DAY}h le ${conflictingDates[0]}`
    else if (conflictingDates.length > 1 && conflictingDates.length <= 3) message = `Dépasse ${MAX_HOURS_PER_DAY}h les : ${conflictingDates.join(', ')}`
    else if (conflictingDates.length > 3) message = `Dépasse ${MAX_HOURS_PER_DAY}h sur ${conflictingDates.length} jours ouvrés`
    else if (blockedDaysCount > 0) message = `Charge ajustée : ${totalHours}h réparties sur ${availableWorkDays}j disponibles (${blockedDaysCount}j saturés exclus)`

    let suggestedAction = ''
    if (conflictingDates.length > 0) suggestedAction = `Réduire la charge ou augmenter la durée de la tâche`
    else if (blockedDaysCount > 0) suggestedAction = `Le responsable est déjà occupé certains jours, la charge est concentrée sur ses jours libres.`

    return { hasConflict: conflictingDates.length > 0, conflictingDates, message, suggestedAction, dailyLoad: effectiveDailyContribution }
  }, [getExistingDailyLoad, isWorkDay, countWorkDays, getRemainingTaskHours])

  const validateAllAssignments = useCallback((): boolean => {
    for (const phase of phases) {
      for (const task of phase.taches) {
        if (task.responsableId) {
          const c = getAssignmentConflict(task.responsableId, task, task.id)
          if (c.hasConflict) {
            alert(
              `⛔ RESPONSABLE "${getMemberName(task.responsableId)}"\n` +
              `${c.message}${c.suggestedAction ? '\n💡 ' + c.suggestedAction : ''}\n\n` +
              `📋 "${task.titre}"\n📅 ${task.dateDebutPrevue} → ${task.dateFinPrevue}`
            )
            return false
          }
        }
      }
    }
    return true
  }, [phases, getAssignmentConflict, getMemberName])

  // ==================== CHARGEMENT INITIAL ====================
  useEffect(() => {
    const fetchMultiProjectData = async () => {
      if (initialLoading) return
      try {
        const [globalLoads, overloadedEmployees] = await Promise.all([
          getAllLoads().catch(() => []),
          getOverloaded(MAX_HOURS_PER_DAY).catch(() => []),
        ])
        setLoads(globalLoads)
        void overloadedEmployees // chargé pour usage futur
      } catch (error) {
        console.error("Erreur chargement données multi-projets:", error)
      }
    }
    fetchMultiProjectData()
  }, [initialLoading])

  useEffect(() => {
    const init = async () => {
      try {
        setInitialLoading(true)
        const [membersData, projectData, competencesData] = await Promise.all([
          getAvailableMembers(),
          projectId && !propProject ? getProjetById(projectId) : Promise.resolve(propProject),
          getCompetences().catch(() => []),
        ])
        setAvailableMembers(membersData.map(mapEmployee))

        if (competencesData && competencesData.length > 0) {
          setCompetences(competencesData.map((c: ApiCompetence) => ({
            id: c.id.toString(),
            nom: c.nom,
            categorie: c.categorie,
            niveau: c.niveau as NiveauCompetence,
            description: c.description,
          })))
        }
        // compétences chargées

        if (projectData) {
          setProject(projectData)

          const chefId = projectData.groupeEquipe?.chefEquipeId || projectData.groupeEquipe?.chefEquipe?.id || null
          setChefEquipeId(chefId)

          setFormData({
            nom: projectData.nom || '',
            description: projectData.description || '',
            clientId: projectData.client?.id?.toString() || '',
            lieu: projectData.lieu || '',
            dateDebut: projectData.dateDebut?.split('T')[0] || '',
            dateFinPrevue: projectData.dateFinPrevue?.split('T')[0] || '',
            budgetEstime: projectData.budgetEstime?.toString() || '',
            budgetReel: projectData.budgetReel?.toString() || '',
            typeProjet: projectData.typeProjet || (projectTypes.length > 0 ? projectTypes[0].value : 'Développement Web'),
            statut: projectData.statut || 'Planifié',
          })

          const projId = projectData.id || projectId
          if (projId) {
            checkCdcExists(parseInt(projId)).then(exists => {
              setCdcExists(exists)
              if (exists) setCdcUrl(`/api/Projets/${projId}/cdc/download`)
            }).catch(() => {})
          }

          interface ApiPhase {
            id?: number; typePhase: string; pourcentageBudget?: number; statut?: string
            taches?: Array<{
              id?: number; titre: string; dateDebutPrevue?: string; dateFinPrevue?: string
              statut?: string; responsable?: { id: number }; testeur?: { id: number }
              competencesRequises?: string[]
              sousTaches?: Array<{ id?: number; titre: string; dureeEstimeeHeures?: number; statut?: string }>
            }>
          }
          const mappedPhases = PHASE_TYPES.map(type => {
            const existing = projectData.phases?.find((p: ApiPhase) => p.typePhase === type)
            return existing
              ? {
                  id: existing.id?.toString() || genId(),
                  typePhase: existing.typePhase as TypePhase,
                  pourcentageBudget: existing.pourcentageBudget || 0,
                  statut: existing.statut || 'AFaire',
                  taches: (existing.taches || []).map((t) => ({
                    id: t.id?.toString() || genId(),
                    titre: t.titre,
                    dateDebutPrevue: t.dateDebutPrevue?.split('T')[0] || '',
                    dateFinPrevue: t.dateFinPrevue?.split('T')[0] || '',
                    statut: t.statut || 'AFaire',
                    responsableId: t.responsable?.id,
                    testeurId: t.testeur?.id,
                    competencesRequises: t.competencesRequises || [],
                    sousTaches: (t.sousTaches || []).map((st) => ({
                      id: st.id?.toString() || genId(),
                      titre: st.titre,
                      dureeEstimeeHeures: st.dureeEstimeeHeures || 0,
                      statut: st.statut || 'AFaire',
                    })),
                  })),
                }
              : { id: genId(), typePhase: type, pourcentageBudget: Math.floor(100 / PHASE_TYPES.length), statut: 'AFaire', taches: [] }
          })
          setPhases(mappedPhases)
          setExpandedPhases(mappedPhases.map(p => p.id))

          const mappedTeam = projectData.groupeEquipe?.employes?.map(mapEmployee) || []
          setTeamMembers(mappedTeam)
          for (const member of mappedTeam) {
            await loadEmployeCompetences(member.id)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setInitialLoading(false)
      }
    }
    init()
  }, [projectId, propProject, loadEmployeCompetences, projectTypes])

  useEffect(() => {
    const loadProjectHolidays = async () => {
      if (formData.dateDebut && formData.dateFinPrevue) {
        const start = new Date(formData.dateDebut), end = new Date(formData.dateFinPrevue)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) await loadHolidaysForDateRange(start, end)
      }
    }
    loadProjectHolidays()
  }, [formData.dateDebut, formData.dateFinPrevue, loadHolidaysForDateRange])

  useEffect(() => {
    if (!chefProjet) return
    setPhases(prev => prev.map(p => ({
      ...p,
      taches: p.taches.map(t => !t.testeurId ? { ...t, testeurId: chefProjet.id } : t),
    })))
  }, [chefProjet])

  // ==================== CAHIER DES CHARGES — HANDLERS ====================
  const handleUploadCdc = async () => {
    if (!cdcFile || !project?.id) return
    setIsUploadingCdc(true)
    setCdcUploadProgress(0)
    try {
      const result = await uploadCdcFile(project.id, cdcFile, (progress) => setCdcUploadProgress(progress))
      setCdcUrl(result.fileUrl)
      setCdcExists(true)
      setCdcFile(null)
      setCdcUploadProgress(0)
      alert('✅ Cahier des charges téléchargé avec succès !')
    } catch (err) {
      console.error('Erreur upload CDC:', err)
      alert("❌ Erreur lors de l'envoi du fichier. Vérifiez le format (PDF/DOCX) et réessayez.")
    } finally {
      setIsUploadingCdc(false)
    }
  }

  const handleDownloadCdc = async () => {
    if (!project?.id) return
    setIsDownloadingCdc(true)
    try {
      await downloadCdcFile(project.id)
    } catch (err) {
      console.error('Erreur download CDC:', err)
      alert("❌ Erreur lors du téléchargement du fichier.")
    } finally {
      setIsDownloadingCdc(false)
    }
  }

  const handleDeleteCdc = async () => {
    if (!project?.id) return
    if (!window.confirm('Supprimer le cahier des charges ? Cette action est irréversible.')) return
    setIsDeletingCdc(true)
    try {
      await deleteCdcFile(project.id)
      setCdcUrl(null)
      setCdcExists(false)
      setCdcFile(null)
      alert('✅ Cahier des charges supprimé.')
    } catch (err) {
      console.error('Erreur suppression CDC:', err)
      alert("❌ Erreur lors de la suppression du fichier.")
    } finally {
      setIsDeletingCdc(false)
    }
  }

  // ==================== SOUMISSION ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    setLoading(true)
    if (!validateAllTaskDates()) { setLoading(false); return }
    if (!validateAllTasksHaveSubTasks()) { setLoading(false); return }
    if (!validateAllSubTasksHaveTitle()) { setLoading(false); return }
    if (!validateAllSubTasksHaveDuration()) { setLoading(false); return }
    if (!validateAllAssignments()) { setLoading(false); return }

    try {
      const dateDebut = new Date(formData.dateDebut), dateFinPrevue = new Date(formData.dateFinPrevue)
      if (isNaN(dateDebut.getTime()) || isNaN(dateFinPrevue.getTime())) {
        alert('Vérifiez les dates du projet.'); setLoading(false); return
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
            competencesRequises: task.competencesRequises || [],
            sousTaches: task.sousTaches.map(st => ({
              titre: st.titre,
              dureeEstimeeHeures: st.dureeEstimeeHeures,
              statut: st.statut,
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
    } finally { setLoading(false) }
  }

  // ==================== ÉQUIPE ====================
  const addTeamMember = async (member: TeamMember) => {
    if (teamMembers.some(m => m.id === member.id)) { alert("Déjà dans l'équipe"); return }
    setAddingMembers(true)
    try {
      if (project?.id) await addProjectMembers(project.id, [member.id])
      setTeamMembers([...teamMembers, member])
      await loadEmployeCompetences(member.id)
      setShowTeamSelector(false)
      setSearchTerm('')
    } catch { alert("Erreur ajout membre") }
    finally { setAddingMembers(false) }
  }

  const removeTeamMember = async (id: number) => {
    const member = teamMembers.find(m => m.id === id)
    if (!member) return
    if (!window.confirm(`Retirer ${member.nomComplet} ?`)) return
    setRemovingMemberId(id)
    try {
      if (project?.id) await removeProjectMember(project.id, id)
      setTeamMembers(teamMembers.filter(m => m.id !== id))
      setEmployeCompetences(prev => { const n = new Map(prev); n.delete(id); return n })
    } catch { alert('Erreur suppression') }
    finally { setRemovingMemberId(null) }
  }

  const availableMembersFiltered = availableMembers
    .filter(e => !teamMembers.some(m => m.id === e.id))
    .filter(e =>
      e.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.specialites?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    )

  // ==================== PHASES & TÂCHES ====================
  const togglePhase = (id: string) =>
    setExpandedPhases(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleTask = (id: string) =>
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const addTask = (phaseId: string) => {
    if (!formData.dateDebut || !formData.dateFinPrevue) { alert("⚠️ Définissez d'abord les dates du projet."); return }
    const pS = new Date(formData.dateDebut), pE = new Date(formData.dateFinPrevue)
    let tE = new Date(pS)
    const dur = Math.min(8, Math.max(1, Math.floor((pE.getTime() - pS.getTime()) / 86_400_000)))
    tE.setDate(tE.getDate() + dur)
    if (tE > pE) tE = new Date(pE)
    const newTask: Tache = {
      id: genId(), titre: 'Nouvelle tâche',
      dateDebutPrevue: pS.toISOString().split('T')[0],
      dateFinPrevue: tE.toISOString().split('T')[0],
      statut: 'AFaire', responsableId: undefined, testeurId: chefProjet?.id,
      sousTaches: [{ id: genId(), titre: 'Nouvelle sous-tâche', dureeEstimeeHeures: 2, statut: 'AFaire' }],
      competencesRequises: [],
    }
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, taches: [...p.taches, newTask] } : p))
    setExpandedTasks(prev => [...prev, newTask.id])
  }

  const updateTask = (phaseId: string, taskId: string, field: string, value: unknown) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p
      return {
        ...p,
        taches: p.taches.map(t => {
          if (t.id !== taskId) return t
          const updated: Tache = { ...t, [field]: value }
          if (field === 'dateDebutPrevue' || field === 'dateFinPrevue') {
            const nS = field === 'dateDebutPrevue' ? value : t.dateDebutPrevue
            const nE = field === 'dateFinPrevue' ? value : t.dateFinPrevue
            if (nS && nE && !validateTaskDates(nS, nE)) return t
          }
          if (field === 'responsableId' && value) {
            const c = getAssignmentConflict(value, updated, taskId)
            if (c.hasConflict) {
              alert(`⛔ RESPONSABLE "${getMemberName(value)}" dépasserait ${MAX_HOURS_PER_DAY}h/jour.\n${c.message}\n${c.suggestedAction ? '\n💡 ' + c.suggestedAction : ''}\n\n↩️ Assignation refusée.`)
              return t
            }
          }
          return updated
        }),
      }
    }))
  }

  const deleteTask = (phaseId: string, taskId: string) => {
    const task = phases.find(p => p.id === phaseId)?.taches.find(t => t.id === taskId)
    if (!window.confirm(task?.sousTaches?.length ? `Supprimer cette tâche et ses ${task.sousTaches.length} sous-tâche(s) ?` : 'Supprimer cette tâche ?')) return
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, taches: p.taches.filter(t => t.id !== taskId) } : p))
  }

  const addSubTask = (phaseId: string, taskId: string) => {
    const st: SousTache = { id: genId(), titre: 'Nouvelle sous-tâche', dureeEstimeeHeures: 2, statut: 'AFaire' }
    setPhases(prev => prev.map(p => p.id === phaseId
      ? { ...p, taches: p.taches.map(t => t.id === taskId ? { ...t, sousTaches: [...t.sousTaches, st] } : t) }
      : p
    ))
  }

  const updateSubTask = (phaseId: string, taskId: string, stId: string, field: string, value: unknown) => {
    setPhases(prev => prev.map(p => p.id === phaseId
      ? { ...p, taches: p.taches.map(t => t.id === taskId ? { ...t, sousTaches: t.sousTaches.map(s => s.id === stId ? { ...s, [field]: value } : s) } : t) }
      : p
    ))
  }

  const deleteSubTask = (phaseId: string, taskId: string, stId: string) => {
    const task = phases.find(p => p.id === phaseId)?.taches.find(t => t.id === taskId)
    if (task && task.sousTaches.length <= 1) { alert('⚠️ Impossible de supprimer la dernière sous-tâche.'); return }
    if (window.confirm('Supprimer cette sous-tâche ?'))
      setPhases(prev => prev.map(p => p.id === phaseId
        ? { ...p, taches: p.taches.map(t => t.id === taskId ? { ...t, sousTaches: t.sousTaches.filter(s => s.id !== stId) } : t) }
        : p
      ))
  }

  // ==================== AI PLANNING ====================
  const applyAIPlanning = (aiPhases: PhaseGeneree[]) => {
    if (!aiPhases || !Array.isArray(aiPhases) || aiPhases.length === 0) { alert('Erreur : aucune phase générée.'); return }

    const PHASE_MAP: Record<string, TypePhase> = {
      'analyse': 'Analyse', 'conception': 'Conception', 'design': 'Conception',
      'planification': 'Analyse', 'développement': 'MiseEnOeuvre', 'developpement': 'MiseEnOeuvre',
      'implementation': 'MiseEnOeuvre', 'implémentation': 'MiseEnOeuvre', 'coding': 'MiseEnOeuvre',
      'réalisation': 'MiseEnOeuvre', 'realisation': 'MiseEnOeuvre',
      'test': 'Validation', 'validation': 'Validation', 'recette': 'Validation',
      'qualité': 'Validation', 'lancement': 'MiseEnService',
      'déploiement': 'MiseEnService', 'deploiement': 'MiseEnService',
      'mise en service': 'MiseEnService', 'livraison': 'MiseEnService', 'production': 'MiseEnService',
    }

    const resolvePhaseType = (nomIA: string): TypePhase => {
      const lower = nomIA.toLowerCase()
      for (const [keyword, type] of Object.entries(PHASE_MAP)) { if (lower.includes(keyword)) return type }
      return 'MiseEnOeuvre'
    }

    const tachesParPhase = new Map<TypePhase, typeof aiPhases[0]['taches']>()
    PHASE_TYPES.forEach(t => tachesParPhase.set(t, []))
    aiPhases.forEach(aiPhase => {
      if (!aiPhase?.taches) return
      const type = resolvePhaseType(aiPhase.typePhase)
      const existing = tachesParPhase.get(type) ?? []
      tachesParPhase.set(type, [...existing, ...aiPhase.taches])
    })

    const newPhases: Phase[] = PHASE_TYPES.map(type => {
      const existingPhase = phases.find(p => p.typePhase === type)
      const aiTaches = tachesParPhase.get(type) ?? []
      const aiPhaseMatch = aiPhases.find(ap => resolvePhaseType(ap.typePhase) === type)
      const pct = aiPhaseMatch?.pourcentageBudget ?? existingPhase?.pourcentageBudget ?? Math.floor(100 / PHASE_TYPES.length)
      const taches = aiTaches.map(aiTask => {
        if (!aiTask) return null
        return {
          id: genId(), titre: aiTask.titre || 'Tâche sans titre',
          dateDebutPrevue: aiTask.dateDebutPrevue || formData.dateDebut,
          dateFinPrevue: aiTask.dateFinPrevue || formData.dateFinPrevue,
          statut: 'AFaire', responsableId: aiTask.responsableId ?? undefined,
          testeurId: chefProjet?.id ?? aiTask.testeurId ?? undefined,
          competencesRequises: aiTask.competencesRequises || [],
          sousTaches: (aiTask.sousTaches || []).map(st => ({ id: genId(), titre: st.titre || 'Sous-tâche', dureeEstimeeHeures: st.dureeEstimeeHeures || 1, statut: 'AFaire' })),
        }
      }).filter(Boolean) as Tache[]
      return { id: existingPhase?.id || genId(), typePhase: type, pourcentageBudget: pct, statut: existingPhase?.statut || 'AFaire', taches }
    })

    setPhases(newPhases)
    setExpandedPhases(newPhases.map(p => p.id))
    setActiveTab('phases')
    const totalTaches = newPhases.reduce((acc, p) => acc + p.taches.length, 0)
    const phasesAvecTaches = newPhases.filter(p => p.taches.length > 0).length
    alert(`✅ Planning appliqué !\n\n📋 ${phasesAvecTaches}/5 phases renseignées\n📝 ${totalTaches} tâches créées\n⭐ Chef de projet désigné testeur par défaut`)
  }

  // ==================== STATS ====================
  const projectStats = useMemo(() => {
    if (!formData.dateDebut || !formData.dateFinPrevue) return null
    const start = new Date(formData.dateDebut), end = new Date(formData.dateFinPrevue)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
    let total = 0, workDays = 0, weekendDays = 0, feriesInPeriod = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d); total++
      const isWE = cur.getDay() === 0 || cur.getDay() === 6
      const isFerie = isJourFerie(cur)
      if (isWE) weekendDays++
      else if (isFerie) feriesInPeriod++
      else workDays++
    }
    return { total, workDays, weekendDays, feriesInPeriod }
  }, [formData.dateDebut, formData.dateFinPrevue, isJourFerie])

  const competenceStats = useMemo(() => {
    const allRequired = new Set<string>()
    phases.forEach(ph => ph.taches.forEach(t => (t.competencesRequises || []).forEach(c => allRequired.add(c))))
    const covered = new Set<string>()
    teamMembers.forEach(m => {
      const skills = employeCompetences.get(m.id) || m.specialites || []
      skills.forEach(s => { if (allRequired.has(s)) covered.add(s) })
    })
    const missing = [...allRequired].filter(c => !covered.has(c))
    return { totalRequired: allRequired.size, covered: covered.size, missing, coveragePct: allRequired.size === 0 ? 100 : Math.round((covered.size / allRequired.size) * 100) }
  }, [phases, teamMembers, employeCompetences])

  const reassignAllTestersToChef = () => {
    if (!chefProjet) return
    if (window.confirm(`Désigner ${chefProjet.nomComplet} comme testeur sur toutes les tâches ?`)) {
      setPhases(prev => prev.map(p => ({ ...p, taches: p.taches.map(t => ({ ...t, testeurId: chefProjet.id })) })))
    }
  }

  // ==================== MODALS ====================
  const MemberCompetenceModal = () => {
    if (!showMemberCompetenceModal || !selectedMemberForCompetence) return null
    const memberSkills = employeCompetences.get(selectedMemberForCompetence.id) || []
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-[#1d1d1b]">Compétences de {selectedMemberForCompetence.nomComplet}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Gérez les compétences de ce membre</p>
            </div>
            <button onClick={() => { setShowMemberCompetenceModal(false); setSelectedMemberForCompetence(null) }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="h-4 w-4" /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Compétences actuelles</p>
              <div className="flex flex-wrap gap-2">
                {memberSkills.length === 0 && <p className="text-xs text-gray-500">Aucune compétence assignée</p>}
                {memberSkills.map(skill => {
                  const comp = competences.find(c => c.nom === skill)
                  return (
                    <div key={skill} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5">
                      <span className={`text-xs ${comp ? NIVEAU_COLOR[comp.niveau] : 'text-gray-600'}`}>{skill}</span>
                      <button onClick={() => handleRemoveCompetenceFromMember(selectedMemberForCompetence.id, skill)}
                        className="ml-1 text-gray-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Ajouter une compétence</p>
              <div className="flex flex-wrap gap-2">
                {competences.filter(c => !memberSkills.includes(c.nom)).map(comp => (
                  <button key={comp.id} onClick={() => handleAssignCompetenceToMember(selectedMemberForCompetence.id, parseInt(comp.id))}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-all">
                    + {comp.nom}
                  </button>
                ))}
                {competences.filter(c => !memberSkills.includes(c.nom)).length === 0 && <p className="text-xs text-gray-500">Toutes les compétences sont déjà assignées</p>}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100">
            <Button type="button" className="w-full bg-[#ef7c21] hover:bg-[#d95f0c] text-white"
              onClick={() => { setShowMemberCompetenceModal(false); setSelectedMemberForCompetence(null) }}>Fermer</Button>
          </div>
        </Card>
      </div>
    )
  }

  const CompetenceModal = () => {
    if (!compModalTaskId || !compModalPhaseId) return null
    const task = phases.find(p => p.id === compModalPhaseId)?.taches.find(t => t.id === compModalTaskId)
    if (!task) return null
    const required = task.competencesRequises || []
    const sortedMembers = getMembersSortedBySkillMatch(task)
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-[#1d1d1b]">Compétences requises</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tâche : <span className="font-medium">{task.titre}</span></p>
            </div>
            <button onClick={() => { setCompModalTaskId(null); setCompModalPhaseId(null) }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="h-4 w-4" /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Sélectionner les compétences requises</p>
              <div className="space-y-4">
                {Object.entries(competences.reduce((acc, c) => { if (!acc[c.categorie]) acc[c.categorie] = []; acc[c.categorie].push(c); return acc }, {} as Record<string, Competence[]>)).map(([cat, comps]) => (
                  <div key={cat}>
                    <p className="text-xs font-medium text-gray-500 mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {comps.map(comp => {
                        const isSelected = required.includes(comp.nom)
                        return (
                          <button key={comp.id} type="button" onClick={() => toggleTaskCompetence(compModalPhaseId!, compModalTaskId!, comp.nom)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${isSelected ? 'bg-[#ef7c21] text-white border-[#ef7c21]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#ef7c21] hover:text-[#ef7c21]'}`}>
                            {isSelected && <CheckCircle className="h-3 w-3 inline mr-1" />}
                            {comp.nom}
                            <span className={`ml-1 text-[10px] ${isSelected ? 'opacity-80' : 'opacity-50'}`}>{comp.niveau[0]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {required.length > 0 && teamMembers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Compatibilité membres</p>
                <div className="space-y-2">
                  {sortedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="w-9 h-9 rounded-lg bg-[#ef7c21]/10 flex items-center justify-center text-[#ef7c21] font-bold text-sm shrink-0">
                        {m.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{m.nomComplet}</p>
                          {chefProjet && m.id === chefProjet.id && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        {m.missing.length > 0 && <p className="text-xs text-red-500 truncate">Manque : {m.missing.join(', ')}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${m.matchPct >= 80 ? 'bg-green-500' : m.matchPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${m.matchPct}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-10 text-right ${m.matchPct >= 80 ? 'text-green-600' : m.matchPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{m.matchPct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Button type="button" className="w-full bg-[#ef7c21] hover:bg-[#d95f0c] text-white"
              onClick={() => { setCompModalTaskId(null); setCompModalPhaseId(null) }}>
              <CheckCircle className="h-4 w-4 mr-2" /> Confirmer
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ==================== RENDU ====================
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ef7c21]/20 border-t-[#ef7c21] rounded-full animate-spin mx-auto mb-4" />
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

  const selectedTypeIcon = getProjectTypeIcon(formData.typeProjet)
  const TypeIcon = selectedTypeIcon.icon

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <nav className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <span>Projets</span><span className="text-gray-300">/</span>
              <span className="text-[#1d1d1b] font-medium">Modification</span>
            </nav>
            <h1 className="text-3xl font-bold text-[#1d1d1b]">Modifier le projet</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline"
            className="border-purple-400 text-purple-600 hover:bg-purple-50 hover:border-purple-500 flex items-center gap-2"
            onClick={() => setShowAIModal(true)}>
            <Sparkles className="h-4 w-4" /> Générer avec IA
          </Button>
        </div>
      </div>

      {/* ── Banner période ── */}
      {projectStats && projectStats.workDays > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Calendar className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm font-medium text-gray-700">Période du projet</p>
              <p className="text-xs text-gray-500">{formatDate(formData.dateDebut)} → {formatDate(formData.dateFinPrevue)}</p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            {[{ l: 'Total', v: projectStats.total, c: 'text-gray-800' }, { l: 'Ouvrés', v: projectStats.workDays, c: 'text-green-600' }, { l: 'WE', v: projectStats.weekendDays, c: 'text-gray-500' }, { l: 'Fériés', v: projectStats.feriesInPeriod, c: 'text-orange-600' }].map(({ l, v, c }) => (
              <div key={l as string} className="flex-1"><p className={`text-xl font-bold ${c}`}>{v}</p><p className="text-xs text-gray-500">{l}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {([
            { id: 'details' as const, label: 'Détails' },
            { id: 'team' as const, label: 'Équipe' },
            { id: 'phases' as const, label: 'Phases & Tâches' },
            { id: 'competences' as const, label: 'Compétences', icon: <Zap className="h-3.5 w-3.5" />, badge: competences.length },
            { id: 'feries' as const, label: 'Jours fériés', icon: <CalendarOff className="h-3.5 w-3.5" />, badge: joursFeries.length },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${activeTab === tab.id ? 'border-b-2 border-[#ef7c21] text-[#ef7c21]' : 'border-b-2 border-transparent text-gray-500 hover:text-[#1d1d1b]'}`}>
              {tab.icon}{tab.label}
              {'badge' in tab && <span className="bg-[#ef7c21]/10 text-[#ef7c21] text-xs px-1.5 py-0.5 rounded-full font-bold">{tab.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ═══════════ ONGLET DÉTAILS ═══════════ */}
        {activeTab === 'details' && (
          <>
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">INFORMATIONS GÉNÉRALES</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Nom du projet</label>
                    <input type="text" required value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Type de projet</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <TypeIcon className="h-4 w-4 text-[#ef7c21]" />
                      </div>
                      <select 
                        value={formData.typeProjet} 
                        onChange={e => setFormData({ ...formData, typeProjet: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white"
                        disabled={loadingTypes}
                      >
                        {loadingTypes ? (
                          <option>Chargement des types...</option>
                        ) : (
                          projectTypes.map(type => (
                            <option key={type.id} value={type.value}>
                              {type.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Statut</label>
                    <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value as ProjectStatut })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                      {(['Planifié', 'En cours', 'Terminé', 'Annulé'] as ProjectStatut[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Budget estimé</label>
                    <input type="number" value={formData.budgetEstime} min="0" step="1000" required
                      onChange={e => setFormData({ ...formData, budgetEstime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                         <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Budget réel</label>
                    <input type="number" value={formData.budgetReel} min="0" step="1000" placeholder="Optionnel"
                      onChange={e => setFormData({ ...formData, budgetReel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                     <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Date de début</label>
                    <input type="date" value={formData.dateDebut} required onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Date de fin prévue</label>
                    <input type="date" value={formData.dateFinPrevue} required onChange={e => setFormData({ ...formData, dateFinPrevue: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">Lieu</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" value={formData.lieu} onChange={e => setFormData({ ...formData, lieu: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                    </div>
                  </div>
                 
           
               
                 
                </div>
              </div>
            </Card>

            {/* ── Cahier des charges ── */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#ef7c21]" /> CAHIER DES CHARGES
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Document utilisé par l'IA pour la génération du planning (PDF ou DOCX)</p>
                  </div>
                  {cdcExists && (
                    <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Fichier attaché
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                {cdcExists ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-800">Cahier des charges attaché</p>
                          <p className="text-xs text-green-600">Document disponible pour la génération IA</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handleDownloadCdc} disabled={isDownloadingCdc}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-xs hover:bg-green-50 transition-all font-medium disabled:opacity-50">
                          {isDownloadingCdc ? <><RefreshCw className="h-3 w-3 animate-spin" /> Téléchargement...</> : <><Download className="h-3 w-3" /> Télécharger</>}
                        </button>
                        <label className="cursor-pointer px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-all font-medium inline-flex items-center gap-1.5">
                          <Upload className="h-3 w-3" /> Remplacer
                          <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setCdcFile(e.target.files?.[0] || null)} />
                        </label>
                        <button type="button" onClick={handleDeleteCdc} disabled={isDeletingCdc}
                          className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-all font-medium inline-flex items-center gap-1.5 disabled:opacity-50">
                          {isDeletingCdc ? <><RefreshCw className="h-3 w-3 animate-spin" /> Suppression...</> : <><Trash2 className="h-3 w-3" /> Supprimer</>}
                        </button>
                      </div>
                    </div>

                    {cdcFile && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-sm font-medium text-orange-800 mb-3">Remplacer le fichier actuel par :</p>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border flex-1">
                            <FileText className="h-4 w-4 text-[#ef7c21]" />
                            <span className="text-sm text-gray-700 truncate">{cdcFile.name}</span>
                            <span className="text-xs text-gray-400">({(cdcFile.size / 1024 / 1024).toFixed(2)} Mo)</span>
                          </div>
                          <button type="button" onClick={() => setCdcFile(null)} className="p-2 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                        </div>
                        {isUploadingCdc && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-orange-700 mb-1">
                              <span>Envoi en cours...</span><span>{cdcUploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-600 rounded-full transition-all duration-300" style={{ width: `${cdcUploadProgress}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={handleUploadCdc} disabled={isUploadingCdc}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700 disabled:opacity-50 transition-all font-medium inline-flex items-center gap-1.5">
                            {isUploadingCdc ? <><RefreshCw className="h-3 w-3 animate-spin" /> Envoi...</> : <><Save className="h-3 w-3" /> Confirmer le remplacement</>}
                          </button>
                          <button type="button" onClick={() => setCdcFile(null)} disabled={isUploadingCdc}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-all font-medium disabled:opacity-50">Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!cdcFile ? (
                      <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#ef7c21]/50 transition-colors">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">Aucun cahier des charges n'est encore rattaché à ce projet.</p>
                        <p className="text-xs text-gray-400 mb-4">Formats acceptés : PDF, DOCX</p>
                        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#ef7c21] text-white rounded-xl text-sm hover:bg-[#d95f0c] transition-all font-medium shadow-sm">
                          <Upload className="h-4 w-4" /> Ajouter un fichier
                          <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setCdcFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-sm font-medium text-orange-800 mb-3">Fichier sélectionné :</p>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border flex-1">
                            <FileText className="h-4 w-4 text-[#ef7c21]" />
                            <span className="text-sm text-gray-700 truncate">{cdcFile.name}</span>
                            <span className="text-xs text-gray-400">({(cdcFile.size / 1024 / 1024).toFixed(2)} Mo)</span>
                          </div>
                          <button type="button" onClick={() => setCdcFile(null)} className="p-2 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                        </div>
                        {isUploadingCdc && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-orange-700 mb-1"><span>Envoi en cours...</span><span>{cdcUploadProgress}%</span></div>
                            <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-600 rounded-full transition-all duration-300" style={{ width: `${cdcUploadProgress}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={handleUploadCdc} disabled={isUploadingCdc}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 disabled:opacity-50 transition-all font-medium inline-flex items-center gap-2">
                            {isUploadingCdc ? <><RefreshCw className="h-4 w-4 animate-spin" /> Envoi en cours...</> : <><Save className="h-4 w-4" /> Envoyer le fichier</>}
                          </button>
                          <button type="button" onClick={() => setCdcFile(null)} disabled={isUploadingCdc}
                            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-all font-medium disabled:opacity-50">Annuler</button>
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div><p className="font-medium">Pourquoi ajouter un cahier des charges ?</p><p className="text-yellow-600">L'IA l'utilisera pour générer un planning réaliste avec des tâches adaptées à votre projet.</p></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* ═══════════ ONGLET COMPÉTENCES ═══════════ */}
        {activeTab === 'competences' && (
          <div className="space-y-4">
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-[#ef7c21]" /> RÉFÉRENTIEL DE COMPÉTENCES</h3>
                  <p className="text-xs text-gray-500 mt-1">Définissez les compétences du projet, puis assignez-les aux tâches.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddComp(!showAddComp)}
                  className="text-xs border-[#ef7c21] text-[#ef7c21] hover:bg-[#ef7c21] hover:text-white">
                  <Plus className="h-3 w-3 mr-1" /> Ajouter
                </Button>
              </div>
              <div className="p-6 space-y-4">
                {showAddComp && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                    <h4 className="text-sm font-semibold">Nouvelle compétence</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Nom</label>
                        <input type="text" placeholder="Ex: Vue.js, PostgreSQL…" value={newComp.nom} onChange={e => setNewComp({ ...newComp, nom: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Catégorie</label>
                        <select value={newComp.categorie} onChange={e => setNewComp({ ...newComp, categorie: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                          {CATEGORIES_COMPETENCES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Niveau requis</label>
                        <select value={newComp.niveau} onChange={e => setNewComp({ ...newComp, niveau: e.target.value as NiveauCompetence })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21] bg-white">
                          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" className="bg-[#ef7c21] hover:bg-[#d95f0c] text-white" onClick={addCompetence}><Plus className="h-3 w-3 mr-1" /> Ajouter</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowAddComp(false); setNewComp({ nom: '', categorie: CATEGORIES_COMPETENCES[0], niveau: 'Intermédiaire', description: '' }) }}>Annuler</Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">Filtrer :</span>
                  {['all', ...CATEGORIES_COMPETENCES].map(cat => (
                    <button key={cat} type="button" onClick={() => setFilterCategorie(cat)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${filterCategorie === cat ? 'bg-[#ef7c21] text-white border-[#ef7c21]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#ef7c21]'}`}>
                      {cat === 'all' ? 'Toutes' : cat}
                    </button>
                  ))}
                </div>
                {Object.entries(competencesParCategorie).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Aucune compétence configurée</p>
                  </div>
                ) : (
                  Object.entries(competencesParCategorie).map(([cat, comps]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag className="h-3 w-3" /> {cat}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {comps.map(comp => {
                          const usedInTasks = phases.reduce((acc, ph) => acc + ph.taches.filter(t => (t.competencesRequises || []).includes(comp.nom)).length, 0)
                          const membersWithComp = teamMembers.filter(m => (employeCompetences.get(m.id) || []).some(s => s.toLowerCase() === comp.nom.toLowerCase())).length
                          return (
                            <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 group hover:border-[#ef7c21]/30 hover:bg-orange-50/20 transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-800">{comp.nom}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NIVEAU_COLOR[comp.niveau]}`}>{comp.niveau}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-0.5"><CheckCircle className="h-3 w-3" /> {usedInTasks} tâche(s)</span>
                                  <span className="flex items-center gap-0.5"><User className="h-3 w-3" /> {membersWithComp} membre(s)</span>
                                </div>
                              </div>
                              <button type="button" onClick={() => removeCompetence(comp.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {competenceStats.totalRequired > 0 && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Award className="h-4 w-4 text-[#ef7c21]" /> Couverture des compétences</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${competenceStats.coveragePct >= 80 ? 'bg-green-100 text-green-700' : competenceStats.coveragePct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{competenceStats.coveragePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all ${competenceStats.coveragePct >= 80 ? 'bg-green-500' : competenceStats.coveragePct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${competenceStats.coveragePct}%` }} />
                  </div>
                  {competenceStats.missing.length > 0 && <div className="text-xs text-red-600"><span className="font-medium">Compétences non couvertes :</span> {competenceStats.missing.join(', ')}</div>}
                </div>
              </Card>
            )}

            {teamMembers.length > 0 && competences.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart2 className="h-5 w-5 text-[#ef7c21]" /> MATRICE MEMBRES × COMPÉTENCES</h3>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 pr-4 text-gray-600 font-semibold border-b border-gray-200 whitespace-nowrap">Membre</th>
                        {competences.slice(0, 12).map(c => (
                          <th key={c.id} className="p-2 text-gray-600 font-medium border-b border-gray-200 text-center whitespace-nowrap max-w-[80px]">
                            <div className="truncate max-w-[70px]" title={c.nom}>{c.nom}</div>
                          </th>
                        ))}
                        {competences.length > 12 && <th className="p-2 text-gray-400 border-b border-gray-200 text-center">+{competences.length - 12}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m, mi) => {
                        const ms = (employeCompetences.get(m.id) || []).map(s => s.toLowerCase())
                        const mc = competences.filter(c => ms.includes(c.nom.toLowerCase())).length
                        const ic = chefProjet && m.id === chefProjet.id
                        return (
                          <tr key={m.id} className={`${mi % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} ${ic ? 'bg-yellow-50/60' : ''}`}>
                            <td className="p-2 pr-4 font-medium text-gray-800 whitespace-nowrap border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ic ? 'bg-yellow-100 text-yellow-700' : 'bg-[#ef7c21]/10 text-[#ef7c21]'}`}>
                                  {m.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <span className="truncate max-w-[120px]">{m.nomComplet}</span>
                                {ic && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                                <span className="text-gray-400 text-xs">({mc}/{Math.min(competences.length, 12)})</span>
                              </div>
                            </td>
                            {competences.slice(0, 12).map(c => (
                              <td key={c.id} className="p-2 text-center border-b border-gray-100">
                                {ms.includes(c.nom.toLowerCase()) ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <span className="text-gray-300 text-base">—</span>}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card >
            )}
          </div>
        )}

        {/* ═══════════ ONGLET JOURS FÉRIÉS ═══════════ */}
        {activeTab === 'feries' && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><CalendarOff className="h-5 w-5 text-[#ef7c21]" /> JOURS FÉRIÉS EN TUNISIE</h3>
                  <p className="text-xs text-gray-500 mt-1">Données officielles • Source: Nager.Date</p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={holidayYear} onChange={e => { setHolidayYear(parseInt(e.target.value)); loadHolidaysFromAPI(parseInt(e.target.value)) }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]">
                    {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button type="button" onClick={() => loadHolidaysFromAPI(holidayYear)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" disabled={isLoadingHolidays}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingHolidays ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {isLoadingHolidays ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 text-[#ef7c21] animate-spin" /></div>
              ) : holidayError ? (
                <div className="text-center py-12 border-2 border-red-200 bg-red-50 rounded-xl">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" /><p className="text-red-600 text-sm">{holidayError}</p>
                  <button type="button" onClick={() => loadHolidaysFromAPI(holidayYear)} className="mt-3 text-xs text-[#ef7c21] hover:underline">Réessayer</button>
                </div>
              ) : joursFeriesSorted.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <CalendarOff className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Aucun jour férié trouvé pour {holidayYear}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(holidaysByMonth).map(([month, holidays]) => (
                    <div key={month}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 capitalize flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-[#ef7c21]" />{month}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {holidays.map(jf => {
                          const d = new Date(jf.date)
                          return (
                            <div key={jf.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ef7c21]/30 transition-all">
                              <div className="w-12 h-12 rounded-lg bg-[#ef7c21]/10 flex flex-col items-center justify-center shrink-0">
                                <span className="text-lg font-bold text-[#ef7c21]">{String(d.getDate()).padStart(2, '0')}</span>
                                <span className="text-[10px] text-[#ef7c21]/70 uppercase">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-800">{jf.nom}</span>
                                  {jf.recurrent && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">🔁 Récurrent</span>}
                                </div>
                                <p className="text-xs text-gray-500 capitalize">{d.toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">📌 Comment les jours fériés sont pris en compte :</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                    <li>Exclus du calcul de charge Responsable (limite {MAX_HOURS_PER_DAY}h/jour)</li>
                    <li>Les week-ends sont également exclus</li>
                    <li>Les jours récurrents s'appliquent chaque année</li>
                    <li>Le rôle Testeur n'est pas affecté par ces exclusions</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ═══════════ ONGLET ÉQUIPE ═══════════ */}
        {activeTab === 'team' && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">COMPOSITION DE L'ÉQUIPE</h3>
                <p className="text-xs text-gray-500 mt-1">{teamMembers.length} membre(s)</p>
              </div>
              <div className="flex items-center gap-2">
                {chefProjet && (
                  <Button type="button" variant="outline" size="sm" onClick={reassignAllTestersToChef}
                    className="text-xs border-yellow-400 text-yellow-600 hover:bg-yellow-50"><Star className="h-3 w-3 mr-1" /> Testeur → Chef</Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTeamSelector(!showTeamSelector)}
                  className="text-xs border-[#ef7c21] text-[#ef7c21] hover:bg-[#ef7c21] hover:text-white" disabled={addingMembers}>
                  {addingMembers ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <UserPlus className="h-3 w-3 mr-1" />} Ajouter
                </Button>
              </div>
            </div>
            <div className="p-6">
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {teamMembers.map(member => {
                    const isRemoving = removingMemberId === member.id
                    const memberSkills = employeCompetences.get(member.id) || []
                    const isChef = chefProjet && member.id === chefProjet.id
                    return (
                      <div key={member.id} className={`flex items-start justify-between p-4 rounded-xl border hover:shadow-md transition-all group ${isChef ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'}`}>
                        <div className="flex items-start gap-3 flex-1">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg ${isChef ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 'bg-gradient-to-br from-[#ef7c21]/20 to-[#ef7c21]/10 text-[#ef7c21]'}`}>
                              {member.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            {isChef && <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-[#1d1d1b]">{member.nomComplet}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isChef ? 'bg-yellow-100 text-yellow-700' : 'bg-[#ef7c21]/10 text-[#ef7c21]'}`}>{member.role}</span>
                              {isChef && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Testeur par défaut</span>}
                            </div>
                            {member.email && <div className="flex items-center gap-1 mt-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{member.email}</div>}
                            {memberSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {memberSkills.slice(0, 4).map((spec, idx) => {
                                  const inRef = competences.some(c => c.nom.toLowerCase() === spec.toLowerCase())
                                  return <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${inRef ? 'bg-[#ef7c21]/10 text-[#ef7c21]' : 'bg-gray-100 text-gray-600'}`}>{spec}</span>
                                })}
                                {memberSkills.length > 4 && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{memberSkills.length - 4}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => { setSelectedMemberForCompetence(member); setShowMemberCompetenceModal(true) }}
                            className="p-2 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100" title="Gérer les compétences"><Zap className="h-4 w-4" /></button>
                          <button type="button" onClick={() => removeTeamMember(member.id)} disabled={isRemoving}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                            {isRemoving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Aucun membre dans l'équipe</h4>
                  <Button type="button" variant="outline" onClick={() => setShowTeamSelector(true)} className="border-[#ef7c21] text-[#ef7c21]">
                    <UserPlus className="h-4 w-4 mr-2" /> Ajouter un membre
                  </Button>
                </div>
              )}

              {showTeamSelector && (
                <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-[#1d1d1b]">Ajouter des membres</h4>
                      <button onClick={() => setShowTeamSelector(false)} className="p-1 hover:bg-gray-200 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Rechercher…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]" />
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {availableMembersFiltered.length > 0 ? (
                      availableMembersFiltered.map(emp => {
                        const isExpectedChef = chefEquipeId && emp.id === chefEquipeId
                        return (
                          <div key={emp.id} onClick={() => addTeamMember(emp)} className={`flex items-start gap-4 p-4 cursor-pointer group ${isExpectedChef ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0 ${isExpectedChef ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600 group-hover:bg-[#ef7c21]/10 group-hover:text-[#ef7c21]'}`}>
                              {emp.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{emp.nomComplet}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isExpectedChef ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}>{emp.role}</span>
                                {isExpectedChef && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> Chef</span>}
                              </div>
                              {emp.specialites && emp.specialites.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {emp.specialites.slice(0, 3).map((s, i) => <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full ${competences.some(c => c.nom.toLowerCase() === s.toLowerCase()) ? 'bg-[#ef7c21]/10 text-[#ef7c21]' : 'bg-gray-100 text-gray-500'}`}>{s}</span>)}
                                </div>
                              )}
                            </div>
                            <Plus className={`h-5 w-5 shrink-0 ${isExpectedChef ? 'text-yellow-600' : 'text-gray-400 group-hover:text-[#ef7c21]'}`} />
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12"><Search className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{searchTerm ? 'Aucun résultat' : 'Aucun membre disponible'}</p></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ═══════════ ONGLET PHASES & TÂCHES ═══════════ */}
        {activeTab === 'phases' && (
          <div className="space-y-4">
            {phases.map((phase, phaseIdx) => (
              <Card key={phase.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer" onClick={() => togglePhase(phase.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ef7c21]/10 flex items-center justify-center"><span className="text-sm font-semibold text-[#ef7c21]">{phaseIdx + 1}</span></div>
                    <h3 className="font-semibold">{phase.typePhase}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{phase.taches.length} tâche(s)</span>
                    {expandedPhases.includes(phase.id) ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {expandedPhases.includes(phase.id) && (
                  <div className="p-6 space-y-4">
                    {phase.taches.map(task => {
                      const respConflict = task.responsableId ? getAssignmentConflict(task.responsableId, task, task.id) : { hasConflict: false, conflictingDates: [], message: '' }
                      const hasRespConflict = respConflict.hasConflict
                      const remainingHours = getRemainingTaskHours(task)
                      const validatedCount = getValidatedSubTasksCount(task)
                      const isFullyValidated = isTaskFullyValidated(task)
                      const hasNoSubTasks = task.sousTaches.length === 0
                      const feriesInTask = task.dateDebutPrevue && task.dateFinPrevue ? getFeriesInRange(new Date(task.dateDebutPrevue), new Date(task.dateFinPrevue)) : []
                      const workDaysInTask = task.dateDebutPrevue && task.dateFinPrevue ? countWorkDays(new Date(task.dateDebutPrevue), new Date(task.dateFinPrevue)) : 0
                      const dailyContribution = getTaskDailyContribution(task)
                      const required = task.competencesRequises || []
                      const sortedForTask = getMembersSortedBySkillMatch(task)
                      const bestMatch = sortedForTask[0]

                      return (
                        <div key={task.id} className={`border rounded-xl overflow-hidden transition-all ${hasRespConflict ? 'border-red-300 bg-red-50/30' : hasNoSubTasks ? 'border-yellow-300 bg-yellow-50/30' : isFullyValidated ? 'border-green-200 bg-green-50/20' : 'border-gray-100'}`}>
                          <div className="p-4 bg-gray-50/50 cursor-pointer" onClick={() => toggleTask(task.id)}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <input type="text" value={task.titre} onChange={e => updateTask(phase.id, task.id, 'titre', e.target.value)} onClick={e => e.stopPropagation()}
                                  className="w-full px-2 py-1 border border-transparent hover:border-gray-300 rounded-lg bg-transparent font-medium focus:outline-none focus:border-[#ef7c21]" placeholder="Titre de la tâche" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2 flex-wrap">
                                  {hasNoSubTasks && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Aucune sous-tâche</span>}
                                  {remainingHours === 0 && task.sousTaches.length > 0 && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Complétée</span>}
                                  {remainingHours > 0 && task.sousTaches.length > 0 && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">{remainingHours}h restantes</span>}
                                  {task.sousTaches.length > 0 && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{validatedCount}/{task.sousTaches.length} validées</span>}
                                  {workDaysInTask > 0 && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">📅 {workDaysInTask}j ouvrés</span>}
                                  {dailyContribution > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${dailyContribution <= MAX_HOURS_PER_DAY ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{dailyContribution.toFixed(1)}h/j</span>}
                                  {feriesInTask.length > 0 && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">🎌 {feriesInTask.length} férié(s)</span>}
                                  <button type="button" onClick={e => { e.stopPropagation(); setCompModalPhaseId(phase.id); setCompModalTaskId(task.id) }}
                                    className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all hover:ring-2 hover:ring-[#ef7c21] ${required.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'}`}>
                                    <Zap className="h-3 w-3" /> {required.length > 0 ? `${required.length} comp.` : '+ Comp.'}
                                  </button>
                                </div>
                                <button type="button" onClick={e => { e.stopPropagation(); deleteTask(phase.id, task.id) }} className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                {expandedTasks.includes(task.id) ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                              </div>
                            </div>

                            {required.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {required.map(r => { const comp = competences.find(c => c.nom === r); return <span key={r} className={`text-xs px-2 py-0.5 rounded-full ${comp ? NIVEAU_COLOR[comp.niveau] : 'bg-gray-100 text-gray-600'}`}>{r}</span> })}
                              </div>
                            )}

                            {required.length > 0 && !task.responsableId && bestMatch && bestMatch.matchPct > 0 && (
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                                <Star className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span>Meilleur candidat : <strong>{bestMatch.nomComplet}</strong> ({bestMatch.matchPct}% correspondance)</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[#ef7c21] shrink-0" />
                                <select value={task.responsableId || ''} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateTask(phase.id, task.id, 'responsableId', e.target.value ? parseInt(e.target.value) : undefined) }}
                                  className={`flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ef7c21] ${hasRespConflict ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                                  <option value="">Choisir un responsable</option>
                                  {sortedForTask.map(m => {
                                    const hyp: Tache = { ...task, responsableId: m.id }
                                    const c = getAssignmentConflict(m.id, hyp, task.id)
                                    const matchLabel = required.length > 0 ? ` (${m.matchPct}%)` : ''
                                    return <option key={m.id} value={m.id} disabled={c.hasConflict}>{m.nomComplet}{matchLabel}{c.hasConflict ? ` ⛔ ${MAX_HOURS_PER_DAY}h/j` : ''}</option>
                                  })}
                                </select>
                                {hasRespConflict && <span className="text-xs text-red-500 whitespace-nowrap">⛔</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                <select value={task.testeurId || ''} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateTask(phase.id, task.id, 'testeurId', e.target.value ? parseInt(e.target.value) : undefined) }}
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ef7c21]">
                                  <option value="">Aucun testeur</option>
                                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.nomComplet}</option>)}
                                </select>
                                {chefProjet && task.testeurId !== chefProjet.id && (
                                  <button type="button" onClick={e => { e.stopPropagation(); updateTask(phase.id, task.id, 'testeurId', chefProjet.id) }}
                                    className="text-xs text-[#ef7c21] hover:underline whitespace-nowrap shrink-0" title="Désigner le chef comme testeur">
                                    <Star className="h-3 w-3 inline mr-1" />Chef
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <input type="date" value={task.dateDebutPrevue} min={formData.dateDebut} max={formData.dateFinPrevue} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateTask(phase.id, task.id, 'dateDebutPrevue', e.target.value) }} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white" />
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <input type="date" value={task.dateFinPrevue} min={formData.dateDebut} max={formData.dateFinPrevue} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateTask(phase.id, task.id, 'dateFinPrevue', e.target.value) }} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white" />
                              </div>
                            </div>

                            {hasNoSubTasks && <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Au moins une sous-tâche est requise</div>}
                            {feriesInTask.length > 0 && <div className="mt-2 text-xs text-orange-600 flex items-center gap-1"><CalendarOff className="h-3 w-3" /> {feriesInTask.length} férié(s) : {feriesInTask.map(f => f.nom).join(', ')}</div>}
                            {dailyContribution > MAX_HOURS_PER_DAY && <div className="mt-2 text-xs text-red-600 flex items-center gap-1"><Clock className="h-3 w-3" /> Charge {dailyContribution.toFixed(1)}h/j &gt; {MAX_HOURS_PER_DAY}h</div>}

                            <div className="flex flex-col gap-1 mt-2 text-xs">
                              {task.responsableId && hasRespConflict && (
                                <div className="flex items-start gap-1 text-red-600 font-medium bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                                  <User className="h-3 w-3 shrink-0 mt-0.5" /><span>Responsable : {getMemberName(task.responsableId)} — ⚠️ {respConflict.message}</span>
                                </div>
                              )}
                              {task.responsableId && !hasRespConflict && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <User className="h-3 w-3" /> Responsable : {getMemberName(task.responsableId)}
                                  {required.length > 0 && (() => { const m = teamMembers.find(m => m.id === task.responsableId); return m ? <span className={`ml-1 px-1.5 py-0.5 rounded-full ${getMemberSkillMatch(m, task) >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{getMemberSkillMatch(m, task)}% comp.</span> : null })()}
                                </div>
                              )}
                              {task.testeurId && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <CheckCircle className="h-3 w-3" /><span>Testeur : </span><span className="font-medium">{getMemberName(task.testeurId)}</span>
                                  {chefProjet && task.testeurId === chefProjet.id && <><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /><span className="text-gray-400">(par défaut)</span></>}
                                </div>
                              )}
                              {!chefProjet && !task.testeurId && <div className="flex items-center gap-1 text-orange-500"><AlertCircle className="h-3 w-3" /><span>Aucun testeur (ajoutez un chef)</span></div>}
                            </div>
                          </div>

                          {expandedTasks.includes(task.id) && (
                            <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-500">Sous-tâches</span>
                                <button type="button" onClick={() => setShowValidatedSubtasks(!showValidatedSubtasks)} className="text-xs text-gray-400 hover:text-[#ef7c21] flex items-center gap-1">
                                  {showValidatedSubtasks ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  {showValidatedSubtasks ? 'Masquer validées' : 'Afficher validées'}
                                </button>
                              </div>
                              {task.sousTaches.filter(st => showValidatedSubtasks || !isSubTaskValidated(st.statut)).map(st => {
                                const isValidated = isSubTaskValidated(st.statut)
                                return (
                                  <div key={st.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg group ${isValidated ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                    <div className="flex-1 flex items-center gap-2">
                                      <div className={`w-1 h-6 rounded-full ${isValidated ? 'bg-green-500' : 'bg-[#ef7c21]'}`} />
                                      <input type="text" value={st.titre} onChange={e => updateSubTask(phase.id, task.id, st.id, 'titre', e.target.value)}
                                        className={`flex-1 px-2 py-1 border rounded-lg text-sm bg-transparent focus:outline-none focus:border-[#ef7c21] ${isValidated ? 'border-green-200 text-gray-500 line-through' : 'border-transparent hover:border-gray-300'}`}
                                        placeholder="Sous-tâche" disabled={isValidated} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input type="number" value={st.dureeEstimeeHeures} min="1" onChange={e => updateSubTask(phase.id, task.id, st.id, 'dureeEstimeeHeures', parseInt(e.target.value) || 0)}
                                        className={`w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs ${isValidated ? 'bg-gray-100 text-gray-400' : 'bg-white'}`} disabled={isValidated} />
                                      <span className="text-xs text-gray-500">h</span>
                                      <select value={st.statut} onChange={e => updateSubTask(phase.id, task.id, st.id, 'statut', e.target.value)}
                                        className={`px-2 py-1 border border-gray-200 rounded-lg text-xs ${isValidated ? 'bg-green-50 text-green-700 font-medium' : 'bg-white'}`}>
                                        <option value="AFaire">À faire</option>
                                        <option value="EnCours">En cours</option>
                                        <option value="ATester">À tester</option>
                                        <option value="Validee">✅ Validée</option>
                                        <option value="Rejetee">Rejetée</option>
                                      </select>
                                      {!isValidated && (
                                        <button type="button" onClick={() => deleteSubTask(phase.id, task.id, st.id)}
                                          className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                                      )}
                                      {isValidated && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                  </div>
                                )
                              })}
                              <button type="button" onClick={() => addSubTask(phase.id, task.id)}
                                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-colors flex items-center justify-center gap-1">
                                <Plus className="h-3 w-3" /> Ajouter une sous-tâche
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button type="button" onClick={() => addTask(phase.id)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-colors flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Ajouter une tâche
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Boutons de soumission ── */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <X className="h-4 w-4 mr-2" /> Annuler
          </Button>
          <Button type="submit" disabled={loading}
            className="bg-gradient-to-r from-[#ef7c21] to-[#ff9f4b] text-white hover:from-[#d95f0c] hover:to-[#ef7c21]">
            <Save className="h-4 w-4 mr-2" /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>

      {/* ── Modals ── */}
      <AIPlanningModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApply={applyAIPlanning}
        input={{
          projetNom: formData.nom,
          projetDescription: formData.description,
          typeProjet: formData.typeProjet,
          dateDebut: formData.dateDebut,
          dateFinPrevue: formData.dateFinPrevue,
          budgetEstime: parseFloat(formData.budgetEstime) || 0,
          equipeDisponible: teamMembers.map(m => ({
            id: m.id,
            nom: m.nomComplet,
            competences: employeCompetences.get(m.id) || m.specialites || [],
          })),
          joursFeries: joursFeries.map(jf => jf.date),
          projetId: project?.id,
          model: 'llama-3.1-8b-instant',
        }}
      />

      <MemberCompetenceModal />
      <CompetenceModal />
    </div>
  )
}

export default EditProjectView

