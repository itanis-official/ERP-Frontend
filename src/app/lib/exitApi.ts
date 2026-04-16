import { rhApi } from './api';

export interface AutorisationSortie {
  id?: number;
  employeId: number;
  date: string;
  heureSortie: string;
  heureRetour?: string | null;
  duree: string;
  motif: string;
  details?: string | null;
  aRecuperer: boolean;
  dateRecuperation?: string | null;
  heureRecuperation?: string | null;
  statut: string;
  managerId?: number | null;
  dateValidation?: string | null;
  commentaire?: string | null;
  raisonRejet?: string | null;
  dateSoumission?: string;
  createdAt?: string;
  updatedAt?: string;
  employe?: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
    poste: string;
    departement: string;
  };
}

export const exitApi = {
  getAll: async (): Promise<AutorisationSortie[]> => {
    const response = await rhApi.get('/api/AutorisationsSortie');
    return response.data;
  },

  getById: async (id: number): Promise<AutorisationSortie> => {
    const response = await rhApi.get(`/api/AutorisationsSortie/${id}`);
    return response.data;
  },

  getByEmploye: async (employeId: number): Promise<AutorisationSortie[]> => {
    const response = await rhApi.get(`/api/AutorisationsSortie/employe/${employeId}`);
    return response.data;
  },

  getForManager: async (managerId: number): Promise<AutorisationSortie[]> => {
    const response = await rhApi.get(`/api/AutorisationsSortie/manager/${managerId}`);
    return response.data;
  },

  getPending: async (): Promise<AutorisationSortie[]> => {
    const response = await rhApi.get('/api/AutorisationsSortie/pending');
    return response.data;
  },

  create: async (data: Omit<AutorisationSortie, 'id' | 'createdAt' | 'updatedAt' | 'dateSoumission'>): Promise<AutorisationSortie> => {
    const response = await rhApi.post('/api/AutorisationsSortie', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AutorisationSortie>): Promise<AutorisationSortie> => {
    const response = await rhApi.put(`/api/AutorisationsSortie/${id}`, data);
    return response.data;
  },

  approve: async (id: number, managerId: number, commentaire?: string): Promise<AutorisationSortie> => {
    const response = await rhApi.put(`/api/AutorisationsSortie/${id}/approve`, { managerId, commentaire });
    return response.data;
  },

  approveByRH: async (id: number, rhId: number, commentaire?: string): Promise<AutorisationSortie> => {
    const response = await rhApi.put(`/api/AutorisationsSortie/${id}/approve-rh`, { rhId, commentaire });
    return response.data;
  },

  reject: async (id: number, raison?: string, managerId?: number, rhId?: number): Promise<AutorisationSortie> => {
    const response = await rhApi.put(`/api/AutorisationsSortie/${id}/reject`, { raison, managerId, rhId });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await rhApi.delete(`/api/AutorisationsSortie/${id}`);
  },
};
