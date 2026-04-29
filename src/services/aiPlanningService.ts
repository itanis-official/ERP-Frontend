// services/aiPlanningService.ts

// ─── Config API ────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5101'

// ─── Types Backend → Frontend ───────────────────────────────────────────────────

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

// ─── Mapping Helpers ─────────────────────────────────────────────────────────────

/**
 * Le frontend utilise camelCase, le backend C# utilise PascalCase.
 * Cette fonction convertit les clés du payload.
 */
function toPascalCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Mapping explicite des clés connues
    const keyMap: Record<string, string> = {
      projetNom: 'ProjetNom',
      projetDescription: 'ProjetDescription',
      typeProjet: 'TypeProjet',
      dateDebut: 'DateDebut',
      dateFinPrevue: 'DateFinPrevue',
      budgetEstime: 'BudgetEstime',
      equipeDisponible: 'EquipeDisponible',
      joursFeries: 'JoursFeries',
    }

    const pascalKey = keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
    result[pascalKey] = value
  }

  return result
}

/**
 * Convertit les clés PascalCase du backend en camelCase pour le frontend.
 */
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
      result[camelKey] = toCamelCase(value)
    }
    return result
  }
  return obj
}

// ─── Service principal ────────────────────────────────────────────────────────────

export async function generatePlanningWithAI(
  input: GeneratePlanningInput
): Promise<GeneratePlanningResponse> {
  try {
    // 1. Convertir le payload en PascalCase pour le backend C#
    const payload = toPascalCase(input as unknown as Record<string, any>)

    // 2. Récupérer le token JWT
    const token = localStorage.getItem('token')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Ajouter l'authorization si le token existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 3. Appel API
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-planning`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

if (!response.ok) {
    let errorMessage = `Erreur serveur (${response.status})`
    let errorDetail = ''

    try {
        const errorBody = await response.text()

        // Essayer de parser en JSON (ASP.NET ProblemDetails ou notre format)
        try {
            const errorJson = JSON.parse(errorBody)
            errorMessage = errorJson.message
                || errorJson.title
                || errorJson.error
                || errorMessage
            errorDetail = errorJson.detail || errorJson.traceId || ''
        } catch {
            // Si ce n'est pas du JSON, afficher le texte brut (tronqué)
            if (errorBody.length > 0 && errorBody.length < 500) {
                errorMessage = errorBody
            } else if (errorBody.length >= 500) {
                errorMessage = errorBody.substring(0, 500) + '...'
            }
        }
    } catch {
        errorMessage = `${response.status} ${response.statusText}`
    }

    // Construire le message final avec le détail
    const fullMessage = errorDetail
        ? `${errorMessage}\n\nDétail : ${errorDetail}`
        : errorMessage

    throw new Error(fullMessage)
}

    // 5. Parser la réponse
    // Le backend retourne du JSON brut (content de Groq)
    const responseText = await response.text()

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Réponse vide du serveur')
    }

    // Parser le JSON brut retourné par Groq (via le backend)
    let planningData: any
    try {
      planningData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', responseText.substring(0, 500))
      throw new Error('La réponse IA n\'est pas un JSON valide. Veuillez réessayer.')
    }

    // 6. Convertir PascalCase → camelCase pour le frontend
    const camelCaseData = toCamelCase(planningData)

    // 7. Validation minimale
    if (!camelCaseData.phases || !Array.isArray(camelCaseData.phases)) {
      throw new Error('La réponse IA ne contient pas de "phases" valide')
    }

    // 8. S'assurer que les champs obligatoires sont présents
    const result: GeneratePlanningResponse = {
      resume: camelCaseData.resume || 'Planning généré par IA',
      phases: camelCaseData.phases.map((phase: any, index: number) => ({
        typePhase: phase.typePhase || `Phase ${index + 1}`,
        description: phase.description || '',
        pourcentageBudget: phase.pourcentageBudget || 0,
        taches: Array.isArray(phase.taches)
          ? phase.taches.map((task: any) => ({
              titre: task.titre || 'Tâche sans titre',
              description: task.description || '',
              dateDebutPrevue: task.dateDebutPrevue || '',
              dateFinPrevue: task.dateFinPrevue || '',
              dureeEstimeeHeures: task.dureeEstimeHeures || 0,
              priorite: task.priorite || 'Moyenne',
              responsableId: task.responsableId ?? undefined,
              responsableNom: task.responsableNom || '',
              testeurId: task.testeurId ?? undefined,
              testeurNom: task.testeurNom || '',
              competencesRequises: Array.isArray(task.competencesRequises)
                ? task.competencesRequises
                : [],
              dependances: Array.isArray(task.dependances)
                ? task.dependances
                : [],
              sousTaches: Array.isArray(task.sousTaches)
                ? task.sousTaches.map((st: any) => ({
                    titre: st.titre || 'Sous-tâche',
                    description: st.description || '',
                    dureeEstimeeHeures: st.dureeEstimeeHeures || 1,
                    statut: st.statut || 'AFaire',
                  }))
                : [],
            }))
          : [],
      })),
      statsGlobales: {
        totalTaches: camelCaseData.statsGlobales?.totalTaches || 0,
        totalSousTaches: camelCaseData.statsGlobales?.totalSousTaches || 0,
        totalHeures: camelCaseData.statsGlobales?.totalHeures || 0,
        tauxCouvertureEquipe: camelCaseData.statsGlobales?.tauxCouvertureEquipe || 0,
      },
      suggestions: {
        alertes: Array.isArray(camelCaseData.suggestions?.alertes)
          ? camelCaseData.suggestions.alertes.filter(Boolean)
          : [],
        recommandations: Array.isArray(camelCaseData.suggestions?.recommandations)
          ? camelCaseData.suggestions.recommandations.filter(Boolean)
          : [],
        risques: Array.isArray(camelCaseData.suggestions?.risques)
          ? camelCaseData.suggestions.risques.filter(Boolean)
          : [],
      },
    }

    return result
  } catch (error: any) {
    console.error('Erreur generatePlanningWithAI:', error)
    throw new Error(error.message || 'Erreur lors de la génération IA')
  }
}

// ─── Utilitaire de test ──────────────────────────────────────────────────────────

/**
 * Vérifie que l'API est joignable (utile pour le debug)
 */
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