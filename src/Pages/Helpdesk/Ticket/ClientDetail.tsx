import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Mail,
  Phone,
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  UserPlus,
  X,
  Edit2,
  Trash2,
  Send,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import type { User, Ticket } from '../../../types';

interface ClientDetailProps {
  users: User[];
  tickets: Ticket[];
}

export function ClientDetail({ users, tickets }: ClientDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<'tickets' | 'team'>('tickets');
  const [modalType, setModalType] = useState<'none' | 'ticket' | 'subclient'>('none');

  // Sub-client states
  const [editingSubclient, setEditingSubclient] = useState<User | null>(null);
  const [subForm, setSubForm] = useState({ name: '', email: '', password: '' });

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    service: 'helpdesk',
    priority: 'moyenne',
    description: ''
  });

  const client = users.find((u) => u.id === id && u.role === 'client');
  const subclients = users.filter((u) => u.role === 'subclient' && u.clientCompanyId === id);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 font-bold">Client not found</p>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 text-[#ef7c21] font-bold hover:underline"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const clientTickets = tickets.filter((t) => t.clientId === client.id);
  const openTickets = clientTickets.filter((t) => t.status !== 'closed');

  const closeModal = () => {
    setModalType('none');
    setEditingSubclient(null);
    setSubForm({ name: '', email: '', password: '' });
    setTicketForm({ subject: '', service: 'helpdesk', priority: 'moyenne', description: '' });
  };

  const handleEditClick = (sub: User) => {
    setEditingSubclient(sub);
    setSubForm({ name: sub.name, email: sub.email, password: '' });
    setModalType('subclient');
  };

  const handleDeleteSub = (subId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible.')) {
      console.log('Deleting subclient ID:', subId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'ticket') {
      console.log('Creating Ticket for', client.id, ticketForm);
    } else {
      console.log(editingSubclient ? 'Updating Sub-client' : 'Creating Sub-client', subForm);
    }
    closeModal();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Modal */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#ef7c21] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
                  {modalType === 'ticket' ? 'Nouveau Ticket' : editingSubclient ? 'Modifier Membre' : 'Nouveau Membre'}
                </h3>
                <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80 italic">
                  Compte: {client.team}
                </p>
              </div>
              <button onClick={closeModal} className="p-3 hover:bg-black/10 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form className="p-8 space-y-4" onSubmit={handleSubmit}>
              {modalType === 'ticket' ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sujet du problème</p>
                    <input
                      type="text"
                      required
                      placeholder="Sujet..."
                      className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service</p>
                      <select
                        className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                        value={ticketForm.service}
                        onChange={(e) => setTicketForm({ ...ticketForm, service: e.target.value })}
                      >
                        <option value="developpement">Développement</option>
                        <option value="windows">Windows</option>
                        <option value="helpdesk">Helpdesk</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priorité</p>
                      <select
                        className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      >
                        <option value="bas">Bas</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="élevé">Élevé</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description détaillée</p>
                    <textarea
                      rows={4}
                      required
                      className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none resize-none"
                      placeholder="Expliquez le problème..."
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</p>
                    <input
                      type="text"
                      required
                      value={subForm.name}
                      className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none"
                      onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Professionnel</p>
                    <input
                      type="email"
                      required
                      value={subForm.email}
                      className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none"
                      onChange={(e) => setSubForm({ ...subForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {editingSubclient ? 'Changer le mot de passe (optionnel)' : 'Mot de passe provisoire'}
                    </p>
                    <input
                      type="password"
                      required={!editingSubclient}
                      className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none"
                      onChange={(e) => setSubForm({ ...subForm, password: e.target.value })}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-[#ef7c21] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl h-16 shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
              >
                {modalType === 'ticket' && <Send className="h-4 w-4" />}
                {modalType === 'ticket'
                  ? 'Créer le Ticket'
                  : editingSubclient
                  ? 'Enregistrer les modifications'
                  : 'Ajouter au compte'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => navigate('/clients')}
        className="group flex items-center text-slate-400 hover:text-[#ef7c21] transition-colors"
      >
        <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Retour au listing</span>
      </button>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ef7c21] to-orange-400 rounded-[2.5rem] opacity-10" />
        <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar
              initials={client.avatarInitials}
              size="lg"
              className="h-24 w-24 text-2xl font-black shadow-2xl ring-4 ring-white bg-white text-[#ef7c21]"
            />
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{client.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black bg-white text-[#ef7c21] px-3 py-1 rounded-full shadow-sm uppercase tracking-widest border border-orange-100">
                  {client.team}
                </span>
                <span className="text-xs font-bold text-slate-400 italic">Partenaire depuis 2023</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border-2 border-slate-100 p-4 rounded-2xl hover:border-[#ef7c21] hover:text-[#ef7c21] transition-all shadow-sm">
              <Mail className="h-5 w-5" />
            </button>
            <button
              onClick={() => setModalType('ticket')}
              className="bg-[#ef7c21] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all"
            >
              Nouveau Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2rem] p-6 shadow-xl border-none bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" /> Indicateurs Clés
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                <p className="text-[10px] font-black text-[#ef7c21] uppercase">Tickets</p>
                <p className="text-2xl font-black text-[#ef7c21]">{openTickets.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase">Membres</p>
                <p className="text-2xl font-black text-slate-800">{subclients.length}</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] p-6 shadow-xl border-none bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Contact Principal</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-600">{client.email}</span>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-600">+33 1 23 45 67 89</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'tickets'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'bg-white text-slate-400 hover:text-slate-600'
              }`}
            >
              Historique Tickets
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'team'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'bg-white text-slate-400 hover:text-slate-600'
              }`}
            >
              Équipe Client ({subclients.length})
            </button>
          </div>

          {activeTab === 'tickets' ? (
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white" noPadding>
              <div className="divide-y divide-slate-100">
                {clientTickets.length > 0 ? (
                  clientTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="p-6 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                            t.status === 'closed' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-[#ef7c21]'
                          }`}
                        >
                          {t.status === 'closed' ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 group-hover:text-[#ef7c21] transition-colors">
                            {t.title}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 italic">
                            #{t.id} • Mis à jour {t.lastMessageTime || 'récemment'}
                          </p>
                        </div>
                      </div>
                      <ChevronLeft className="h-5 w-5 text-slate-300 rotate-180 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center text-slate-300 italic flex flex-col items-center gap-3">
                    <TicketIcon className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-bold">Aucun ticket pour le moment</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white" noPadding>
              <div className="p-8 border-b flex justify-between items-center bg-white">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Utilisateurs Autorisés</h3>
                <button
                  onClick={() => setModalType('subclient')}
                  className="flex items-center bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-2" /> Ajouter un membre
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody className="divide-y divide-slate-50">
                    {subclients.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 flex items-center gap-3">
                          <Avatar
                            initials={sub.name[0]}
                            size="sm"
                            className="bg-slate-100 text-[#ef7c21] font-bold h-10 w-10"
                          />
                          <div>
                            <div className="text-xs font-black text-slate-700">{sub.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{sub.email}</div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase italic">
                            <ShieldCheck className="h-3 w-3" /> Sub-client
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(sub)}
                              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-[#ef7c21]/10 hover:text-[#ef7c21] transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSub(sub.id)}
                              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
