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
  Plus
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import type { User, Ticket } from '../../../types';

interface AllAgentsProps {
  agents: User[];
  tickets: Ticket[];
}

export function AllAgents({ agents, tickets }: AllAgentsProps) {
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
    password: '',
    confirmPassword: '',
    services: [] as string[]
  });

  const servicesList = ['Windows', 'Development', 'Helpdesk'];

  // Password validation
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== '';
  const showPasswordError = formData.confirmPassword !== '' && formData.password !== formData.confirmPassword;

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service]
    }));
  };

  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.email.toLowerCase().includes(searchLower) ||
      agent.team.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getAgentStats = (agentId: string) => {
    const assigned = tickets.filter((t) => t.userId === agentId && t.status !== 'closed').length;
    const resolved = tickets.filter((t) => t.userId === agentId && t.status === 'closed').length;
    return { assigned, resolved };
  };

  const handleAgentClick = (agentId: string) => {
    navigate(`/agents/${agentId}`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Team Management</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" />
            Administration des accès agents
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-[#ef7c21] hover:scale-105 active:scale-95 text-white px-8 py-3.5 rounded-full text-xs font-black shadow-xl shadow-orange-100 transition-all uppercase tracking-widest"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Ajouter Agent
        </button>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]" noPadding>
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un collaborateur..."
              className="w-full pl-11 pr-4 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ef7c21]/20 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <Filter className="h-3.5 w-3.5 mr-2" /> Filtrer Équipe
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipe</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignés</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Résolus</th>
                <th className="relative px-8 py-5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAgents.map((agent) => {
                const stats = getAgentStats(agent.id);
                return (
                  <tr
                    key={agent.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleAgentClick(agent.id)}
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          initials={agent.avatarInitials}
                          size="md"
                          className="shadow-sm font-bold bg-slate-200 text-slate-600"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-black text-slate-800 tracking-tight">{agent.name}</div>
                          <div className="text-[11px] text-slate-400 font-bold italic">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-xs font-black text-slate-500 uppercase tracking-widest italic">
                      {agent.team}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-blue-600 border border-blue-100">
                        {stats.assigned}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {stats.resolved}
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
            Affichage page {currentPage} sur {totalPages || 1}
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

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
            <div className="bg-[#ef7c21] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">Ajouter un agent</h3>
                <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80 italic underline decoration-orange-300">
                  Nouveau profil collaborateur
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-black/10 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              className="p-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordsMatch) setShowAddModal(false);
              }}
            >
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</p>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                    placeholder="Sarah"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</p>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                    placeholder="Dubois"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Professionnel</p>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-11 pr-5 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
                    placeholder="agent@support.com"
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</p>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      className="w-full pl-11 pr-4 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 ring-orange-100 transition-all"
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
                      className={`w-full pl-11 pr-10 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 transition-all ${
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
                    Les mots de passe ne correspondent pas
                  </p>
                </div>
              )}

              {/* Service Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" /> Services
                </p>
                <div className="flex flex-wrap gap-2">
                  {servicesList.map((service) => {
                    const isSelected = formData.services.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleServiceToggle(service)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                          isSelected
                            ? 'bg-orange-50 border-[#ef7c21] text-[#ef7c21] scale-105'
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {service.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-2xl h-14 transition-all border border-red-100"
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
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
