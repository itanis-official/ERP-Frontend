export type TicketStatus = 'fresh' | 'pending' | 'closed' | 'paused' | 'rejected' | 'archived';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'Admin' | 'agent' | 'manager' | 'client' | 'subclient';
export type TimesheetStatus = 'draft' | 'submitted' | 'validated' | 'rejected';
export type TaskType = 'independent' | 'project';

export interface User {
  id: string;
  name: string;
  email: string;
  team: string;
  role: UserRole;
  avatarInitials: string;
  avatarColor: string;
  clientCompanyId?: string;
}

export interface Ticket {
  id: string;
  title: string;
  datePosted: string;
  category?: string;
  status: TicketStatus;
  userId: string | null;
  clientId: string;
  clientName: string;
  clientEmail: string;
  description: string;
  priority: TicketPriority;
  lastMessage?: string;
  lastMessageTime?: string;
  subClientUserId?: string;
  rating?: number;
  feedback?: string;
}

export interface TimesheetTask {
  id: string;
  date: string;
  description: string;
  hours: number;
  type: TaskType;
  projectName?: string;
  ticketId?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
}

export interface Timesheet {
  id: string;
  userId: string;
  month: number;
  year: number;
  tasks: TimesheetTask[];
  status: TimesheetStatus;
  validatedBy?: string;
  totalHours: number;
}

export interface Project {
  id: string;
  name: string;
  tasks: string[];
}

export interface Solution {
  id: number;
  author: string;
  date: string;
  content: string;
  files: string[];
}

export interface Article {
  id: string;
  title: string;
  description: string;
  service: string;
  category: string;
  author: string;
  date: string;
  solutions: Solution[];
}
