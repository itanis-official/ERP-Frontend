// services/aiPlanningService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5101'

// ─── Types ────────────────────────────────────────────────────────────────

export interface MembreEquipe {
  id: number
  nom: string
  competences: string[]
}

export interface GeneratePlanningInput {
  projetNom: string
  projetDescription?: string
  typeProjet: string
  dateDebut: string
  dateFinPrevue: string
  budgetEstime: number
  equipeDisponible?: MembreEquipe[]
  joursFeries?: string[]
  projetId?: number
  model?: string
}

export interface SousTacheGeneree {
  titre: string
  description?: string
  dureeEstimeeHeures: number
  statut?: string
}

export interface TacheGeneree {
  titre: string
  description?: string
  dateDebutPrevue: string
  dateFinPrevue: string
  dureeEstimeeHeures?: number
  priorite?: 'Haute' | 'Moyenne' | 'Basse'
  responsableId?: number
  responsableNom?: string
  testeurId?: number
  testeurNom?: string
  competencesRequises?: string[]
  dependances?: string[]
  sousTaches: SousTacheGeneree[]
}

export interface PhaseGeneree {
  typePhase: string
  description?: string
  pourcentageBudget: number
  taches: TacheGeneree[]
}

export interface SuggestionsIA {
  alertes?: string[]
  recommandations?: string[]
  risques?: string[]
}

export interface StatsGlobales {
  totalTaches: number
  totalSousTaches: number
  totalHeures: number
  tauxCouvertureEquipe?: number
}

export interface GeneratePlanningResponse {
  resume: string
  phases: PhaseGeneree[]
  statsGlobales: StatsGlobales
  suggestions: SuggestionsIA
}

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  speed: 'fast' | 'medium' | 'slow'
  quality: 1 | 2 | 3 | 4 | 5
  maxTokens: number
  contextWindow: number
}
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Le plus performant pour les projets complexes',
    speed: 'medium',
    quality: 5,
    maxTokens: 8192,
    contextWindow: 128000,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    description: 'Rapide et fiable',
    speed: 'fast',
    quality: 4,
    maxTokens: 8192,
    contextWindow: 128000,
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function toPascalCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  const keyMap: Record<string, string> = {
    projetNom: 'ProjetNom',
    projetDescription: 'ProjetDescription',
    typeProjet: 'TypeProjet',
    dateDebut: 'DateDebut',
    dateFinPrevue: 'DateFinPrevue',
    budgetEstime: 'BudgetEstime',
    equipeDisponible: 'EquipeDisponible',
    joursFeries: 'JoursFeries',
    projetId: 'ProjetId',
    model: 'Model',
  }

  for (const [key, value] of Object.entries(obj)) {
    const pascalKey = keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
    result[pascalKey] = value
  }
  return result
}

function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
      result[camelKey] = toCamelCase(value)
    }
    return result
  }
  return obj
}

// ─── API Calls ─────────────────────────────────────────────────────────────

export async function getAvailableModels(): Promise<AIModel[]> {
  try {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${API_BASE_URL}/api/ai/models`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`)
    }

    const data = await response.json()
    // Fusion avec les descriptions
    return data.map((m: any) => {
      const existing = AVAILABLE_MODELS.find(am => am.id === m.id)
      return {
        ...m,
        description: existing?.description || m.description,
        speed: existing?.speed || 'medium',
        quality: existing?.quality || 4,
        maxTokens: existing?.maxTokens || 8192,
        contextWindow: existing?.contextWindow || 32768,
      }
    })
  } catch (error) {
    console.error('Erreur chargement modèles:', error)
    return AVAILABLE_MODELS
  }
}

export async function generatePlanningWithAI(
  input: GeneratePlanningInput
): Promise<GeneratePlanningResponse> {
  const payload = toPascalCase({
    ...input,
    model: input.model || 'llama-3.1-8b-instant',
  } as unknown as Record<string, any>)

  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/api/ai/generate-planning`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorMessage = `Erreur serveur (${response.status})`
    try {
      const errorBody = await response.text()
      const errorJson = JSON.parse(errorBody)
      errorMessage = errorJson.message || errorJson.title || errorMessage
    } catch {
      // Ignorer
    }
    throw new Error(errorMessage)
  }

  const responseText = await response.text()
  let planningData: any
  try {
    planningData = JSON.parse(responseText)
  } catch {
    throw new Error('La réponse IA n\'est pas un JSON valide.')
  }

  return toCamelCase(planningData) as GeneratePlanningResponse
}

export async function checkAPIHealth(): Promise<{ ok: boolean; url: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-planning`, {
      method: 'OPTIONS',
    })
    return { ok: response.ok, url: `${API_BASE_URL}/api/ai/generate-planning` }
  } catch {
    return { ok: false, url: `${API_BASE_URL}/api/ai/generate-planning` }
  }
}