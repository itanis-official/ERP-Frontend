import { rhApi } from './api';

export interface DemandeConge {
  id?: number;
  employeId: number;
  typeConge: string;
  dateDebut: string;
  dateFin: string;
  dureeJours: number;
  motif: string;
  statut: string;
  soldeAvant?: number;
  soldeApres?: number;
  fichierJustificatif?: string;
  chefProjetId?: number | null;
  dateValidationChef?: string | null;
  commentaireChef?: string | null;
  rhId?: number | null;
  dateValidationRH?: string | null;
  commentaireRH?: string | null;
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

export const leaveApi = {
  getAll: async (): Promise<DemandeConge[]> => {
    const response = await rhApi.get('/api/DemandesConge');
    return response.data;
  },

  getById: async (id: number): Promise<DemandeConge> => {
    const response = await rhApi.get(`/api/DemandesConge/${id}`);
    return response.data;
  },

  getByEmploye: async (employeId: number): Promise<DemandeConge[]> => {
    const response = await rhApi.get(`/api/DemandesConge/employe/${employeId}`);
    return response.data;
  },

  getForManager: async (managerId: number): Promise<DemandeConge[]> => {
    const response = await rhApi.get(`/api/DemandesConge/manager/${managerId}`);
    return response.data;
  },

  getPending: async (): Promise<DemandeConge[]> => {
    const response = await rhApi.get('/api/DemandesConge/pending');
    return response.data;
  },

  create: async (data: Omit<DemandeConge, 'id' | 'createdAt' | 'updatedAt' | 'dateSoumission'>): Promise<DemandeConge> => {
    const response = await rhApi.post('/api/DemandesConge', data);
    return response.data;
  },

  update: async (id: number, data: Partial<DemandeConge>): Promise<DemandeConge> => {
    const response = await rhApi.put(`/api/DemandesConge/${id}`, data);
    return response.data;
  },

  validateByManager: async (id: number, managerId: number, commentaire?: string): Promise<DemandeConge> => {
    const response = await rhApi.put(`/api/DemandesConge/${id}/validate-manager`, { managerId, commentaire });
    return response.data;
  },

  validateByRH: async (id: number, rhId: number, commentaire?: string): Promise<DemandeConge> => {
    const response = await rhApi.put(`/api/DemandesConge/${id}/validate-rh`, { rhId, commentaire });
    return response.data;
  },

  reject: async (id: number, commentaire?: string, managerId?: number, rhId?: number): Promise<DemandeConge> => {
    const response = await rhApi.put(`/api/DemandesConge/${id}/reject`, { commentaire, managerId, rhId });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await rhApi.delete(`/api/DemandesConge/${id}`);
  },
};
