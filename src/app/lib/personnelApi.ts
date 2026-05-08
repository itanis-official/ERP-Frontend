import { rhApi } from './api';

export interface CollaborateurInterne {
  id?: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  typeEmploye: string;
  departement: string;
  statut: string;
  role: string;
  photo: string | null;
  cin: string;
  dateNaissance: string;
  genre: string;
  nationalite: string;
  situationFamiliale: string;
  adresse: string;
  codePostal: string;
  ville: string;
  gouvernorat: string;
  pays: string;
  emailPersonnel: string;
  telephoneSecondaire: string;
  typeContrat: string;
  numeroCNSS: string;
  dateEmbauche: string;
  periodeEssai: number;
  dateConfirmation: string | null;
  niveauHierarchique: string;
  salaireBrut: number;
  devise: string;
  horaireDebut: string;
  horaireFin: string;
  joursTravailles: string;
  teleTravailAutorise: boolean;
  joursParSemaine: number;
  soldeConges: number;
  droitsMensuels: number;
  dateDebutAcquisition: string;
  ticketRestaurant: boolean;
  montantTicket: number;
  transport: boolean;
  montantTransport: number;
  assuranceSante: boolean;
  typeAssurance: string;
  organismeAssurance: string;
  numeroPoliceSante: string;
  chefProjetId: number | null;
  managerId: number | null;
  createdAt?: string;
  updatedAt?: string;
  cvPath?: string | null;
  cinDocumentPath?: string | null;
  attestationCnssPath?: string | null;
  diplomesPathsJson?: string | null;
  contratSignePath?: string | null;
  autresDocumentsPathsJson?: string | null;
}

export interface CollaborateurDocumentsPayload {
  photo?: File | null;
  cv?: File | null;
  cinDoc?: File | null;
  attestationCnss?: File | null;
  contratSigne?: File | null;
  diplomes?: File[];
  autresDocuments?: File[];
}

export interface EmployeeCreationCredentials {
  login: string;
  password: string;
  role: string;
}

export interface CreateCollaborateurInterneResponse {
  employee: CollaborateurInterne;
  credentials?: EmployeeCreationCredentials;
}

export const personnelApi = {
  getAll: async (): Promise<CollaborateurInterne[]> => {
    const response = await rhApi.get('/api/collaborateursinternes');
    return response.data;
  },

  getById: async (id: number): Promise<CollaborateurInterne> => {
    const response = await rhApi.get(`/api/collaborateursinternes/${id}`);
    return response.data;
  },

  create: async (data: Omit<CollaborateurInterne, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreateCollaborateurInterneResponse> => {
    const response = await rhApi.post('/api/collaborateursinternes', data);
    if (response.data?.employee) {
      return response.data;
    }

    // Backward compatibility if API returns employee object directly.
    return { employee: response.data };
  },

  update: async (id: number, data: Partial<CollaborateurInterne>): Promise<CollaborateurInterne> => {
    const response = await rhApi.put(`/api/collaborateursinternes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await rhApi.delete(`/api/collaborateursinternes/${id}`);
  },

  updateSoldeConge: async (id: number, nouveauSolde: number): Promise<CollaborateurInterne> => {
    const response = await rhApi.put(`/api/collaborateursinternes/${id}/solde-conge`, nouveauSolde);
    return response.data;
  },

  getSubordonnes: async (id: number): Promise<CollaborateurInterne[]> => {
    const response = await rhApi.get(`/api/collaborateursinternes/${id}/subordonnes`);
    return response.data;
  },

  uploadDocuments: async (id: number, payload: CollaborateurDocumentsPayload): Promise<CollaborateurInterne> => {
    const formData = new FormData();

    if (payload.photo) formData.append('photo', payload.photo);
    if (payload.cv) formData.append('cv', payload.cv);
    if (payload.cinDoc) formData.append('cinDoc', payload.cinDoc);
    if (payload.attestationCnss) formData.append('attestationCnss', payload.attestationCnss);
    if (payload.contratSigne) formData.append('contratSigne', payload.contratSigne);

    for (const file of payload.diplomes ?? []) {
      formData.append('diplomes', file);
    }

    for (const file of payload.autresDocuments ?? []) {
      formData.append('autresDocuments', file);
    }

    const response = await rhApi.post(`/api/collaborateursinternes/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};
