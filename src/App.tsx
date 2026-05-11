import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './Pages/LoginPage';
import { Dashboard } from './Pages/Dashboard';
import { TicketsList } from './Pages/Helpdesk/Ticket/TicketsList';
import { TicketDetail } from './Pages/Helpdesk/Ticket/TicketDetail';
import { CreateTicket } from './Pages/Helpdesk/Ticket/CreateTicket';
import { Timesheets } from './Pages/Timesheets/Timesheets';
import { TimesheetValidation } from './Pages/Timesheets/TimesheetValidation';
import { AllAgents } from './Pages/Helpdesk/Ticket/AllAgents';
import { AllClients } from './Pages/Helpdesk/Ticket/AllClients';
import { AgentDetail } from './Pages/Helpdesk/Ticket/AgentDetail';
import { ClientDetail } from './Pages/Helpdesk/Ticket/ClientDetail';
import { Knowledge } from './Pages/Helpdesk/Knowledge/Knowledge';
import { ClientDashboard } from './Pages/Helpdesk/Ticket/ClientDashboard';
import { SubClientDashboard } from './Pages/Helpdesk/Ticket/SubClientDashboard';
import { USERS, TICKETS, TIMESHEETS, PROJECTS } from './data/mockData';
import type { Ticket, User, TicketStatus, TimesheetTask, Timesheet } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS);
  const [timesheets, setTimesheets] = useState<Timesheet[]>(TIMESHEETS);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleCreateTicket = (newTicketData: any) => {
    const newTicket: Ticket = {
      ...newTicketData,
      id: `T-${1000 + tickets.length + 1}`,
      datePosted: new Date().toISOString(),
      status: 'fresh',
      userId: null,
      clientId:
        currentUser.role === 'subclient'
          ? currentUser.clientCompanyId || 'c-new'
          : 'c-new',
      clientEmail: currentUser.email,
      clientName: currentUser.name,
      subClientUserId:
        currentUser.role === 'subclient' ? currentUser.id : undefined
    };
    setTickets([newTicket, ...tickets]);
  };

  const handleUpdateTicketStatus = (
    ticketId: string,
    status: TicketStatus,
    userId?: string
  ) => {
    setTickets(
      tickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status,
            userId: userId || t.userId
          };
        }
        return t;
      })
    );
  };

  // Timesheet handlers
  const handleSaveTask = (task: TimesheetTask) => {
    setTimesheets(
      timesheets.map((ts) => {
        if (ts.userId === currentUser.id) {
          return {
            ...ts,
            tasks: [...ts.tasks, task],
            totalHours: ts.totalHours + task.hours
          };
        }
        return ts;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTimesheets(
      timesheets.map((ts) => {
        if (ts.userId === currentUser.id) {
          const taskToDelete = ts.tasks.find((t) => t.id === taskId);
          return {
            ...ts,
            tasks: ts.tasks.filter((t) => t.id !== taskId),
            totalHours: ts.totalHours - (taskToDelete?.hours || 0)
          };
        }
        return ts;
      })
    );
  };

  const handleSubmitTimesheet = () => {
    setTimesheets(
      timesheets.map((ts) => {
        if (ts.userId === currentUser.id && ts.status === 'draft') {
          return { ...ts, status: 'submitted' };
        }
        return ts;
      })
    );
  };

  const handleValidateTimesheet = (timesheetId: string) => {
    setTimesheets(
      timesheets.map((ts) => {
        if (ts.id === timesheetId) {
          return { ...ts, status: 'validated', validatedBy: currentUser.id };
        }
        return ts;
      })
    );
  };

  const handleRejectTimesheet = (timesheetId: string) => {
    setTimesheets(
      timesheets.map((ts) => {
        if (ts.id === timesheetId) {
          return { ...ts, status: 'rejected' };
        }
        return ts;
      })
    );
  };

  const handleCloseTicketWithRating = (ticketId: string, rating: number, comment: string) => {
    setTickets(
      tickets.map((t) => {
        if (t.id === ticketId) {
          return { ...t, status: 'archived' as TicketStatus, rating, feedback: comment };
        }
        return t;
      })
    );
  };

  // Helper functions
  const getCurrentUserTimesheet = () => {
    return timesheets.find((ts) => ts.userId === currentUser.id);
  };

  const getAgents = () => {
    return USERS.filter((u) => u.role === 'agent' || u.role === 'Admin');
  };

  const getClients = () => {
    return USERS.filter((u) => u.role === 'client');
  };

  const getSubclients = (clientId?: string) => {
    if (clientId) {
      return USERS.filter((u) => u.role === 'subclient' && u.clientCompanyId === clientId);
    }
    return USERS.filter((u) => u.role === 'subclient' && u.clientCompanyId === currentUser.id);
  };

  const getClientTickets = () => {
    return tickets.filter((t) => t.clientId === currentUser.id);
  };

  const getSubclientTickets = () => {
    return tickets.filter((t) => t.subClientUserId === currentUser.id);
  };

  const getPageTitle = (pathname: string) => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/tickets') return 'All Tickets';
    if (pathname === '/my-tickets') return 'My Tickets';
    if (pathname.startsWith('/tickets/')) return 'Ticket Details';
    if (pathname === '/create-ticket') return 'Create Ticket';
    if (pathname === '/timesheets') return 'My Timesheet';
    if (pathname === '/validation') return 'Timesheet Validation';
    if (pathname === '/agents') return 'All Agents';
    if (pathname === '/clients') return 'All Clients';
    if (pathname === '/knowledge') return 'Knowledge Base';
    if (pathname === '/company') return 'Company Overview';
    if (pathname === '/my-dashboard') return 'My Dashboard';
    return 'HelpDesk Pro';
  };

  const getDefaultRoute = () => {
    if (currentUser.role === 'client') return '/company';
    if (currentUser.role === 'subclient') return '/my-dashboard';
    return '/dashboard';
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LoginPage users={USERS} onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <AppLayout
              currentUser={currentUser}
              title={getPageTitle(window.location.pathname)}
              onLogout={handleLogout}
            >
              <Routes>
                <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
                <Route
                  path="/dashboard"
                  element={<Dashboard tickets={tickets} currentUser={currentUser} />}
                />
                <Route
                  path="/tickets"
                  element={
                    <TicketsList
                      currentUser={currentUser}
                      mode="all"
                    />
                  }
                />
                <Route
                  path="/my-tickets"
                  element={
                    <TicketsList
                      currentUser={currentUser}
                      mode="my-tickets"
                    />
                  }
                />
                <Route
                  path="/tickets/:id"
                  element={
                    <TicketDetail
                      tickets={tickets}
                      currentUser={currentUser}
                      onUpdateStatus={handleUpdateTicketStatus}
                    />
                  }
                />
                <Route
                  path="/create-ticket"
                  element={<CreateTicket onSubmit={handleCreateTicket} />}
                />
                <Route
                  path="/company"
                  element={
                    <ClientDashboard
                      tickets={getClientTickets()}
                      currentUser={currentUser}
                      subclients={getSubclients()}
                      onCloseTicket={handleCloseTicketWithRating}
                    />
                  }
                />
                <Route
                  path="/my-dashboard"
                  element={
                    <SubClientDashboard
                      tickets={getSubclientTickets()}
                      currentUser={currentUser}
                    />
                  }
                />
                <Route
                  path="/company-tickets"
                  element={
                    <TicketsList
                      currentUser={currentUser}
                      mode="all"
                    />
                  }
                />
                <Route
                  path="/timesheets"
                  element={
                    <Timesheets
                      currentUser={currentUser}
                      timesheet={getCurrentUserTimesheet()}
                      projects={PROJECTS}
                      onSaveTask={handleSaveTask}
                      onDeleteTask={handleDeleteTask}
                      onSubmitTimesheet={handleSubmitTimesheet}
                    />
                  }
                />
                <Route
                  path="/validation"
                  element={
                    <TimesheetValidation
                      timesheets={timesheets}
                      users={USERS}
                      onValidate={handleValidateTimesheet}
                      onReject={handleRejectTimesheet}
                    />
                  }
                />
                <Route
                  path="/agents"
                  element={
                    <AllAgents
                      agents={getAgents()}
                      tickets={tickets}
                    />
                  }
                />
                <Route
                  path="/agents/:id"
                  element={
                    <AgentDetail
                      users={USERS}
                      tickets={tickets}
                    />
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <AllClients
                      clients={getClients()}
                      tickets={tickets}
                      agents={getAgents()}
                    />
                  }
                />
                <Route
                  path="/clients/:id"
                  element={
                    <ClientDetail
                      users={USERS}
                      tickets={tickets}
                    />
                  }
                />
                <Route
                  path="/knowledge"
                  element={<Knowledge />}
                />
                <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
