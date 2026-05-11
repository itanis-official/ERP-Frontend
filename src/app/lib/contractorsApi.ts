import { rhApi } from './api';

export interface CollaborateurExterne {
  id?: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  statut: string;
  role: string;
  cin: string | null;
  dateNaissance: string | null;
  genre: string | null;
  nationalite: string;
  telephoneSecondaire: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  gouvernorat: string | null;
  pays: string;
  societeOrigine: string;
  mission: string | null;
  dureeMission: number;
  tauxJournalier: number;
  tauxHoraire: number | null;
  devise: string;
  dateFinMission: string;
  missionRenouvelable: boolean;
  fichierCV: string;
  numeroContratSoustraitance: string;
  createdAt?: string;
  updatedAt?: string;
}

export const contractorsApi = {
  getAll: async (): Promise<CollaborateurExterne[]> => {
    const response = await rhApi.get('/api/collaborateursexternes');
    return response.data;
  },

  getById: async (id: number): Promise<CollaborateurExterne> => {
    const response = await rhApi.get(`/api/collaborateursexternes/${id}`);
    return response.data;
  },

  create: async (data: Omit<CollaborateurExterne, 'id' | 'createdAt' | 'updatedAt'>): Promise<CollaborateurExterne> => {
    const response = await rhApi.post('/api/collaborateursexternes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CollaborateurExterne>): Promise<CollaborateurExterne> => {
    const response = await rhApi.put(`/api/collaborateursexternes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await rhApi.delete(`/api/collaborateursexternes/${id}`);
  },

  prolongerMission: async (id: number, nouvelleDateFin: string): Promise<CollaborateurExterne> => {
    const response = await rhApi.put(`/api/collaborateursexternes/${id}/prolonger-mission`, nouvelleDateFin);
    return response.data;
  },

  downloadCV: async (id: number): Promise<Blob> => {
    const response = await rhApi.get(`/api/collaborateursexternes/${id}/download-cv`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
