import { useNavigate, useParams } from 'react-router-dom';
import type { User, Ticket } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  Activity,
  Star,
  Settings,
  Trash2,
  Terminal,
  Monitor,
  Headphones,
  TrendingUp
} from 'lucide-react';

interface AgentDetailProps {
  users: User[];
  tickets: Ticket[];
  onEdit?: (agentId: string) => void;
  onDelete?: (agentId: string) => void;
}

export function AgentDetail({ users, tickets, onEdit, onDelete }: AgentDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const agent = users.find((u) => u.id === id && (u.role === 'agent' || u.role === 'Admin'));

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 font-bold">Agent not found</p>
        <button
          onClick={() => navigate('/agents')}
          className="mt-4 text-[#ef7c21] font-bold hover:underline"
        >
          Back to Agents
        </button>
      </div>
    );
  }

  const agentTickets = tickets.filter((t) => t.userId === agent.id);
  const assignedCount = agentTickets.filter((t) => t.status !== 'closed').length;
  const resolvedCount = agentTickets.filter((t) => t.status === 'closed').length;

  // Mock performance data
  const rating = 4.8;
  const totalReviews = 124;
  const specialty = agent.team || 'Helpdesk';

  const getSpecialtyIcon = () => {
    switch (specialty.toLowerCase()) {
      case 'development':
        return <Terminal className="h-5 w-5" />;
      case 'windows':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Headphones className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Navigation & Actions */}
      <div className="flex justify-between items-center px-2">
        <button
          onClick={() => navigate('/agents')}
          className="group flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#ef7c21] transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Agents
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(agent.id)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Settings className="h-3.5 w-3.5" /> Modifier
          </button>
          <button
            onClick={() => onDelete?.(agent.id)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </button>
        </div>
      </div>

      {/* Main Profile Header */}
      <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white" noPadding>
        <div className="p-8 flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                initials={agent.avatarInitials || agent.name[0]}
                size="lg"
                className="h-24 w-24 text-2xl font-black shadow-2xl ring-4 ring-white bg-slate-100 text-[#ef7c21]"
              />
              <span className="absolute bottom-1 right-1 block h-6 w-6 rounded-full bg-emerald-500 border-4 border-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{agent.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black bg-orange-50 text-[#ef7c21] px-3 py-1 rounded-full uppercase tracking-widest">
                  Agent {agent.team || 'Expert'}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[11px] font-black text-slate-400 uppercase">
                    {rating} ({totalReviews} avis)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:w-40 bg-orange-50/50 border border-orange-100 p-5 rounded-[2rem] text-center group hover:bg-[#ef7c21] transition-all duration-300">
              <Clock className="h-6 w-6 text-[#ef7c21] mx-auto mb-2 group-hover:text-white transition-colors" />
              <div className="text-3xl font-black text-[#ef7c21] group-hover:text-white">{assignedCount}</div>
              <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest group-hover:text-orange-100">
                Assignés
              </div>
            </div>
            <div className="flex-1 lg:w-40 bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] text-center group hover:bg-emerald-500 transition-all duration-300">
              <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2 group-hover:text-white transition-colors" />
              <div className="text-3xl font-black text-emerald-700 group-hover:text-white">{resolvedCount}</div>
              <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest group-hover:text-emerald-100">
                Résolus
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance & Specialty */}
        <Card className="lg:col-span-1 rounded-[2rem] p-8 border-none shadow-lg">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#ef7c21]" /> Domaines d'expertise
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[#ef7c21] shadow-sm">
                  {getSpecialtyIcon()}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Spécialité Principale</p>
                  <p className="text-sm font-black text-slate-700 uppercase">{specialty}</p>
                </div>
              </div>
              <div className="h-2 w-12 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#ef7c21] w-[85%]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {['Support N3', 'Cloud Security', 'API Management'].map((skill) => (
                <div key={skill} className="px-4 py-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{skill}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Activity List */}
        <Card className="lg:col-span-2 rounded-[2rem] p-8 border-none shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-[#ef7c21]" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Activités récentes</h3>
          </div>

          <div className="space-y-3">
            {agentTickets.length > 0 ? (
              agentTickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        ticket.status === 'closed' ? 'bg-emerald-400' : 'bg-orange-400'
                      }`}
                    />
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-[#ef7c21] transition-colors">
                        #{ticket.id} — {ticket.title}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 italic">
                        Action: {ticket.status === 'closed' ? 'Clôture du dossier' : 'Nouvelle assignation'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">2h ago</span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                <p className="text-xs font-bold text-slate-400 italic">Aucune activité enregistrée.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
