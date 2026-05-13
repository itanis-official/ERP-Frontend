import { helpdeskApi } from '../api';
import type { KnowledgeBase, KnowledgeSolution, CategorieAction } from '../../types/helpdesk'

export const knowledgeService = {

  getAll: (): Promise<KnowledgeBase[]> =>
    helpdeskApi.get('/knowledge').then(r => r.data),

  getById: (id: number): Promise<KnowledgeBase> =>
    helpdeskApi.get(`/knowledge/${id}`).then(r => r.data),

  getByCategorie: (categorie: CategorieAction): Promise<KnowledgeBase[]> =>
    helpdeskApi.get(`/knowledge/categorie/${categorie}`).then(r => r.data),

  create: (kb: Omit<KnowledgeBase, 'id' | 'dateCreation' | 'solutions'>): Promise<KnowledgeBase> =>
    helpdeskApi.post('/knowledge', kb).then(r => r.data),

  patch: (id: number, partial: Partial<KnowledgeBase>): Promise<void> =>
    helpdeskApi.patch(`/knowledge/${id}`, partial).then(r => r.data),

  delete: (id: number): Promise<void> =>
    helpdeskApi.delete(`/knowledge/${id}`).then(r => r.data),
}

export const knowledgeSolutionService = {

  add: (solution: Omit<KnowledgeSolution, 'id' | 'dateResolution'>): Promise<KnowledgeSolution> =>
    helpdeskApi.post('/knowledge/solution', solution).then(r => r.data),

  patch: (id: number, partial: Partial<KnowledgeSolution>): Promise<void> =>
    helpdeskApi.patch(`/knowledge/solution/${id}`, partial).then(r => r.data),

  delete: (id: number): Promise<void> =>
    helpdeskApi.delete(`/knowledge/solution/${id}`).then(r => r.data),
}