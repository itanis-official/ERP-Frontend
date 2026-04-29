// Types pour l'authentification
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiration: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nomComplet: string;
  poste?: string;
  departement?: string;
}

export interface User {
  id: string;
  email: string;
  nomComplet: string;
  poste?: string;
  departement?: string;
  roles: string[];
}

// Types pour les projets
export interface Client {
  id: number;
  nom: string;
  contact?: string;
  email?: string;
  telephone?: string;
}

export interface Projet {
  id: number;
  nom: string;
  clientId: number;
  client?: Client;
  description: string;
  lieu?: string;
  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle?: string;
  budgetEstime: number;
  budgetReel?: number;
  typeProjet: string;
  statut: number; // 0=Planifié, 1=EnCours, 2=Terminé, 3=EnPause
}

export interface CreateProjetDto {
  nom: string;
  clientId: number;
  description: string;
  lieu?: string;
  dateDebut: string;
  dateFinPrevue: string;
  budgetEstime: number;
  typeProjet: string;
  statut: number;
}

export interface Phase {
  id: number;
  projetId: number;
  typePhase: number; // 0=Construction, 1=Études, 2=Réception, 3=Garantie
  pourcentageBudget: number;
  statut: string;
}

export interface Tache {
  id: number;
  phaseId: number;
  titre: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  statut: string;
}

export interface Employe {
  id: number;
  nomComplet: string;
  email: string;
  role: string;
  groupeEquipeId?: number;
}

export interface Notification {
  id: number;
  employeId: number;
  message: string;
  type: string;
  dateEnvoi: string;
  lu: boolean;
}

// Constantes
export const STATUT_PROJET = {
  0: 'Planifié',
  1: 'En cours',
  2: 'Terminé',
  3: 'En pause'
};

export const TYPE_PHASE = {
  0: 'Construction',
  1: 'Études',
  2: 'Réception',
  3: 'Garantie'
};