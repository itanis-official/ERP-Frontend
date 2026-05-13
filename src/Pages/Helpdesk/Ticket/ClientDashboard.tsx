import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import type { Ticket, User } from '../../../types';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Send
} from 'lucide-react';

interface ClientDashboardProps {
  tickets: Ticket[];
  currentUser: User;
  subclients: User[];
  onCloseTicket?: (ticketId: string, rating: number, comment: string) => void;
}

export function ClientDashboard({
  tickets,
  currentUser,
  subclients,
  onCloseTicket
}: ClientDashboardProps) {
  const navigate = useNavigate();
  const [evaluatingTicket, setEvaluatingTicket] = useState<Ticket | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const ticketRequiringAction = tickets.find((t) => t.status === 'closed' && !t.rating);
    if (ticketRequiringAction) {
      setEvaluatingTicket(ticketRequiringAction);
    } else {
      setEvaluatingTicket(null);
    }
  }, [tickets]);

  const handleFinalSubmit = () => {
    if (rating === 0 || !evaluatingTicket) return;
    onCloseTicket?.(evaluatingTicket.id, rating, comment);
    setRating(0);
    setComment('');
    setEvaluatingTicket(null);
  };

  const stats = [
    { label: 'Total', value: tickets.length, icon: TicketIcon, color: 'bg-blue-500' },
    { label: 'Open', value: tickets.filter((t) => t.status === 'fresh').length, icon: AlertCircle, color: 'bg-cyan-500' },
    { label: 'Pending', value: tickets.filter((t) => t.status === 'pending').length, icon: Clock, color: 'bg-amber-500' },
    {
      label: 'Resolved',
      value: tickets.filter((t) => t.status === 'closed' || t.status === 'archived').length,
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
    .slice(0, 5);

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Company Overview</h2>
          <p className="text-sm text-slate-500">Welcome back, {currentUser.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden h-full" noPadding>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <h3 className="font-semibold text-slate-900">Recent Tickets</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/company-tickets')}>
                View All
              </Button>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase text-[10px]">Subject</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase text-[10px]">Requester</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-500 uppercase text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900">{ticket.title}</div>
                        <div className="text-[10px] text-slate-400">{ticket.id}</div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{ticket.clientName}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <Card className="h-full">
          <h3 className="font-semibold text-slate-900 mb-4">Team</h3>
          <div className="space-y-3">
            {subclients.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full ${sub.avatarColor} flex items-center justify-center text-[10px] text-white font-bold`}
                >
                  {sub.avatarInitials}
                </div>
                <div className="text-xs truncate">
                  <p className="font-medium text-slate-900">{sub.name}</p>
                  <p className="text-slate-500">{sub.email}</p>
                </div>
              </div>
            ))}
            {subclients.length === 0 && (
              <p className="text-sm text-slate-400 italic">No team members yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Evaluation Modal */}
      {evaluatingTicket && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <Card
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-200"
            noPadding
          >
            {/* Header */}
            <div className="bg-[#10b981] px-6 py-4 text-white flex items-center gap-4">
              <CheckCircle className="h-6 w-6 text-white" />
              <div>
                <h3 className="text-lg font-bold leading-tight">Ticket Résolu</h3>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">
                  Évaluation requise pour continuer
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Ticket Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm truncate pr-4">{evaluatingTicket.title}</h4>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border">
                    {evaluatingTicket.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "L'intervention est terminée. Le problème a été résolu."
                </p>
              </div>

              {/* Star Rating */}
              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notez le service</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 fill-slate-50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Commentaire</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 ring-emerald-500/20 transition-all resize-none"
                  placeholder="Un petit mot... (optionnel)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                disabled={rating === 0}
                onClick={handleFinalSubmit}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${
                  rating > 0
                    ? 'bg-[#10b981] text-white shadow-lg shadow-emerald-100 hover:bg-[#059669]'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
                Valider et Débloquer
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
