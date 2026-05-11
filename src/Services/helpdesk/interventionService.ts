import { helpdeskApi } from '../api'
import type { Intervention, CategorieAction } from '../../types/helpdesk'

export const interventionService = {

  /** GET api/interventions */
  getAll: (): Promise<Intervention[]> =>
    helpdeskApi.get('/interventions').then(r => r.data),

  /** GET api/interventions/{id} */
  getById: (id: number): Promise<Intervention> =>
    helpdeskApi.get(`/interventions/${id}`).then(r => r.data),

  /** GET api/interventions/categorie/{categorie} */
  getByCategorie: (categorie: CategorieAction): Promise<Intervention[]> =>
    helpdeskApi.get(`/interventions/categorie/${categorie}`).then(r => r.data),

  /** POST api/interventions */
  create: (intervention: Omit<Intervention, 'id'>): Promise<Intervention> =>
    helpdeskApi.post('/interventions', intervention).then(r => r.data),

  /** PUT api/interventions/{id} */
  update: (id: number, intervention: Intervention): Promise<void> =>
    helpdeskApi.put(`/interventions/${id}`, intervention).then(r => r.data),

  /** DELETE api/interventions/{id} */
  delete: (id: number): Promise<void> =>
    helpdeskApi.delete(`/interventions/${id}`).then(r => r.data),
}