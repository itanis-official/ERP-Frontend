import { useState } from 'react'
import { X, Calendar, DollarSign, User, Clock, Check, FileText, Briefcase, Users, Download, Upload, Eye, Trash2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { opportunityApi, type Opportunity, type PhaseDetail, type Agent } from '../lib/opportunityApi'
import { companyApi } from '../lib/companyApi'
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";

interface OpportunityDetailModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

const agents: Agent[] = [
  { id: "1", name: "Jean Dupont", avatar: "JD" },
  { id: "2", name: "Marie Martin", avatar: "MM" },
  { id: "3", name: "Pierre Durand", avatar: "PD" },
  { id: "4", name: "Sophie Bernard", avatar: "SB" },
];

const getStageColor = (stage: string) => {
  switch (stage) {
    case "prospection": return "bg-gray-100 text-gray-800";
    case "qualification": return "bg-blue-100 text-blue-800";
    case "negociation": return "bg-orange-100 text-orange-800";
    case "gagnee": return "bg-green-100 text-green-800";
    case "perdue": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStageLabel = (stage: string) => {
  switch (stage) {
    case "prospection": return "Prospection";
    case "qualification": return "Qualification";
    case "negociation": return "Négociation";
    case "gagnee": return "Gagnée";
    case "perdue": return "Perdue";
    default: return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
};

export function OpportunityDetailModal({ opportunity, onClose }: OpportunityDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPhase, setCurrentPhase] = useState(0);

  const [phases, setPhases] = useState<Record<string, PhaseDetail>>({
    meeting: { status: "in_progress", notes: "", dueDate: "", hasDate: true, date: "2024-03-15", time: "14:30" },
    study: { status: "pending", notes: "", dueDate: "2024-03-22", progress: 65, validated: false, study: null, agent: "1" },
    offer: { status: "pending", notes: "", dueDate: "", offer: null, costs: null, amount: "", sentDate: "", validUntil: "", feedback: "" },
    contract: { status: "pending", notes: "", dueDate: "", contract: null, signed: false, reference: "", signDate: "" },
  });

  const [documents, setDocuments] = useState<Array<{ id: string; name: string; type: string; date: string; uploadedBy: string }>>([]);
  const [history] = useState([
    { id: "1", type: "created", description: "Opportunité créée", user: "Jean Dupont", avatar: "JD", date: "2024-03-01 10:30" },
    { id: "2", type: "stage", description: "Moved to Qualification", user: "Marie Martin", avatar: "MM", date: "2024-03-05 14:15" },
    { id: "3", type: "document", description: "Cahier des charges uploadé", user: "Pierre Durand", avatar: "PD", date: "2024-03-08 09:45" },
  ]);

  const { data: company } = useQuery({
    queryKey: ['company', opportunity.companyId],
    queryFn: async () => {
      try { return await companyApi.getById(opportunity.companyId) }
      catch { return null }
    },
    enabled: !!opportunity.companyId,
  })

  const getInitials = (name?: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handlePhaseUpload = (phase: string, file: File) => {
    console.log(`Upload for ${phase}:`, file);
    setDocuments([...documents, { id: Date.now().toString(), name: file.name, type: phase, date: new Date().toLocaleDateString(), uploadedBy: "Current User" }]);
  };

  const handleMarkComplete = (phaseKey: string) => {
    setPhases(prev => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey as keyof typeof phases], status: "completed" }
    }));
  };

  const phaseKeys = ["meeting", "study", "offer", "contract"];
  const phaseLabels = ["Réunion", "Étude", "Offre", "Contrat"];
  const phaseIcons = ["👥", "📊", "💰", "📄"];

  const goToPhase = (index: number) => {
    setCurrentPhase(index);
  };

  const nextPhase = () => {
    if (currentPhase < 3) setCurrentPhase(currentPhase + 1);
  };

  const previousPhase = () => {
    if (currentPhase > 0) setCurrentPhase(currentPhase - 1);
  };

  const getPhaseStatus = (phaseKey: string) => {
    return phases[phaseKey as keyof typeof phases].status;
  };

  const companyName = company?.raisonSociale || opportunity.company?.raisonSociale || 'Société';
  const companyInitials = getInitials(companyName);
  const budget = opportunity.valeurEstimee || 0;
  const probability = opportunity.probabilite || 50;
  const agentInfo = opportunity.agent || agents[0];
  const sector = opportunity.sector || company?.secteur || 'N/A';
  const lastUpdate = opportunity.lastUpdate || (opportunity.updatedAt ? new Date(opportunity.updatedAt).toLocaleDateString('fr-FR') : 'N/A');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[1200px] w-full h-[90vh] overflow-hidden flex flex-col">

        {/* Header - Gradient Orange */}
        <div className="bg-gradient-to-r from-[#E67E22] to-[#D35400] px-8 py-5 flex items-center justify-between text-white shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#E67E22] font-bold text-sm">{companyInitials}</span>
            </div>
            <div>
              <p className="text-xs text-orange-100">{companyName}</p>
              <h2 className="text-xl font-bold text-white">{opportunity.titre}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStageColor(opportunity.pipelineStage)} px-2 py-1 text-xs font-semibold`}>
              {getStageLabel(opportunity.pipelineStage)}
            </Badge>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-[#E9ECEF] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#E67E22]">💰 {budget.toLocaleString()}€</span>
          </div>

          <div className="h-8 w-px bg-[#E9ECEF]"></div>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="none" stroke="#E9ECEF" strokeWidth="2.5" />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#E67E22"
                  strokeWidth="2.5"
                  strokeDasharray={`${probability * 0.88} 88`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#E67E22]">{probability}%</span>
            </div>
            <span className="text-sm text-[#7F8C8D]">Probabilité</span>
          </div>

          <div className="h-8 w-px bg-[#E9ECEF]"></div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E67E22] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{agentInfo.avatar}</span>
            </div>
            <span className="text-sm font-medium text-[#2C3E50]">{agentInfo.name}</span>
          </div>

          <div className="h-8 w-px bg-[#E9ECEF]"></div>

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-[#7F8C8D]" />
            <span className="text-sm text-[#7F8C8D]">{lastUpdate}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E9ECEF] px-6 bg-white flex-shrink-0">
          <div className="flex gap-1">
            {[
              { id: "overview", label: "Vue d'ensemble", icon: "📋" },
              { id: "phases", label: "Phases du Projet", icon: "🔄" },
              { id: "documents", label: "Documents", icon: "📁" },
              { id: "history", label: "Historique", icon: "⏱️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 font-semibold border-b-2 transition-all duration-200 flex items-center gap-1 text-sm ${
                  activeTab === tab.id
                    ? "border-[#E67E22] text-[#E67E22]"
                    : "border-transparent text-[#7F8C8D] hover:text-[#2C3E50]"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="p-6 space-y-4">
              {/* Description */}
              <Card className="p-4 border border-[#E9ECEF] shadow-sm">
                <h3 className="text-base font-bold text-[#2C3E50] mb-2">Description</h3>
                <p className="text-sm text-[#5A6B7F] leading-relaxed">
                  {opportunity.description || "Aucune description disponible."}
                </p>
              </Card>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">SOCIÉTÉ</p>
                  <p className="text-sm font-bold text-[#2C3E50]">{companyName}</p>
                </Card>
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">SECTEUR</p>
                  <p className="text-sm font-bold text-[#2C3E50]">{sector}</p>
                </Card>
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">VALEUR</p>
                  <p className="text-base font-bold text-[#E67E22]">{budget.toLocaleString()}€</p>
                </Card>
                <Card className="p-3 border border-[#E9ECEF]">
                  <p className="text-xs font-semibold text-[#7F8C8D] mb-1">PROBABILITÉ</p>
                  <p className="text-base font-bold text-[#E67E22]">{probability}%</p>
                </Card>
              </div>

              {/* Labels */}
              <Card className="p-4 border border-[#E9ECEF]">
                <h4 className="text-xs font-bold text-[#2C3E50] mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">🎯 Prioritaire</Badge>
                  <Badge className="bg-green-100 text-green-800 text-xs">✅ Qualifiée</Badge>
                  <Badge className="bg-purple-100 text-purple-800 text-xs">💼 Budget OK</Badge>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "phases" && (
            <div className="flex flex-col h-full">
              {/* Phase Stepper */}
              <div className="bg-[#FAFAFA] px-8 py-4 border-b border-[#E9ECEF] flex-shrink-0">
                <div className="flex items-center justify-center">
                  {phaseKeys.map((phaseKey, idx) => {
                    const status = getPhaseStatus(phaseKey);
                    const isActive = idx === currentPhase;
                    const isCompleted = status === "completed";

                    return (
                      <div key={phaseKey} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => goToPhase(idx)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all cursor-pointer ${
                              isCompleted
                                ? "bg-[#27AE60] text-white shadow-lg ring-2 ring-green-200"
                                : isActive
                                ? "bg-[#E67E22] text-white shadow-lg ring-2 ring-orange-200 animate-pulse"
                                : "bg-[#E9ECEF] text-[#7F8C8D] hover:bg-[#DDD]"
                            }`}
                          >
                            {isCompleted ? "✓" : phaseIcons[idx]}
                          </button>
                          <p className={`text-xs font-semibold mt-2 ${isActive ? "text-[#E67E22]" : "text-[#7F8C8D]"}`}>
                            {phaseLabels[idx]}
                          </p>
                        </div>
                        {idx < 3 && (
                          <div className={`w-16 h-1 mx-3 rounded-full transition-all ${
                            isCompleted ? "bg-[#27AE60]" : "bg-[#E9ECEF]"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-right mt-2">
                  <span className="text-sm font-medium text-[#7F8C8D]">{currentPhase + 1}/4</span>
                </div>
              </div>

              {/* Phase Content */}
              <div className="flex-1 overflow-y-auto px-10 py-8" style={{ minHeight: "600px" }}>
                {/* Phase 0 - Réunion */}
                {currentPhase === 0 && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">{phaseIcons[0]}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-[#2C3E50]">Réunion Initiale</h3>
                          <div className="h-1 w-16 bg-[#E67E22] rounded mt-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Statut</Label>
                        <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                          <Badge className="bg-[#FFF3CD] text-[#856404] text-sm px-3 py-1">
                            📅 Planifiée
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date</Label>
                          <Input
                            type="date"
                            value={phases.meeting.date || ''}
                            className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base"
                            onChange={(e) =>
                              setPhases((prev) => ({
                                ...prev,
                                meeting: { ...prev.meeting, date: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Heure</Label>
                          <Input
                            type="time"
                            value={phases.meeting.time || ''}
                            className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base"
                            onChange={(e) =>
                              setPhases((prev) => ({
                                ...prev,
                                meeting: { ...prev.meeting, time: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Participants</Label>
                        <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                          <div className="flex gap-3">
                            {[agentInfo, agents[1], agents[2]].map((agent, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center ring-2 ring-white shadow">
                                  <span className="text-white text-sm font-bold">{agent.avatar}</span>
                                </div>
                                <span className="text-xs text-[#2C3E50]">{agent.name.split(' ')[0]}</span>
                              </div>
                            ))}
                            <button className="w-12 h-12 border-2 border-dashed border-[#BDC3C7] rounded-full flex items-center justify-center hover:border-[#E67E22] hover:bg-[#FFF5EC] transition-colors">
                              <span className="text-xl text-[#7F8C8D]">+</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Notes de la Réunion</Label>
                        <Textarea
                          placeholder="Ajouter des notes sur la réunion..."
                          className="min-h-[150px] bg-[#F8F9FA] border-[#E9ECEF] rounded-xl resize-none text-base p-4"
                          value={phases.meeting.notes}
                          onChange={(e) =>
                            setPhases((prev) => ({
                              ...prev,
                              meeting: { ...prev.meeting, notes: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <Button
                        onClick={() => handleMarkComplete("meeting")}
                        className="bg-[#27AE60] hover:bg-[#229954] text-white h-12 px-7 rounded-xl text-base font-medium shadow-md"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Marquer comme Terminée
                      </Button>
                    </div>
                  </div>
                )}

                {/* Phase 1 - Étude */}
                {currentPhase === 1 && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">{phaseIcons[1]}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-[#2C3E50]">Étude de Projet</h3>
                          <div className="h-1 w-16 bg-[#E67E22] rounded mt-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Documents d'Étude</Label>
                        <div className="border-2 border-dashed border-[#BDC3C7] rounded-xl p-10 text-center bg-[#FAFAFA] hover:border-[#E67E22] hover:bg-[#FFF5EC] transition-colors cursor-pointer">
                          <Upload className="w-12 h-12 text-[#BDC3C7] mx-auto mb-3" />
                          <p className="text-base text-[#7F8C8D] mb-1">Glissez le document ici</p>
                          <p className="text-sm text-[#BDC3C7]">ou cliquez pour parcourir</p>
                          <p className="text-xs text-[#BDC3C7] mt-2">PDF uniquement, max 10MB</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Agent chargé de l'étude</Label>
                        <Select
                          value={phases.study.agent || '1'}
                          onValueChange={(value) =>
                            setPhases((prev) => ({ ...prev, study: { ...prev.study, agent: value } }))
                          }
                        >
                          <SelectTrigger className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Échéance</Label>
                        <Input
                          type="date"
                          value={phases.study.dueDate}
                          className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base"
                          onChange={(e) =>
                            setPhases((prev) => ({ ...prev, study: { ...prev.study, dueDate: e.target.value } }))
                          }
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-[#7F8C8D]">Progression</Label>
                          <span className="text-xl font-bold text-[#E67E22]">{phases.study.progress}%</span>
                        </div>
                        <Slider
                          value={[phases.study.progress || 0]}
                          onValueChange={(value) =>
                            setPhases((prev) => ({ ...prev, study: { ...prev.study, progress: value[0] } }))
                          }
                          min={0}
                          max={100}
                          step={1}
                          className="h-2"
                        />
                      </div>

                      <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="validated"
                            checked={phases.study.validated || false}
                            onChange={(e) =>
                              setPhases((prev) => ({
                                ...prev,
                                study: { ...prev.study, validated: e.target.checked },
                              }))
                            }
                            className="w-5 h-5 rounded border-[#BDC3C7] text-[#E67E22] focus:ring-[#E67E22]"
                          />
                          <Label htmlFor="validated" className="text-base cursor-pointer">
                            Étude validée par le client
                          </Label>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleMarkComplete("study")}
                        className="bg-[#27AE60] hover:bg-[#229954] text-white h-12 px-7 rounded-xl text-base font-medium shadow-md"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Marquer comme Terminée
                      </Button>
                    </div>
                  </div>
                )}

                {/* Phase 2 - Offre */}
                {currentPhase === 2 && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">{phaseIcons[2]}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-[#2C3E50]">Offre Financière</h3>
                          <div className="h-1 w-16 bg-[#E67E22] rounded mt-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Offre Financière (PDF)</Label>
                          <div className="border-2 border-dashed border-[#BDC3C7] rounded-xl p-8 text-center bg-[#FAFAFA] hover:border-[#E67E22] hover:bg-[#FFF5EC] transition-colors cursor-pointer">
                            <Upload className="w-10 h-10 text-[#BDC3C7] mx-auto mb-2" />
                            <p className="text-sm text-[#7F8C8D]">Uploader PDF</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Détail des coûts (Excel)</Label>
                          <div className="border-2 border-dashed border-[#BDC3C7] rounded-xl p-8 text-center bg-[#FAFAFA] hover:border-[#E67E22] hover:bg-[#FFF5EC] transition-colors cursor-pointer">
                            <Upload className="w-10 h-10 text-[#BDC3C7] mx-auto mb-2" />
                            <p className="text-sm text-[#7F8C8D]">Uploader Excel</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Montant Total Proposé (€)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={phases.offer.amount || ''}
                          className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl text-base"
                          onChange={(e) =>
                            setPhases((prev) => ({ ...prev, offer: { ...prev.offer, amount: e.target.value } }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Date d'envoi</Label>
                          <Input
                            type="date"
                            value={phases.offer.sentDate || ''}
                            className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl"
                            onChange={(e) =>
                              setPhases((prev) => ({ ...prev, offer: { ...prev.offer, sentDate: e.target.value } }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Validité jusqu'au</Label>
                          <Input
                            type="date"
                            value={phases.offer.validUntil || ''}
                            className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl"
                            onChange={(e) =>
                              setPhases((prev) => ({ ...prev, offer: { ...prev.offer, validUntil: e.target.value } }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Statut</Label>
                          <Select
                            value={phases.offer.status}
                            onValueChange={(value) =>
                              setPhases((prev) => ({ ...prev, offer: { ...prev.offer, status: value as PhaseDetail['status'] } }))
                            }
                          >
                            <SelectTrigger className="h-12 bg-[#F8F9FA] border-[#E9ECEF] rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_sent">Non envoyée</SelectItem>
                              <SelectItem value="sent">Envoyée</SelectItem>
                              <SelectItem value="accepted">Acceptée</SelectItem>
                              <SelectItem value="negotiated">Négociée</SelectItem>
                              <SelectItem value="refused">Refusée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-[#7F8C8D] mb-2 block">Retour du Client</Label>
                        <Textarea
                          placeholder="Commentaires ou demandes du client..."
                          value={phases.offer.feedback || ''}
                          className="min-h-[150px] bg-[#F8F9FA] border-[#E9ECEF] rounded-xl resize-none text-base p-4"
                          onChange={(e) =>
                            setPhases((prev) => ({ ...prev, offer: { ...prev.offer, feedback: e.target.value } }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 3 - Contrat */}
                {currentPhase === 3 && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">{phaseIcons[3]}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-[#2C3E50]">Signature du Contrat</h3>
                          <div className="h-1 w-16 bg-[#E67E22] rounded mt-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {!phases.contract.signed ? (
                        <div className="text-center py-12">
                          <div className="w-24 h-24 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-12 h-12 text-[#BDC3C7]" />
                          </div>
                          <h4 className="text-lg font-semibold text-[#2C3E50] mb-2">Aucun contrat signé</h4>
                          <p className="text-sm text-[#7F8C8D] mb-6">Uploadez le contrat signé pour finaliser cette opportunité</p>
                          <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white h-12 px-7 rounded-xl text-base font-medium shadow-md">
                            <Upload className="w-5 h-5 mr-2" />
                            Uploader le Contrat Signé
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                              <p className="text-sm text-[#7F8C8D] mb-1">Référence du Contrat</p>
                              <p className="text-base font-semibold text-[#2C3E50]">{phases.contract.reference}</p>
                            </div>
                            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4">
                              <p className="text-sm text-[#7F8C8D] mb-1">Date de Signature</p>
                              <p className="text-base font-semibold text-[#2C3E50]">{phases.contract.signDate}</p>
                            </div>
                          </div>

                          <Button className="w-full bg-white border-2 border-[#E67E22] text-[#E67E22] hover:bg-[#FFF5EC] h-12 rounded-xl text-base font-medium">
                            <Eye className="w-5 h-5 mr-2" />
                            Voir le contrat
                          </Button>

                          <Button className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white h-12 rounded-xl text-base font-medium shadow-md">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Convertir en Projet Technique
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phase Navigation Footer */}
              <div className="bg-white border-t-2 border-[#F0F0F0] px-8 py-4 flex items-center justify-between flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={previousPhase}
                  disabled={currentPhase === 0}
                  className="border border-[#E9ECEF] text-[#7F8C8D] hover:bg-[#F8F9FA] h-11 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>

                <Button
                  variant="outline"
                  className="border border-[#E74C3C] text-[#E74C3C] hover:bg-red-50 h-11 px-5 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>

                <Button
                  onClick={nextPhase}
                  disabled={currentPhase === 3}
                  className="bg-[#E67E22] hover:bg-[#D35400] text-white h-11 px-8 rounded-lg font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="p-6 space-y-3">
              {[
                { title: "📋 Cahier des Charges", docs: [] as typeof documents },
                { title: "🔬 Études Techniques", docs: documents.filter((d) => d.type === "study") },
                { title: "💰 Offres Financières", docs: [] as typeof documents },
                { title: "📄 Contrats", docs: [] as typeof documents },
              ].map((category, idx) => (
                <div key={idx}>
                  <h4 className="text-xs font-bold text-[#2C3E50] mb-2">{category.title}</h4>
                  {category.docs.length === 0 ? (
                    <Card className="p-4 bg-[#F8F9FA] border border-dashed border-[#BDC3C7] text-center">
                      <p className="text-[#7F8C8D] text-xs">Aucun document</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {category.docs.map((doc) => (
                        <Card
                          key={doc.id}
                          className="p-3 flex items-center justify-between hover:shadow-md transition-shadow border border-[#E9ECEF]"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-[#F8F9FA] rounded-lg flex items-center justify-center">
                              <span className="text-lg">📄</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#2C3E50] text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-[#7F8C8D]">{doc.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <Download className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="p-6 space-y-3">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#E67E22] to-[#BDC3C7]"></div>

                <div className="space-y-3 relative z-10">
                  {history.map((event) => (
                    <Card key={event.id} className="p-4 ml-12 border border-[#E9ECEF] shadow-sm hover:shadow-md transition-shadow">
                      <div className="absolute left-0 top-4 w-9 h-9 -ml-4 bg-white rounded-full flex items-center justify-center border-3 border-white shadow-md">
                        <div className="w-6 h-6 bg-[#E67E22] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{event.avatar}</span>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-[#2C3E50] text-sm">{event.description}</p>
                        <p className="text-xs text-[#7F8C8D] mt-1">
                          {event.user} • {event.date}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar - Only for non-phases tabs */}
        {activeTab !== "phases" && (
          <div className="bg-white border-t border-[#E9ECEF] px-6 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
            <Button variant="outline" className="border-2 border-[#E9ECEF] text-[#2C3E50] hover:bg-[#F8F9FA] font-semibold">
              ✏️ Modifier
            </Button>
            <div className="flex gap-2">
              {opportunity.pipelineStage === "gagnee" && (
                <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white font-semibold shadow-lg gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Convertir
                </Button>
              )}
              <Button variant="outline" className="border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold gap-2">
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
