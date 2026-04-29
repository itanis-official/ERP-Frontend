import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, AlertCircle, Check, X, Loader2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { LeaveRequestForm } from "../../components/LeaveRequestForm";
import { leaveApi, type DemandeConge } from "../../lib/leaveApi";
import { personnelApi, type CollaborateurInterne } from "../../lib/personnelApi";
import { useAuth } from "../../contexts/AuthContext";
import { normalizeRole } from "../../lib/rbac";

export function LeaveRequests() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const isAgent = role === 'agent'
  const isRHApprover = role === 'rh' || role === 'super_admin'
  const isChefProjet = role === 'chef_projet'
  const currentEmployeeId = user?.id
  const [activeTab, setActiveTab] = useState("all")
  const [showLeaveForm, setShowLeaveForm] = useState(false)

  const { data: requests = [], isLoading } = useQuery<DemandeConge[]>({
    queryKey: ['leaveRequests', isAgent ? currentEmployeeId : 'all'],
    queryFn: async () => {
      try {
        if (isAgent && currentEmployeeId) {
          return await leaveApi.getByEmploye(currentEmployeeId)
        }
        if (isChefProjet && currentEmployeeId) {
          return await leaveApi.getForManager(currentEmployeeId)
        }
        return await leaveApi.getAll()
      }
      catch { return [] }
    },
  })

  const { data: employees = [] } = useQuery<CollaborateurInterne[]>({
    queryKey: ['employees', isAgent ? currentEmployeeId : 'all'],
    queryFn: async () => {
      try {
        if (isAgent && currentEmployeeId) {
          const employee = await personnelApi.getById(currentEmployeeId)
          return [employee]
        }
        return await personnelApi.getAll()
      }
      catch { return [] }
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => {
      if (isRHApprover) return leaveApi.validateByRH(id, currentEmployeeId ?? 0)
      return leaveApi.validateByManager(id, currentEmployeeId ?? 0)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaveRequests'] })
      setActiveTab('approved')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => leaveApi.reject(
      id,
      undefined,
      isRHApprover ? undefined : currentEmployeeId,
      isRHApprover ? currentEmployeeId : undefined,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaveRequests'] })
      setActiveTab('rejected')
    },
  })

  const isApprovedStatus = (status: string) =>
    status === 'Approved' || status === 'ApprovedManager' || status === 'ApprovedHR' || status === 'ApprovedRH'

  const pendingStatusForCurrentRole = isRHApprover ? 'ApprovedManager' : 'Pending'

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return req.statut === pendingStatusForCurrentRole;
    if (activeTab === "approved") return isApprovedStatus(req.statut);
    if (activeTab === "rejected") return req.statut === "Rejected";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-[#FFF3CD] text-[#856404] hover:bg-[#FFF3CD]";
      case "ApprovedManager":
      case "ApprovedHR":
        return "bg-[#D4EDDA] text-[#155724] hover:bg-[#D4EDDA]";
      case "Rejected":
        return "bg-[#F8D7DA] text-[#721C24] hover:bg-[#F8D7DA]";
      default:
        return "";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "En Attente";
      case "ApprovedManager":
        return "Approuvée Manager";
        return "Approuvée Manager";
      case "ApprovedHR":
        return "Validée RH";
      case "Rejected":
        return "Refusé";
      default:
        return status;
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "Annuel": return "🏖️";
      case "Maladie": return "🏥";
      case "MaternitePaternite": return "👶";
      case "Formation": return "📚";
      case "Exceptionnel": return "⭐";
      case "Interim": return "👥";
      case "Autre": return "🏫";
      default: return "📋";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Annuel": return "Congé Annuel";
      case "Maladie": return "Maladie";
      case "MaternitePaternite": return "Maternité/Paternité";
      case "Formation": return "Formation";
      case "Exceptionnel": return "Exceptionnel";
      case "Interim": return "Intérim";
      case "Autre": return "Autre";
      default: return type;
    }
  };

  const getEmployeeInitials = (prenom?: string, nom?: string) => {
    if (!prenom && !nom) return "??";
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  };

  const formatDateRange = (debut: string, fin: string) => {
    const d = new Date(debut).toLocaleDateString('fr-FR');
    const f = new Date(fin).toLocaleDateString('fr-FR');
    if (d === f) return `Le ${d}`;
    return `Du ${d} au ${f}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Demandes de Congés</h1>
          <p className="text-gray-600">Gérer toutes les demandes de congés</p>
        </div>
        <Button 
          className="bg-[#E67E22] hover:bg-[#D35400] text-white"
          onClick={() => setShowLeaveForm(true)}
        >
          <Plus size={18} className="mr-2" />
          Nouvelle Demande
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#E67E22] data-[state=active]:text-[#E67E22] rounded-none px-6 py-3 hover:bg-[#FFF5EC]"
          >
            Toutes ({requests.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#E67E22] data-[state=active]:text-[#E67E22] rounded-none px-6 py-3 hover:bg-[#FFF5EC]"
          >
            En Attente ({requests.filter(r => r.statut === pendingStatusForCurrentRole).length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#E67E22] data-[state=active]:text-[#E67E22] rounded-none px-6 py-3 hover:bg-[#FFF5EC]"
          >
            Validées ({requests.filter(r => isApprovedStatus(r.statut)).length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#E67E22] data-[state=active]:text-[#E67E22] rounded-none px-6 py-3 hover:bg-[#FFF5EC]"
          >
            Refusées ({requests.filter(r => r.statut === "Rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Loading State */}
          {isLoading && (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-[#E67E22] mb-4" size={40} />
                <p className="text-gray-500">Chargement...</p>
              </div>
            </Card>
          )}

          {/* Request Cards Grid */}
          {!isLoading && filteredRequests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="p-6 hover:shadow-lg hover:bg-[#FFF5EC] transition-all border border-[#E9ECEF]"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getEmployeeInitials(request.employe?.prenom, request.employe?.nom)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.employe ? `${request.employe.prenom} ${request.employe.nom}` : 'Employé'}
                        </p>
                        {request.employe?.poste && (
                          <p className="text-xs text-gray-500">{request.employe.poste}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(request.statut)}>
                      {getStatusText(request.statut)}
                    </Badge>
                  </div>

                  {/* Request Details */}
                  <div className="space-y-3">
                    <Badge className="bg-[#FFF5EC] text-[#E67E22] hover:bg-[#FFF5EC]">
                      {getTypeEmoji(request.typeConge)} {getTypeLabel(request.typeConge)}
                    </Badge>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{formatDateRange(request.dateDebut, request.dateFin)}</span>
                    </div>

                    <p className="text-2xl font-bold text-gray-900">{request.dureeJours} jours</p>

                    {request.soldeApres !== undefined && request.soldeApres !== null && (
                      <div className={`text-sm ${request.soldeApres >= 0 ? "text-green-600" : "text-red-600"}`}>
                        Solde après: <span className="font-medium">{request.soldeApres} jours</span>
                      </div>
                    )}

                    {request.soldeApres !== undefined && request.soldeApres < 0 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        <AlertCircle size={14} />
                        <span>Solde négatif</span>
                      </div>
                    )}

                    {request.motif && (
                      <p className="text-sm text-gray-600 pt-2 border-t">
                        <span className="font-medium">Motif:</span> {request.motif}
                      </p>
                    )}

                    {request.dateSoumission && (
                      <p className="text-xs text-gray-400">
                        Soumise le {new Date(request.dateSoumission).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!isAgent && (
                    (!isRHApprover && request.statut === "Pending") ||
                    (isRHApprover && request.statut === "ApprovedManager")
                  ) && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approveMutation.mutate(request.id!)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 size={16} className="animate-spin mr-2" />
                        ) : (
                          <Check size={16} className="mr-2" />
                        )}
                        Valider
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-red-600 text-red-600 hover:bg-red-50"
                        onClick={() => rejectMutation.mutate(request.id!)}
                        disabled={rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 size={16} className="animate-spin mr-2" />
                        ) : (
                          <X size={16} className="mr-2" />
                        )}
                        Refuser
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredRequests.length === 0 && (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Aucune demande</p>
                <p className="text-sm mb-4">Il n'y a aucune demande dans cette catégorie</p>
                <Button 
                  className="bg-[#E67E22] hover:bg-[#D35400] text-white"
                  onClick={() => setShowLeaveForm(true)}
                >
                  <Plus size={18} className="mr-2" />
                  Créer une demande
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        open={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        onSubmit={() => {
          setShowLeaveForm(false)
          qc.invalidateQueries({ queryKey: ['leaveRequests'] })
        }}
        employees={employees}
        currentEmployeeId={isAgent ? (currentEmployeeId ?? null) : null}
      />
    </div>
  );
}
