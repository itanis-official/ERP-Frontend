import { rhApi } from './api';

export interface DemandeTeletravail {
  id?: number;
  employeId: number;
  type: string;
  dateDebut: string | null;
  dateFin: string | null;
  joursParSemaine: number;
  joursFixes: string | null;
  raison: string;
  typeRaison: string | null;
  equipementFourni: boolean;
  vpnConfigure: boolean;
  accesOutilsOk: boolean;
  horairesJoignables: string | null;
  modeContact: string | null;
  statut: string;
  managerId?: number | null;
  dateValidationManager?: string | null;
  commentaireManager?: string | null;
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

export const teletravailApi = {
  getAll: async (): Promise<DemandeTeletravail[]> => {
    const response = await rhApi.get('/api/DemandesTeletravail');
    return response.data;
  },

  getById: async (id: number): Promise<DemandeTeletravail> => {
    const response = await rhApi.get(`/api/DemandesTeletravail/${id}`);
    return response.data;
  },

  getByEmploye: async (employeId: number): Promise<DemandeTeletravail[]> => {
    const response = await rhApi.get(`/api/DemandesTeletravail/employe/${employeId}`);
    return response.data;
  },

  getForManager: async (managerId: number): Promise<DemandeTeletravail[]> => {
    const response = await rhApi.get(`/api/DemandesTeletravail/manager/${managerId}`);
    return response.data;
  },

  getPending: async (): Promise<DemandeTeletravail[]> => {
    const response = await rhApi.get('/api/DemandesTeletravail/pending');
    return response.data;
  },

  create: async (data: Omit<DemandeTeletravail, 'id' | 'createdAt' | 'updatedAt' | 'dateSoumission'>): Promise<DemandeTeletravail> => {
    const response = await rhApi.post('/api/DemandesTeletravail', {
      employeId: data.employeId,
      type: data.type,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      joursParSemaine: data.joursParSemaine,
      joursFixes: data.joursFixes,
      raison: data.raison,
      typeRaison: data.typeRaison,
      equipementFourni: data.equipementFourni,
      vpnConfigure: data.vpnConfigure,
      accesOutilsOk: data.accesOutilsOk,
      horairesJoignables: data.horairesJoignables,
      modeContact: data.modeContact,
      statut: "Pending",
    });
    return response.data;
  },

  update: async (id: number, data: Partial<DemandeTeletravail>): Promise<DemandeTeletravail> => {
    const response = await rhApi.put(`/api/DemandesTeletravail/${id}`, data);
    return response.data;
  },

  approveByManager: async (id: number, managerId: number, commentaire?: string): Promise<DemandeTeletravail> => {
    const response = await rhApi.put(`/api/DemandesTeletravail/${id}/approve-manager`, { managerId, commentaire });
    return response.data;
  },

  approveByRH: async (id: number, rhId: number, commentaire?: string): Promise<DemandeTeletravail> => {
    const response = await rhApi.put(`/api/DemandesTeletravail/${id}/approve-rh`, { rhId, commentaire });
    return response.data;
  },

  reject: async (id: number, commentaire?: string, managerId?: number, rhId?: number): Promise<DemandeTeletravail> => {
    const response = await rhApi.put(`/api/DemandesTeletravail/${id}/reject`, { raison: commentaire, managerId, rhId });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await rhApi.delete(`/api/DemandesTeletravail/${id}`);
  },
};
