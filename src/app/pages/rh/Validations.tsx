import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Check,
  X,
  Calendar,
  LogOut,
  Home,
} from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { leaveApi } from '../../lib/leaveApi'
import { exitApi } from '../../lib/exitApi'
import { teletravailApi } from '../../lib/teletravailApi'
import { useAuth } from '../../contexts/AuthContext'
import { normalizeRole } from '../../lib/rbac'
import { useModuleSelectOptions } from '../../lib/selectOptionsConfig'

interface RequestItem {
  id: number
  type: 'leave' | 'telework' | 'exit'
  typeLabel: string
  typeIcon: string
  summary: string
  daysUntilStart: number
  department: string
  status: string
  employeName: string
  employePoste: string
  motif?: string
  dateDebut?: string
  dateFin?: string
  dureeJours?: number
  joursParSemaine?: number
  raison?: string
}

export function Validations() {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const { user } = useAuth()
  const qc = useQueryClient()
  const role = normalizeRole(user?.role)
  const isRHApprover = role === 'rh' || role === 'super_admin'
  const approverId = user?.id ?? 0
  const [activeTab, setActiveTab] = useState('pending')
  const [filterType, setFilterType] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [showCommentKey, setShowCommentKey] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const [comment, setComment] = useState('')

  const { data: leaveRequests = [], isLoading: isLoadingLeave } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: async () => {
      try { return await leaveApi.getAll() }
      catch { return [] }
    },
  })

  const { data: teleworkRequests = [], isLoading: isLoadingTelework } = useQuery({
    queryKey: ['teleworkRequests'],
    queryFn: async () => {
      try { return await teletravailApi.getAll() }
      catch { return [] }
    },
  })

  const { data: exitRequests = [], isLoading: isLoadingExit } = useQuery({
    queryKey: ['exitRequests'],
    queryFn: async () => {
      try { return await exitApi.getAll() }
      catch { return [] }
    },
  })

  const allRequests: RequestItem[] = [
    ...leaveRequests.map(r => ({
      id: r.id!,
      type: 'leave' as const,
      typeLabel: r.typeConge === 'Annuel' ? 'Congé Annuel' : r.typeConge === 'Maladie' ? 'Congé Maladie' : r.typeConge || 'Congé',
      typeIcon: r.typeConge === 'Annuel' ? '🏖️' : r.typeConge === 'Maladie' ? '🏥' : '📅',
      summary: r.dateDebut && r.dateFin ? `${r.dureeJours || 0} jours du ${new Date(r.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(r.dateFin).toLocaleDateString('fr-FR')}` : 'N/A',
      daysUntilStart: r.dateDebut ? Math.ceil((new Date(r.dateDebut).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
      department: r.employe?.departement || 'N/A',
      status: r.statut,
      employeName: r.employe ? `${r.employe.prenom} ${r.employe.nom}` : `Employé #${r.employeId}`,
      employePoste: r.employe?.poste || '',
      motif: r.motif,
      dateDebut: r.dateDebut,
      dateFin: r.dateFin,
      dureeJours: r.dureeJours,
    })),
    ...teleworkRequests.map(r => ({
      id: r.id!,
      type: 'telework' as const,
      typeLabel: 'Télétravail',
      typeIcon: '🏠',
      summary: r.dateDebut && r.dateFin ? `Du ${new Date(r.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(r.dateFin).toLocaleDateString('fr-FR')}` : r.joursParSemaine ? `${r.joursParSemaine} jours/semaine` : 'N/A',
      daysUntilStart: r.dateDebut ? Math.ceil((new Date(r.dateDebut).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
      department: r.employe?.departement || 'N/A',
      status: r.statut,
      employeName: r.employe ? `${r.employe.prenom} ${r.employe.nom}` : `Employé #${r.employeId}`,
      employePoste: r.employe?.poste || '',
      motif: r.raison,
      dateDebut: r.dateDebut || undefined,
      dateFin: r.dateFin || undefined,
      joursParSemaine: r.joursParSemaine,
    })),
    ...exitRequests.map(r => ({
      id: r.id!,
      type: 'exit' as const,
      typeLabel: 'Sortie Autorisée',
      typeIcon: '🚶',
      summary: r.date ? `${new Date(r.date).toLocaleDateString('fr-FR')} - ${r.heureSortie || ''} → ${r.heureRetour || ''}` : 'N/A',
      daysUntilStart: r.date ? Math.ceil((new Date(r.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
      department: r.employe?.departement || 'N/A',
      status: r.statut,
      employeName: r.employe ? `${r.employe.prenom} ${r.employe.nom}` : `Employé #${r.employeId}`,
      employePoste: r.employe?.poste || '',
      motif: r.motif,
      dateDebut: r.date,
    })),
  ]

  const pendingRequests = allRequests.filter(r => {
    if (isRHApprover) return r.status === 'ApprovedManager'
    return r.status === 'Pending'
  })
  const approvedRequests = allRequests.filter(r => r.status === 'Approved' || r.status === 'ApprovedHR' || r.status === 'ApprovedRH' || r.status === 'ApprovedManager')
  const rejectedRequests = allRequests.filter(r => r.status === 'Rejected')

  const getFilteredRequests = (requests: RequestItem[]) => {
    return requests.filter((req) => {
      if (filterType !== 'all' && req.type !== filterType) return false
      if (filterDepartment !== 'all' && req.department !== filterDepartment) return false
      return true
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-[#FFF3CD] text-[#856404] hover:bg-[#FFF3CD]'
      case 'Approved':
      case 'ApprovedHR':
      case 'ApprovedRH':
      case 'ApprovedManager':
        return 'bg-[#D4EDDA] text-[#155724] hover:bg-[#D4EDDA]'
      case 'Rejected':
        return 'bg-[#F8D7DA] text-[#721C24] hover:bg-[#F8D7DA]'
      default:
        return ''
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'En Attente'
      case 'Approved':
        return 'Approuvée'
      case 'ApprovedManager':
        return 'Validée Chef Projet'
      case 'ApprovedHR':
      case 'ApprovedRH':
        return 'Validée RH (Finale)'
      case 'Rejected':
        return 'Refusée'
      default:
        return status
    }
  }

  const getEmployeeInitials = (prenom?: string, nom?: string) => {
    if (!prenom && !nom) return '??'
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  }

  const extractInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      if (type === 'leave') {
        if (isRHApprover) {
          return await leaveApi.validateByRH(id, approverId, comment)
        }
        return await leaveApi.validateByManager(id, approverId, comment)
      } else if (type === 'exit') {
        if (isRHApprover) {
          return await exitApi.approveByRH(id, approverId, comment)
        }
        return await exitApi.approve(id, approverId, comment)
      } else if (type === 'telework') {
        if (isRHApprover) {
          return await teletravailApi.approveByRH(id, approverId, comment)
        }
        return await teletravailApi.approveByManager(id, approverId, comment)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaveRequests'] })
      qc.invalidateQueries({ queryKey: ['exitRequests'] })
      qc.invalidateQueries({ queryKey: ['teleworkRequests'] })
      setActiveTab('approved')
      setShowCommentKey(null)
      setSelectedRequest(null)
      setComment('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      if (type === 'leave') {
        return await leaveApi.reject(id, comment, isRHApprover ? undefined : approverId, isRHApprover ? approverId : undefined)
      } else if (type === 'exit') {
        return await exitApi.reject(id, comment, isRHApprover ? undefined : approverId, isRHApprover ? approverId : undefined)
      } else if (type === 'telework') {
        return await teletravailApi.reject(id, comment, isRHApprover ? undefined : approverId, isRHApprover ? approverId : undefined)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaveRequests'] })
      qc.invalidateQueries({ queryKey: ['exitRequests'] })
      qc.invalidateQueries({ queryKey: ['teleworkRequests'] })
      setActiveTab('rejected')
      setShowCommentKey(null)
      setSelectedRequest(null)
      setComment('')
    },
  })

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({ id: selectedRequest.id, type: selectedRequest.type })
    }
  }

  const handleReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate({ id: selectedRequest.id, type: selectedRequest.type })
    }
  }

  const openCommentDialog = (request: RequestItem) => {
    setSelectedRequest(request)
    setShowCommentKey(`${request.type}-${request.id}`)
    setComment('')
  }

  const isLoading = isLoadingLeave || isLoadingTelework || isLoadingExit

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Validations</h1>
          <p className="text-muted-foreground">
            Toutes les demandes en attente de validation
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En Attente</p>
              <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approuvees</p>
              <p className="text-2xl font-bold text-foreground">{approvedRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Refusees</p>
              <p className="text-2xl font-bold text-foreground">{rejectedRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux d'approbation</p>
              <p className="text-2xl font-bold text-foreground">
                {approvedRequests.length + rejectedRequests.length > 0 
                  ? Math.round((approvedRequests.length / (approvedRequests.length + rejectedRequests.length)) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 border-[#DDD5CD] bg-white text-[13px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7D746C]">Type:</span>
                <SelectValue placeholder="Tous les types" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {(rhSelectOptions.validationTypes || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="h-9 border-[#DDD5CD] bg-white text-[13px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7D746C]">Département:</span>
                <SelectValue placeholder="Tous" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {(rhSelectOptions.departments || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border-b border-border w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
          >
            En Attente ({getFilteredRequests(pendingRequests).length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
          >
            Approuvées ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[#ef7c21] data-[state=active]:text-[#ef7c21] rounded-none px-6 py-3 hover:bg-muted"
          >
            Refusées ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-[#E67E22] mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Chargement...</p>
            </Card>
          ) : getFilteredRequests(pendingRequests).length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Aucune validation en attente</p>
              <p className="text-muted-foreground text-sm mt-2">Vous etes a jour</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredRequests(pendingRequests).map((request) => (
                <Card 
                  key={`${request.type}-${request.id}`} 
                  className="p-6 hover:shadow-lg hover:bg-muted transition-all border border-border"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {extractInitials(request.employeName)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{request.employeName}</p>
                        {request.employePoste && (
                          <p className="text-xs text-muted-foreground">{request.employePoste}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>

                  {/* Request Details */}
                  <div className="space-y-3">
                    <Badge className="bg-[#FFF5EC] text-[#E67E22] hover:bg-[#FFF5EC]">
                      {request.typeIcon} {request.typeLabel}
                    </Badge>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {request.type === 'leave' && <Calendar size={16} />}
                      {request.type === 'telework' && <Home size={16} />}
                      {request.type === 'exit' && <LogOut size={16} />}
                      <span>{request.summary}</span>
                    </div>

                    {request.motif && (
                      <p className="text-sm text-gray-600 pt-2 border-t">
                        <span className="font-medium">Motif:</span> {request.motif}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openCommentDialog(request)}
                    >
                      <Check size={16} className="mr-2" />
                      Valider
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => openCommentDialog(request)}
                    >
                      <X size={16} className="mr-2" />
                      Refuser
                    </Button>
                  </div>

                  {/* Comment Dialog */}
                  {showCommentKey === `${request.type}-${request.id}` && selectedRequest?.id === request.id && selectedRequest?.type === request.type && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <Label className="text-sm font-semibold mb-2 block">
                        Commentaire (optionnel)
                      </Label>
                      <Textarea
                        placeholder="Raison de validation/refus..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mb-3 h-20"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowCommentKey(null)
                            setSelectedRequest(null)
                            setComment('')
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleApprove}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? '...' : 'Confirmer'}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleReject}
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? '...' : 'Refuser'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="mt-6">
          {approvedRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">Aucune demande approuvee</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedRequests.map((request) => (
                <Card 
                  key={`${request.type}-${request.id}`} 
                  className="p-6 hover:shadow-lg transition-all border border-border opacity-75"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {extractInitials(request.employeName)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{request.employeName}</p>
                        {request.employePoste && (
                          <p className="text-xs text-muted-foreground">{request.employePoste}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <Badge className="bg-[#FFF5EC] text-[#E67E22] hover:bg-[#FFF5EC]">
                      {request.typeIcon} {request.typeLabel}
                    </Badge>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {request.type === 'leave' && <Calendar size={16} />}
                      {request.type === 'telework' && <Home size={16} />}
                      {request.type === 'exit' && <LogOut size={16} />}
                      <span>{request.summary}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="mt-6">
          {rejectedRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Aucune demande refusee</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejectedRequests.map((request) => (
                <Card 
                  key={`${request.type}-${request.id}`} 
                  className="p-6 hover:shadow-lg transition-all border border-border opacity-75"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {extractInitials(request.employeName)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{request.employeName}</p>
                        {request.employePoste && (
                          <p className="text-xs text-muted-foreground">{request.employePoste}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <Badge className="bg-[#FFF5EC] text-[#E67E22] hover:bg-[#FFF5EC]">
                      {request.typeIcon} {request.typeLabel}
                    </Badge>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {request.type === 'leave' && <Calendar size={16} />}
                      {request.type === 'telework' && <Home size={16} />}
                      {request.type === 'exit' && <LogOut size={16} />}
                      <span>{request.summary}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-blue-900">Notifications disponibles</p>
            <p className="text-sm text-blue-800">Recevez un digest quotidien des validations en attente</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
