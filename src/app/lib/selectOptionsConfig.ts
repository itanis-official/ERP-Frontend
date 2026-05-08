import { useEffect, useMemo, useState } from 'react'

export type ModuleKey = 'crm' | 'rh'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectOptionDefinition {
  module: ModuleKey
  key: string
  title: string
  description: string
}

type ModuleSettings = Record<string, SelectOption[]>

interface SelectOptionsSettings {
  crm: ModuleSettings
  rh: ModuleSettings
}

const STORAGE_KEY = 'itanis-select-options-config-v1'
const CHANGE_EVENT = 'itanis-select-options-config-changed'

export const selectOptionDefinitions: SelectOptionDefinition[] = [
  {
    module: 'crm',
    key: 'companyStatus',
    title: 'Statuts sociétés',
    description: 'Utilisé dans Sociétés et formulaires CRM.',
  },
  {
    module: 'crm',
    key: 'pipelineStages',
    title: 'Étapes pipeline',
    description: 'Utilisé dans les opportunités CRM.',
  },
  {
    module: 'crm',
    key: 'opportunityProjectTypes',
    title: 'Types de projet',
    description: 'Utilisé dans le formulaire Opportunité.',
  },
  {
    module: 'crm',
    key: 'contractStatuses',
    title: 'Statuts contrat',
    description: 'Utilisé dans les formulaires Contrats.',
  },
  {
    module: 'rh',
    key: 'departments',
    title: 'Départements',
    description: 'Utilisé dans filtres et formulaires RH.',
  },
  {
    module: 'rh',
    key: 'employeeStatuses',
    title: 'Statuts collaborateurs',
    description: 'Actif, inactif, suspendu, etc.',
  },
  {
    module: 'rh',
    key: 'teleworkTypes',
    title: 'Types télétravail',
    description: 'Régulier, occasionnel, etc.',
  },
  {
    module: 'rh',
    key: 'requestStatuses',
    title: 'Statuts demandes',
    description: 'Utilisé dans filtres de demandes RH.',
  },
  {
    module: 'rh',
    key: 'validationTypes',
    title: 'Types validation',
    description: 'Congés, télétravail, sorties.',
  },
  {
    module: 'rh',
    key: 'leaveTypes',
    title: 'Types congé',
    description: 'Utilisé dans le formulaire de congé.',
  },
  {
    module: 'rh',
    key: 'genderOptions',
    title: 'Genres',
    description: 'Utilisé dans les formulaires collaborateurs.',
  },
  {
    module: 'rh',
    key: 'employeeGenderOptions',
    title: 'Genres employés',
    description: 'Utilisé dans le formulaire multi-étapes employé.',
  },
  {
    module: 'rh',
    key: 'maritalStatuses',
    title: 'Situations familiales',
    description: 'Utilisé dans les informations personnelles employé.',
  },
  {
    module: 'rh',
    key: 'governorates',
    title: 'Gouvernorats',
    description: 'Utilisé dans les adresses RH.',
  },
  {
    module: 'rh',
    key: 'contractTypes',
    title: 'Types de contrat',
    description: 'Utilisé dans le formulaire employé.',
  },
  {
    module: 'rh',
    key: 'trialUnits',
    title: 'Unités période d\'essai',
    description: 'Utilisé dans le formulaire employé.',
  },
  {
    module: 'rh',
    key: 'managerNames',
    title: 'Managers',
    description: 'Utilisé dans la section hiérarchie employé.',
  },
  {
    module: 'rh',
    key: 'hierarchyLevels',
    title: 'Niveaux hiérarchiques',
    description: 'Utilisé dans le formulaire employé.',
  },
  {
    module: 'rh',
    key: 'rateTypes',
    title: 'Types de taux',
    description: 'Journalier, mensuel, etc.',
  },
  {
    module: 'rh',
    key: 'insuranceTypes',
    title: 'Types assurance santé',
    description: 'Utilisé dans les avantages sociaux.',
  },
]

const defaultConfig: SelectOptionsSettings = {
  crm: {
    companyStatus: [
      { value: 'client', label: 'Client' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'inactif', label: 'Inactif' },
    ],
    pipelineStages: [
      { value: 'prospection', label: 'Prospection' },
      { value: 'qualification', label: 'Qualification' },
      { value: 'proposition', label: 'Proposition' },
      { value: 'negociation', label: 'Négociation' },
      { value: 'gagne', label: 'Gagné' },
      { value: 'perdu', label: 'Perdu' },
    ],
    opportunityProjectTypes: [
      { value: 'dev', label: 'Projet Dev' },
      { value: 'helpdesk', label: 'Helpdesk' },
      { value: 'consulting', label: 'Consulting' },
      { value: 'formation', label: 'Formation' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'infrastructure', label: 'Infrastructure' },
    ],
    contractStatuses: [
      { value: 'draft', label: 'Brouillon' },
      { value: 'active', label: 'Actif' },
      { value: 'replaced', label: 'Remplacé' },
      { value: 'expired', label: 'Expiré' },
    ],
  },
  rh: {
    departments: [
      { value: 'IT', label: 'IT' },
      { value: 'RH', label: 'RH' },
      { value: 'Management', label: 'Management' },
      { value: 'Finance', label: 'Finance' },
      { value: 'Design', label: 'Design' },
      { value: 'Marketing', label: 'Marketing' },
    ],
    employeeStatuses: [
      { value: 'actif', label: 'Actif' },
      { value: 'inactif', label: 'Inactif' },
      { value: 'suspendu', label: 'Suspendu' },
    ],
    teleworkTypes: [
      { value: 'Regular', label: 'Régulier' },
      { value: 'Occasionnel', label: 'Occasionnel' },
    ],
    requestStatuses: [
      { value: 'Pending', label: 'En attente' },
      { value: 'Approved', label: 'Approuvé' },
      { value: 'Rejected', label: 'Refusé' },
    ],
    validationTypes: [
      { value: 'leave', label: 'Congés' },
      { value: 'telework', label: 'Télétravail' },
      { value: 'exit', label: 'Sorties' },
    ],
    leaveTypes: [
      { value: 'Annuel', label: 'Congé Annuel' },
      { value: 'Maladie', label: 'Maladie' },
      { value: 'MaternitePaternite', label: 'Maternité/Paternité' },
      { value: 'Exceptionnel', label: 'Circonstances Exceptionnelles' },
      { value: 'Formation', label: 'Formation' },
      { value: 'Interim', label: 'Intérim' },
      { value: 'Autre', label: 'Autre' },
    ],
    genderOptions: [
      { value: 'M', label: 'Masculin' },
      { value: 'F', label: 'Féminin' },
    ],
    employeeGenderOptions: [
      { value: 'Homme', label: 'Homme' },
      { value: 'Femme', label: 'Femme' },
    ],
    maritalStatuses: [
      { value: 'Célibataire', label: 'Célibataire' },
      { value: 'Marié', label: 'Marié(e)' },
      { value: 'Divorcé', label: 'Divorcé(e)' },
      { value: 'Veuf', label: 'Veuf(ve)' },
    ],
    governorates: [
      { value: 'Tunis', label: 'Tunis' },
      { value: 'Ariana', label: 'Ariana' },
      { value: 'Ben Arous', label: 'Ben Arous' },
    ],
    contractTypes: [
      { value: 'CDI', label: 'CDI - Contrat à Durée Indéterminée' },
      { value: 'CDD', label: 'CDD - Contrat à Durée Déterminée' },
      { value: 'Stage', label: 'Stage' },
      { value: 'Intérim', label: 'Intérim' },
      { value: 'Freelance', label: 'Freelance' },
    ],
    trialUnits: [
      { value: 'jours', label: 'Jours' },
      { value: 'mois', label: 'Mois' },
    ],
    managerNames: [
      { value: 'Pierre Martin', label: 'Pierre Martin' },
      { value: 'Emma Rousseau', label: 'Emma Rousseau' },
      { value: 'Julie Laurent', label: 'Julie Laurent' },
    ],
    hierarchyLevels: [
      { value: 'Junior', label: 'Junior (0-2 ans)' },
      { value: 'Intermédiaire', label: 'Intermédiaire (2-5 ans)' },
      { value: 'Senior', label: 'Senior (5-10 ans)' },
      { value: 'Expert', label: 'Expert (10+ ans)' },
      { value: 'Manager', label: 'Manager / Chef d\'équipe' },
    ],
    rateTypes: [
      { value: 'journalier', label: 'Journalier' },
      { value: 'mensuel', label: 'Mensuel' },
    ],
    insuranceTypes: [
      { value: 'Individuelle', label: 'Individuelle' },
      { value: 'Familiale', label: 'Familiale' },
    ],
  },
}

const sanitizeOption = (option: any): SelectOption | null => {
  const value = String(option?.value ?? '').trim()
  const label = String(option?.label ?? '').trim()
  if (!value || !label) return null
  return { value, label }
}

const sanitizeModuleConfig = (moduleConfig: any, defaults: ModuleSettings): ModuleSettings => {
  const output: ModuleSettings = { ...defaults }
  if (!moduleConfig || typeof moduleConfig !== 'object') return output

  Object.keys(defaults).forEach((key) => {
    const rawList = moduleConfig[key]
    if (!Array.isArray(rawList)) return
    const sanitized = rawList.map(sanitizeOption).filter(Boolean) as SelectOption[]
    output[key] = sanitized.length > 0 ? sanitized : defaults[key]
  })

  return output
}

export const getDefaultSelectOptionsConfig = (): SelectOptionsSettings => {
  return JSON.parse(JSON.stringify(defaultConfig)) as SelectOptionsSettings
}

export const getSelectOptionsConfig = (): SelectOptionsSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultSelectOptionsConfig()
    const parsed = JSON.parse(raw)

    return {
      crm: sanitizeModuleConfig(parsed?.crm, defaultConfig.crm),
      rh: sanitizeModuleConfig(parsed?.rh, defaultConfig.rh),
    }
  } catch {
    return getDefaultSelectOptionsConfig()
  }
}

const saveConfig = (config: SelectOptionsSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const updateModuleSelectOptions = (module: ModuleKey, key: string, options: SelectOption[]) => {
  const current = getSelectOptionsConfig()
  const sanitized = options.map(sanitizeOption).filter(Boolean) as SelectOption[]
  if (sanitized.length === 0) return

  current[module][key] = sanitized
  saveConfig(current)
}

export const resetModuleSelectOptionsToDefault = (module: ModuleKey) => {
  const current = getSelectOptionsConfig()
  const defaults = getDefaultSelectOptionsConfig()
  current[module] = defaults[module]
  saveConfig(current)
}

export const getModuleOptions = (module: ModuleKey, key: string): SelectOption[] => {
  return getSelectOptionsConfig()[module][key] || []
}

export const useModuleSelectOptions = (module: ModuleKey) => {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1)
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])

  return useMemo(() => {
    void version
    return getSelectOptionsConfig()[module]
  }, [module, version])
}
