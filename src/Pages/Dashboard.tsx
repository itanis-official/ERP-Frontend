import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Ticket, User } from '../types';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  CirclePause
} from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  currentUser: User;
}

export function Dashboard({ tickets, currentUser }: DashboardProps) {
  const navigate = useNavigate();

  const visibleTickets = tickets.filter(() => {
    if (currentUser.role === 'manager') return true;
    return true;
  });

  const stats = [
    {
      label: 'Total Tickets',
      value: visibleTickets.length,
      icon: TicketIcon,
      color: 'bg-blue-500'
    },
    {
      label: 'Fresh',
      value: visibleTickets.filter((t) => t.status === 'fresh').length,
      icon: AlertCircle,
      color: 'bg-cyan-500'
    },
    {
      label: 'Pending',
      value: visibleTickets.filter((t) => t.status === 'pending').length,
      icon: Clock,
      color: 'bg-amber-500'
    },
    {
      label: 'Paused',
      value: visibleTickets.filter((t) => t.status === 'paused').length,
      icon: CirclePause,
      color: 'bg-purple-500'
    },
    {
      label: 'Closed',
      value: visibleTickets.filter((t) => t.status === 'closed').length,
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  const recentTickets = [...visibleTickets]
    .sort(
      (a, b) =>
        new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">
            Welcome back, {currentUser.name}
          </p>
        </div>
        <Button onClick={() => navigate('/create-ticket')}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center p-4">
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 mr-4`}>
              <stat.icon
                className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden" noPadding>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h3 className="font-semibold text-slate-900">Recent Tickets</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {ticket.title}
                    </div>
                    <div className="text-xs text-slate-500">{ticket.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {ticket.clientName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ticket.clientEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(ticket.datePosted).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
