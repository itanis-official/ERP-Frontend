import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  CheckSquare,
  LogOut,
  LifeBuoy,
  ClipboardList,
  Building,
  Users,
  Calendar,
  BookOpen
} from 'lucide-react';
import type { User } from '../../types';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  currentUser: User;
  isMobileOpen?: boolean;
  onLogout?: () => void;
}

export function Sidebar({
  currentUser,
  isMobileOpen = false,
  onLogout
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const allNavItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      section: 'HELPDESK',
      roles: ['agent', 'Admin']
    },
    {
      id: 'tickets',
      path: '/tickets',
      label: 'All Tickets',
      icon: Ticket,
      section: 'HELPDESK',
      roles: ['agent', 'Admin']
    },
    {
      id: 'my-tickets',
      path: '/my-tickets',
      label: 'My Tickets',
      icon: ClipboardList,
      section: 'HELPDESK',
      roles: ['agent']
    },
    {
      id: 'knowledge',
      path: '/knowledge',
      label: 'Knowledge Base',
      icon: BookOpen,
      section: 'HELPDESK',
      roles: ['agent', 'Admin']
    },
    {
      id: 'create-ticket',
      path: '/create-ticket',
      label: 'Create Ticket',
      icon: PlusCircle,
      section: 'HELPDESK',
      roles: ['agent', 'Admin', 'subclient']
    },
    {
      id: 'timesheets',
      path: '/timesheets',
      label: 'Timesheet and Calendar',
      icon: Calendar,
      section: 'TIMESHEETS',
      roles: ['agent', 'Admin']
    },
    {
      id: 'validation',
      path: '/validation',
      label: 'Validation',
      icon: CheckSquare,
      section: 'TIMESHEETS',
      roles: ['Admin']
    },
    {
      id: 'all-clients',
      path: '/clients',
      label: 'All Clients',
      icon: Building,
      section: 'ADMIN',
      roles: ['Admin']
    },
    {
      id: 'all-agents',
      path: '/agents',
      label: 'All Agents',
      icon: Users,
      section: 'ADMIN',
      roles: ['Admin']
    },
    {
      id: 'client-dashboard',
      path: '/company',
      label: 'Company Overview',
      icon: Building,
      section: 'CLIENT',
      roles: ['client']
    },
    {
      id: 'client-tickets',
      path: '/company-tickets',
      label: 'All Tickets',
      icon: Ticket,
      section: 'CLIENT',
      roles: ['client']
    },
    {
      id: 'subclient-dashboard',
      path: '/my-dashboard',
      label: 'My Dashboard',
      icon: LayoutDashboard,
      section: 'SUBCLIENT',
      roles: ['subclient']
    },
    {
      id: 'subclient-my-tickets',
      path: '/my-tickets',
      label: 'My Tickets',
      icon: Ticket,
      section: 'SUBCLIENT',
      roles: ['subclient']
    }
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
    return (
      <Link
        key={item.id}
        to={item.path}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
          isActive
            ? 'bg-orange-50 border-[#ef7c21] text-[#ef7c21]'
            : 'border-transparent text-slate-600 hover:text-[#ef7c21] hover:bg-orange-50'
        }`}
      >
        <item.icon
          className={`h-5 w-5 mr-3 ${
            isActive ? 'text-[#ef7c21]' : 'text-slate-400 group-hover:text-[#ef7c21]'
          }`}
        />
        {item.label}
      </Link>
    );
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const helpdeskItems = navItems.filter((i) => i.section === 'HELPDESK');
  const timesheetItems = navItems.filter((i) => i.section === 'TIMESHEETS');
  const adminItems = navItems.filter((i) => i.section === 'ADMIN');
  const clientItems = navItems.filter((i) => i.section === 'CLIENT');
  const subclientItems = navItems.filter((i) => i.section === 'SUBCLIENT');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-900 transform transition-transform duration-300 ease-in-out shadow-lg ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 flex flex-col`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="p-1.5 rounded-md mr-3" style={{ backgroundColor: '#ef7c21' }}>
          <LifeBuoy className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          HelpDesk Pro
        </span>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        {helpdeskItems.length > 0 && (
          <div className="mb-4">
            <div className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Helpdesk
            </div>
            {helpdeskItems.map(renderNavItem)}
          </div>
        )}

        {timesheetItems.length > 0 && (
          <div className="mb-4">
            <div className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Timesheets
            </div>
            {timesheetItems.map(renderNavItem)}
          </div>
        )}

        {adminItems.length > 0 && (
          <div className="mb-4">
            <div className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Administration
            </div>
            {adminItems.map(renderNavItem)}
          </div>
        )}

        {clientItems.length > 0 && (
          <div className="mb-4">
            <div className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Company
            </div>
            {clientItems.map(renderNavItem)}
          </div>
        )}

        {subclientItems.length > 0 && (
          <div className="mb-4">
            <div className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Support
            </div>
            {subclientItems.map(renderNavItem)}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center p-2 rounded-lg bg-slate-50">
          <Avatar
            initials={currentUser.avatarInitials}
            color={currentUser.avatarColor}
            size="sm"
          />
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {currentUser.role} • {currentUser.team}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-[#ef7c21] ml-2 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
