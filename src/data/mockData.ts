import type { Ticket, User, Timesheet, Project } from '../types';

export const USERS: User[] = [
  {
    id: 'u1',
    name: 'Jean Dupont',
    email: 'jean.dupont@company.com',
    team: 'Support',
    role: 'Admin',
    avatarInitials: 'JD',
    avatarColor: 'bg-blue-500'
  },
  {
    id: 'u2',
    name: 'Marie Curie',
    email: 'marie.curie@company.com',
    team: 'Development',
    role: 'agent',
    avatarInitials: 'MC',
    avatarColor: 'bg-purple-500'
  },
  {
    id: 'u3',
    name: 'Pierre Martin',
    email: 'pierre.martin@company.com',
    team: 'Helpdesk',
    role: 'agent',
    avatarInitials: 'PM',
    avatarColor: 'bg-green-500'
  },
  {
    id: 'u4',
    name: 'Sophie Germain',
    email: 'sophie.germain@company.com',
    team: 'Windows',
    role: 'agent',
    avatarInitials: 'SG',
    avatarColor: 'bg-yellow-500'
  },
  {
    id: 'client-1',
    name: 'Acme Corp',
    email: 'admin@acme.com',
    team: 'Client',
    role: 'client',
    avatarInitials: 'AC',
    avatarColor: 'bg-orange-500'
  },
  {
    id: 'sub-1',
    name: 'Alice Dubois',
    email: 'alice@acme.com',
    team: 'Acme Corp',
    role: 'subclient',
    clientCompanyId: 'client-1',
    avatarInitials: 'AD',
    avatarColor: 'bg-teal-500'
  },
  {
    id: 'sub-2',
    name: 'Bob Martin',
    email: 'bob@acme.com',
    team: 'Acme Corp',
    role: 'subclient',
    clientCompanyId: 'client-1',
    avatarInitials: 'BM',
    avatarColor: 'bg-indigo-500'
  }
];

export const TICKETS: Ticket[] = [
  {
    id: 'T-1001',
    title: 'Problème de connexion VPN',
    datePosted: '2023-10-25T09:00:00Z',
    category: 'Technical',
    status: 'fresh',
    userId: null,
    clientId: 'client-1',
    clientName: 'Alice Dubois',
    clientEmail: 'alice@acme.com',
    description: "Je n'arrive pas à me connecter au VPN depuis ce matin. Erreur 404.",
    priority: 'high',
    lastMessage: 'Ticket created',
    lastMessageTime: '2 hours ago',
    subClientUserId: 'sub-1'
  },
  {
    id: 'T-1002',
    title: 'Demande de licence logiciel',
    datePosted: '2023-10-24T14:30:00Z',
    category: 'Software',
    status: 'pending',
    userId: 'u1',
    clientId: 'client-1',
    clientName: 'Alice Dubois',
    clientEmail: 'alice@acme.com',
    description: "J'ai besoin d'une licence Adobe pour le nouveau projet.",
    priority: 'medium',
    lastMessage: 'Checking availability...',
    lastMessageTime: '1 day ago',
    subClientUserId: 'sub-1'
  },
  {
    id: 'T-1003',
    title: 'Erreur facturation client',
    datePosted: '2023-10-23T11:15:00Z',
    category: 'Billing',
    status: 'closed',
    userId: 'u3',
    clientId: 'client-1',
    clientName: 'Bob Martin',
    clientEmail: 'bob@acme.com',
    description: 'La facture F-2023-55 contient une erreur de montant.',
    priority: 'high',
    lastMessage: 'Resolved and resent.',
    lastMessageTime: '2 days ago',
    subClientUserId: 'sub-2'
  },
  {
    id: 'T-1004',
    title: 'Mise à jour dossier employé',
    datePosted: '2023-10-22T16:45:00Z',
    category: 'HR',
    status: 'fresh',
    userId: null,
    clientId: 'client-1',
    clientName: 'Bob Martin',
    clientEmail: 'bob@acme.com',
    description: "Changement d'adresse postale à effectuer.",
    priority: 'low',
    lastMessage: 'Ticket created',
    lastMessageTime: '3 days ago',
    subClientUserId: 'sub-2'
  },
  {
    id: 'T-1005',
    title: 'Bug sur la page de login',
    datePosted: '2023-10-21T10:00:00Z',
    category: 'Technical',
    status: 'pending',
    userId: 'u2',
    clientId: 'c5',
    clientName: 'Eve Wilson',
    clientEmail: 'eve@client.com',
    description: 'Le bouton de connexion ne répond pas sur mobile.',
    priority: 'high',
    lastMessage: 'Investigating logs',
    lastMessageTime: '4 days ago'
  },
  {
    id: 'T-1006',
    title: 'Question sur le contrat',
    datePosted: '2023-10-20T09:30:00Z',
    category: 'Sales',
    status: 'fresh',
    userId: null,
    clientId: 'c6',
    clientName: 'Frank Miller',
    clientEmail: 'frank@client.com',
    description: 'Pouvez-vous clarifier la clause 4.2 ?',
    priority: 'medium',
    lastMessage: 'Ticket created',
    lastMessageTime: '5 days ago'
  },
  {
    id: 'T-1007',
    title: 'Imprimante en panne',
    datePosted: '2023-10-19T13:20:00Z',
    category: 'Hardware',
    status: 'closed',
    userId: 'u1',
    clientId: 'c7',
    clientName: 'Grace Kelly',
    clientEmail: 'grace@client.com',
    description: 'Bourrage papier constant au 2ème étage.',
    priority: 'low',
    lastMessage: 'Technician dispatched',
    lastMessageTime: '1 week ago'
  },
  {
    id: 'T-1008',
    title: 'Demande de formation',
    datePosted: '2023-10-18T15:00:00Z',
    category: 'Training',
    status: 'pending',
    userId: 'u4',
    clientId: 'c8',
    clientName: 'Henry Ford',
    clientEmail: 'henry@client.com',
    description: 'Souhaite suivre la formation sécurité.',
    priority: 'low',
    lastMessage: 'Approval pending',
    lastMessageTime: '1 week ago'
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Project Alpha',
    tasks: [
      'Frontend Development',
      'Backend API Integration',
      'Code Review',
      'Unit Testing',
      'Bug Fixing',
      'Documentation'
    ]
  },
  {
    id: 'p2',
    name: 'Project Beta',
    tasks: [
      'UI/UX Design',
      'Database Migration',
      'Performance Optimization',
      'Security Audit',
      'Deployment'
    ]
  },
  {
    id: 'p3',
    name: 'Project Gamma',
    tasks: [
      'Requirements Gathering',
      'Architecture Design',
      'Prototyping',
      'Client Presentation',
      'Sprint Planning'
    ]
  },
  {
    id: 'p4',
    name: 'Infrastructure Upgrade',
    tasks: [
      'Server Configuration',
      'Network Setup',
      'Monitoring Setup',
      'Backup Configuration',
      'Load Testing'
    ]
  }
];

export const TIMESHEETS: Timesheet[] = [
  {
    id: 'ts-1',
    userId: 'u1',
    month: 9,
    year: 2023,
    status: 'draft',
    totalHours: 12,
    tasks: [
      {
        id: 'tk-1',
        date: '2023-10-02',
        description: 'Réunion équipe',
        hours: 2,
        type: 'independent'
      },
      {
        id: 'tk-2',
        date: '2023-10-02',
        description: 'Dev Feature A',
        hours: 6,
        type: 'project',
        projectName: 'Project Alpha'
      },
      {
        id: 'tk-3',
        date: '2023-10-03',
        description: 'Code Review',
        hours: 4,
        type: 'project',
        projectName: 'Project Alpha'
      }
    ]
  },
  {
    id: 'ts-2',
    userId: 'u2',
    month: 9,
    year: 2023,
    status: 'submitted',
    totalHours: 160,
    tasks: [
      {
        id: 'tk-4',
        date: '2023-10-01',
        description: 'Full month work',
        hours: 160,
        type: 'project',
        projectName: 'Project Beta'
      }
    ]
  }
];
