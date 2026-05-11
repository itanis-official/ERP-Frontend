import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  X,
  Check,
  Lock,
  AlertCircle,
  Building2,
  Phone,
  UserCheck,
  Timer
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import type { User, Ticket } from '../../../types';

interface AllClientsProps {
  clients: User[];
  tickets: Ticket[];
  agents: User[];
}

export function AllClients({ clients, tickets, agents }: AllClientsProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 8;

  // Form State
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    entreprise: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    agentDedie: '',
    resolutionTime: 4
  });

  const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== '';
  const showPasswordError = formData.confirmPassword !== '' && formData.password !== formData.confirmPassword;

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.team.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getClientStats = (clientId: string) => {
    const total = tickets.filter((t) => t.clientId === clientId).length;
    const open = tickets.filter((t) => t.clientId === clientId && t.status !== 'closed').length;
    return { total, open };
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Client Directory</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" />
            Gestion de la base client et comptes
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-[#ef7c21] hover:scale-105 active:scale-95 text-white px-8 py-3.5 rounded-full text-xs font-black shadow-xl shadow-orange-100 transition-all uppercase tracking-widest"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Nouveau Client
        </button>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]" noPadding>
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un client ou entreprise..."
              className="w-full pl-11 pr-4 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ef7c21]/20 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <Filter className="h-3.5 w-3.5 mr-2" /> Filtrer Statut
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Contact Client
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Entreprise
                </th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tickets Ouverts
                </th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Tickets
                </th>
                <th className="relative px-8 py-5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.map((client) => {
                const stats = getClientStats(client.id);
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleClientClick(client.id)}
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          initials={client.avatarInitials}
                          size="md"
                          className="shadow-sm font-bold bg-slate-100 text-[#ef7c21]"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-black text-slate-800 tracking-tight">{client.name}</div>
                          <div className="text-[11px] text-slate-400 font-bold italic">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                        <Building2 className="h-3 w-3" /> {client.team}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-orange-50 text-[#ef7c21] border border-orange-100">
                        {stats.open}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                        {stats.total}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <MoreHorizontal className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Page {currentPage} sur {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 my-8">
            <div className="bg-[#ef7c21] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">Nouveau Client</h3>
                <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80 italic underline decoration-orange-300">
                  Création de fiche partenaire
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-black/10 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              className="p-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordsMatch) setShowAddModal(false);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</p>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</p>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entreprise</p>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                      placeholder="Nom de la société"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</p>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                      placeholder="01 23 45..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Client</p>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                    placeholder="contact@client.com"
                    required
                  />
                </div>
              </div>

              {/* Agent & Resolution Time */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agent Dédié</p>
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all appearance-none cursor-pointer"
                      value={formData.agentDedie}
                      onChange={(e) => setFormData({ ...formData, agentDedie: e.target.value })}
                      required
                    >
                      <option value="" disabled>Sélectionner un agent</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Délai Résolution (H)</p>
                  <div className="relative">
                    <Timer className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                      value={formData.resolutionTime}
                      onChange={(e) => setFormData({ ...formData, resolutionTime: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</p>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmation</p>
                  <div className="relative">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${
                        passwordsMatch ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    />
                    <input
                      type="password"
                      className={`w-full pl-11 pr-10 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 transition-all ${
                        showPasswordError
                          ? 'ring-red-500/50 bg-red-50'
                          : passwordsMatch
                          ? 'ring-emerald-500/50 bg-emerald-50'
                          : 'ring-orange-100'
                      }`}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                    {passwordsMatch && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-in zoom-in" />
                    )}
                  </div>
                </div>
              </div>

              {showPasswordError && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-xl animate-in slide-in-from-top-1">
                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                  <p className="text-[9px] font-black text-white uppercase tracking-widest">
                    Incohérence des mots de passe
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl h-14 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!passwordsMatch}
                  className={`flex-1 font-black text-[10px] uppercase tracking-widest rounded-2xl h-14 transition-all shadow-lg ${
                    passwordsMatch
                      ? 'bg-[#ef7c21] text-white shadow-orange-100 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  Créer Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
