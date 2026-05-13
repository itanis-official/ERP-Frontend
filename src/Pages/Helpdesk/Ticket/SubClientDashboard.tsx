import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { Ticket, User } from '../../../types';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle,
  Plus,
  MessageSquare
} from 'lucide-react';

interface SubClientDashboardProps {
  tickets: Ticket[];
  currentUser: User;
}

export function SubClientDashboard({ tickets, currentUser }: SubClientDashboardProps) {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'My Tickets',
      value: tickets.length,
      icon: TicketIcon,
      color: 'bg-blue-500'
    },
    {
      label: 'In Progress',
      value: tickets.filter((t) => t.status === 'pending').length,
      icon: Clock,
      color: 'bg-amber-500'
    },
    {
      label: 'Resolved',
      value: tickets.filter((t) => t.status === 'closed').length,
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">My Dashboard</h2>
          <p className="text-sm text-slate-500">Welcome back, {currentUser.name}</p>
        </div>
        <Button onClick={() => navigate('/create-ticket')}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center p-4">
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 mr-4`}>
              <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Tickets */}
      <Card className="overflow-hidden" noPadding>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h3 className="font-semibold text-slate-900">My Recent Tickets</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-tickets')}>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Action
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
                    <div className="text-sm font-medium text-slate-900">{ticket.title}</div>
                    <div className="text-xs text-slate-500">{ticket.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {ticket.lastMessageTime || 'Just now'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tickets/${ticket.id}`);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    You haven't created any tickets yet.
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
