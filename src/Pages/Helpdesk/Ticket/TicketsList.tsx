import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../../types';
import type { Ticket } from '../../../types/helpdesk';
import { ticketService } from '../../../Services/helpdesk/ticketService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { CreateTicketModal } from './CreateTicketModal';
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';

interface TicketsListProps {
  currentUser: User;
  mode?: 'all' | 'my-tickets';
}

export function TicketsList({ currentUser, mode = 'all' }: TicketsListProps) {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  // ─── API Data ───────────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    setError(false);

    const request =
      mode === 'my-tickets' && currentUser.id
        ? ticketService.getByAgent(currentUser.id)
        : ticketService.getAll();

    request
      .then((data) => setTickets(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [mode, currentUser.id]);

  // ─── Enum labels ────────────────────────────────────────────────────────────
  const statutLabel: Record<number, string> = {
    0: 'Nouveau',
    1: 'En attente',
    2: 'Rejeté',
    3: 'Ouvert',
    4: 'En pause',
    5: 'Clos',
    6: 'Réservé',
  };

  const prioriteLabel: Record<number, string> = {
    0: 'Basse',
    1: 'Moyenne',
    2: 'Haute',
    3: 'Critique',
  };

  // ─── Filtering ──────────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== 'all' && String(ticket.statut) !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        ticket.titre.toLowerCase().includes(q) ||
        ticket.clientId.toLowerCase().includes(q) ||
        String(ticket.id).includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateTicket = async (ticketData: any) => {
    try {
      const created = await ticketService.create(ticketData);
      setTickets((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  // ─── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement des tickets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Impossible de charger les tickets.</p>
        <Button onClick={fetchTickets} variant="outline">Réessayer</Button>
      </div>
    );
  }

  const statusTabs = [
    { value: 'all', label: 'Tous' },
    { value: '0', label: 'Nouveau' },
    { value: '1', label: 'En attente' },
    { value: '3', label: 'Ouvert' },
    { value: '5', label: 'Clos' },
  ];

  return (
    <>
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTicket}
      />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'all' ? 'All Tickets' : 'My Tickets'}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'all' ? 'All support requests' : 'Tickets assigned to you'}
            </p>
          </div>
          {currentUser.role !== 'client' && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New ticket
            </Button>
          )}
        </div>

        <Card className="flex flex-col" noPadding>
          {/* Search bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={mode === 'all' ? 'Search in all tickets...' : 'Search in my tickets...'}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}>
              <Filter className="h-3 w-3 mr-2" />
              Reset filter
            </Button>
          </div>

          {/* Status tabs */}
          <div className="flex border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setFilterStatus(tab.value); setCurrentPage(1); }}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  filterStatus === tab.value
                    ? 'border-[#ef7c21] text-[#ef7c21]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.value === 'all'
                    ? tickets.length
                    : tickets.filter((t) => String(t.statut) === tab.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-[#ef7c21] focus:ring-[#ef7c21]" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sujet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priorité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Créé le</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300 text-[#ef7c21] focus:ring-[#ef7c21]" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          initials={ticket.clientId.slice(0, 2).toUpperCase()}
                          className="mr-3 bg-slate-400"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{ticket.clientId}</div>
                          {ticket.sousClientId && (
                            <div className="text-xs text-slate-500">{ticket.sousClientId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900 font-medium truncate max-w-xs block">{ticket.titre}</span>
                      {ticket.description && (
                        <span className="text-xs text-slate-400 truncate max-w-xs block">{ticket.description}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        ticket.priorite === 3 ? 'bg-red-100 text-red-700' :
                        ticket.priorite === 2 ? 'bg-orange-100 text-orange-700' :
                        ticket.priorite === 1 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {prioriteLabel[ticket.priorite]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        ticket.statut === 3 ? 'bg-emerald-100 text-emerald-700' :
                        ticket.statut === 5 ? 'bg-slate-100 text-slate-600' :
                        ticket.statut === 2 ? 'bg-red-100 text-red-700' :
                        ticket.statut === 4 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {statutLabel[ticket.statut]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(ticket.dateCreation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedTickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900">Aucun ticket trouvé</p>
                        <p className="text-sm text-slate-500">Essayez de modifier vos filtres.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <p className="text-sm text-slate-700">
                Affichage <span className="font-medium">{filteredTickets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> sur{' '}
                <span className="font-medium">{filteredTickets.length}</span> résultats
              </p>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === idx + 1
                        ? 'z-10 bg-orange-50 border-[#ef7c21] text-[#ef7c21]'
                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}