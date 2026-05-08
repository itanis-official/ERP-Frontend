import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Home, Check, X, Clock, Loader2, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { TeletravailRequestForm } from "../../components/TeletravailRequestForm";
import { teletravailApi, type DemandeTeletravail } from "../../lib/teletravailApi";
import { personnelApi, type CollaborateurInterne } from "../../lib/personnelApi";
import { useAuth } from "../../contexts/AuthContext";
import { normalizeRole } from "../../lib/rbac";

export function Teletravail() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const isAgent = role === 'agent'
  const isRHApprover = role === 'rh' || role === 'super_admin'
  const isChefProjet = role === 'chef_projet'
  const currentEmployeeId = user?.id
  const [activeTab, setActiveTab] = useState("all")
  const [showTeletravailForm, setShowTeletravailForm] = useState(false)

  const { data: requests = [], isLoading } = useQuery<DemandeTeletravail[]>({
    queryKey: ['teleworkRequests', isAgent ? currentEmployeeId : 'all'],
    queryFn: async () => {
      try {
        if (isAgent && currentEmployeeId) {
          return await teletravailApi.getByEmploye(currentEmployeeId)
        }
        if (isChefProjet && currentEmployeeId) {
          return await teletravailApi.getForManager(currentEmployeeId)
        }
        return await teletravailApi.getAll()
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
      if (isRHApprover) return teletravailApi.approveByRH(id, currentEmployeeId ?? 0)
      return teletravailApi.approveByManager(id, currentEmployeeId ?? 0)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teleworkRequests'] })
      setActiveTab('approved')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => teletravailApi.reject(
      id,
      undefined,
      isRHApprover ? undefined : currentEmployeeId,
      isRHApprover ? currentEmployeeId : undefined,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teleworkRequests'] })
      setActiveTab('rejected')
    },
  })

  const isApprovedStatus = (status: string) =>
    status === 'Approved' || status === 'ApprovedManager' || status === 'ApprovedRH' || status === 'ApprovedHR'

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
      case "Approved":
      case "ApprovedManager":
      case "ApprovedRH":
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
      case "Approved":
        return "Approuvé";
      case "ApprovedManager":
        return "Validée Manager";
      case "ApprovedRH":
        return "Validée RH";
      case "Rejected":
        return "Refusé";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Regular":
        return "🏠 Régulier";
      case "Occasionnel":
        return "📅 Occasionnel";
      default:
        return type;
    }
  };

  const getEmployeeInitials = (prenom?: string, nom?: string) => {
    if (!prenom && !nom) return "??";
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  };

  const formatDateRange = (debut: string | null, fin: string | null) => {
    if (!debut && !fin) return "Dates non définies";
    const d = debut ? new Date(debut).toLocaleDateString('fr-FR') : 'N/A';
    const f = fin ? new Date(fin).toLocaleDateString('fr-FR') : 'N/A';
    if (d === f) return `Le ${d}`;
    return `Du ${d} au ${f}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Demandes de Télétravail</h1>
          <p className="text-muted-foreground">Gerer les demandes de travail a distance</p>
        </div>
        <Button 
          className="bg-[#E67E22] hover:bg-[#D35400] text-white"
          onClick={() => setShowTeletravailForm(true)}
        >
          <Plus size={18} className="mr-2" />
          Nouvelle Demande
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border-b border-border w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
          >
            Toutes ({requests.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
          >
            En Attente ({requests.filter(r => r.statut === pendingStatusForCurrentRole).length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
          >
            Approuvées ({requests.filter(r => isApprovedStatus(r.statut)).length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
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
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            </Card>
          )}

          {/* Request Cards Grid */}
          {!isLoading && filteredRequests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="p-6 hover:shadow-lg hover:bg-muted transition-all border border-border"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getEmployeeInitials(request.employe?.prenom, request.employe?.nom)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {request.employe ? `${request.employe.prenom} ${request.employe.nom}` : 'Employé'}
                        </p>
                        {request.employe?.poste && (
                          <p className="text-xs text-muted-foreground">{request.employe.poste}</p>
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
                      {getTypeLabel(request.type)}
                    </Badge>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home size={16} />
                      <span>{request.joursParSemaine} jour(s)/semaine</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={16} />
                      <span>{formatDateRange(request.dateDebut, request.dateFin)}</span>
                    </div>

                    {request.raison && (
                      <div className="p-3 bg-muted rounded text-sm">
                        <span className="font-medium text-foreground">Raison:</span>
                        <p className="text-muted-foreground mt-1">{request.raison}</p>
                      </div>
                    )}

                    {/* Technical Info */}
                    {(request.equipementFourni || request.vpnConfigure || request.accesOutilsOk) && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {request.equipementFourni && (
                          <Badge variant="outline" className="text-xs">💻 Équipement</Badge>
                        )}
                        {request.vpnConfigure && (
                          <Badge variant="outline" className="text-xs">🔐 VPN</Badge>
                        )}
                        {request.accesOutilsOk && (
                          <Badge variant="outline" className="text-xs">🛠️ Outils</Badge>
                        )}
                      </div>
                    )}

                    {request.dateSoumission && (
                      <p className="text-xs text-muted-foreground">
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
                        Approuver
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
              <div className="text-center text-muted-foreground">
                <Home size={64} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2">Aucune demande</p>
                <p className="text-sm mb-4">Il n'y a aucune demande dans cette catégorie</p>
                <Button 
                  className="bg-[#E67E22] hover:bg-[#D35400] text-white"
                  onClick={() => setShowTeletravailForm(true)}
                >
                  <Plus size={18} className="mr-2" />
                  Créer une demande
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Teletravail Request Form Modal */}
      <TeletravailRequestForm
        open={showTeletravailForm}
        onClose={() => setShowTeletravailForm(false)}
        onSubmit={() => {
          setShowTeletravailForm(false)
          qc.invalidateQueries({ queryKey: ['teleworkRequests'] })
        }}
        employees={employees}
        currentEmployeeId={isAgent ? (currentEmployeeId ?? null) : null}
      />
    </div>
  );
}
