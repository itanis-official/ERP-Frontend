import api from '../../../core/api/api'

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
  isPaid?: boolean
  pricePerMillionTokens?: number
  freeQuota?: number
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Le plus performant pour les projets complexes - Haute précision',
    speed: 'medium', quality: 5, maxTokens: 8192, contextWindow: 128000, isPaid: false, freeQuota: 1000,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    description: 'Rapide et fiable - Excellent pour les petits projets',
    speed: 'fast', quality: 4, maxTokens: 8192, contextWindow: 128000, isPaid: false, freeQuota: 5000,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'Mistral AI',
    description: 'Excellent pour les tâches de raisonnement',
    speed: 'medium', quality: 4, maxTokens: 8192, contextWindow: 32768, isPaid: false, freeQuota: 2000,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    provider: 'Google',
    description: 'Modèle compact et efficace',
    speed: 'fast', quality: 3, maxTokens: 8192, contextWindow: 8192, isPaid: false, freeQuota: 5000,
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }

function toPascalCase(obj: JsonObject): JsonObject {
  const keyMap: Record<string, string> = {
    projetNom: 'ProjetNom', projetDescription: 'ProjetDescription',
    typeProjet: 'TypeProjet', dateDebut: 'DateDebut', dateFinPrevue: 'DateFinPrevue',
    budgetEstime: 'BudgetEstime', equipeDisponible: 'EquipeDisponible',
    joursFeries: 'JoursFeries', projetId: 'ProjetId', model: 'Model',
  }
  const result: JsonObject = {}
  for (const [key, value] of Object.entries(obj)) {
    const pascalKey = keyMap[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
    result[pascalKey] = value
  }
  return result
}

function toCamelCase(obj: JsonValue): JsonValue {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj === 'object') {
    const result: JsonObject = {}
    for (const [key, value] of Object.entries(obj as JsonObject)) {
      result[key.charAt(0).toLowerCase() + key.slice(1)] = toCamelCase(value)
    }
    return result
  }
  return obj
}

// ─── API Calls ─────────────────────────────────────────────────────────────

interface ApiModel {
  id: string
  name: string
}

export async function getAvailableModels(): Promise<AIModel[]> {
  try {
    const response = await api.get('/ai/models')
    return (response.data as ApiModel[]).map((m) => {
      const existing = AVAILABLE_MODELS.find(am => am.id === m.id)
      return {
        id: m.id,
        name: m.name,
        provider: existing?.provider ?? 'Groq',
        description: existing?.description ?? m.name,
        speed: existing?.speed ?? 'medium',
        quality: existing?.quality ?? 4,
        maxTokens: existing?.maxTokens ?? 8192,
        contextWindow: existing?.contextWindow ?? 32768,
        isPaid: existing?.isPaid ?? false,
        pricePerMillionTokens: existing?.pricePerMillionTokens,
        freeQuota: existing?.freeQuota,
      }
    })
  } catch (error) {
    console.error('Erreur chargement modèles:', error)
    return AVAILABLE_MODELS
  }
}

export async function generatePlanningWithAI(input: GeneratePlanningInput): Promise<GeneratePlanningResponse> {
  const payload = toPascalCase({ ...input, model: input.model ?? 'llama-3.1-8b-instant' } as unknown as JsonObject)

  const response = await api.post('/ai/generate-planning', payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  let planningData: JsonValue
  if (typeof response.data === 'string') {
    try {
      planningData = JSON.parse(response.data as string)
    } catch (err) {
      console.error('Erreur parsing JSON:', err)
      throw new Error("La réponse IA n'est pas un JSON valide.")
    }
  } else {
    planningData = response.data as JsonValue
  }

  const data = planningData as JsonObject
  if (data.phases) return toCamelCase(data) as unknown as GeneratePlanningResponse
  if (data.content) {
    try {
      return toCamelCase(JSON.parse(data.content as string)) as unknown as GeneratePlanningResponse
    } catch {
      return toCamelCase(data) as unknown as GeneratePlanningResponse
    }
  }
  return toCamelCase(data) as unknown as GeneratePlanningResponse
}

export async function checkAPIHealth(): Promise<{ ok: boolean; url: string }> {
  try {
    const response = await api.options('/ai/generate-planning')
    return { ok: response.status === 200, url: '/ai/generate-planning' }
  } catch (error) {
    console.error('API Health check failed:', error)
    return { ok: false, url: '/ai/generate-planning' }
  }
}
