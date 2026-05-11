import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { rhApi } from '../../lib/api'

export function Dashboard() {
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        return (await rhApi.get('/api/collaborateursinternes')).data
      } catch {
        return []
      }
    },
  })

  const { data: contractors = [] } = useQuery<any[]>({
    queryKey: ['contractors'],
    queryFn: async () => {
      try {
        return (await rhApi.get('/api/collaborateursexternes')).data
      } catch {
        return []
      }
    },
  })

  const { data: leaveRequests = [] } = useQuery<any[]>({
    queryKey: ['leaveRequests'],
    queryFn: async () => {
      try {
        return (await rhApi.get('/api/demandesconge')).data
      } catch {
        return []
      }
    },
  })

  const { data: teleworkRequests = [] } = useQuery<any[]>({
    queryKey: ['teleworkRequests'],
    queryFn: async () => {
      try {
        return (await rhApi.get('/api/DemandesTeletravail')).data
      } catch {
        return []
      }
    },
  })

  const normalizeStatus = (value: unknown) => String(value || '').trim().toLowerCase()
  const isPendingStatus = (value: unknown) => {
    const status = normalizeStatus(value)
    return status === 'pending' || status === 'en attente'
  }
  const isApprovedStatus = (value: unknown) => {
    const status = normalizeStatus(value)
    return status === 'approved' || status === 'approvedmanager' || status === 'approvedhr' || status === 'approvedrh' || status === 'approuvee'
  }

  const totalEmployees = employees.length
  const activeEmployees = employees.filter((employee) => {
    const status = normalizeStatus(employee.statut)
    return status === 'actif' || status === 'active'
  }).length

  const pendingLeaveRequests = leaveRequests.filter((request) => isPendingStatus(request.statut))
  const pendingTeleworkRequests = teleworkRequests.filter((request) => isPendingStatus(request.statut))
  const pendingRequests = pendingLeaveRequests.length + pendingTeleworkRequests.length

  const monthlyData = [
    { month: 'Jan', total: 45, actifs: 43 },
    { month: 'Fev', total: 46, actifs: 44 },
    { month: 'Mar', total: 48, actifs: 46 },
    { month: 'Avr', total: 50, actifs: 48 },
    { month: 'Mai', total: 51, actifs: 49 },
    { month: 'Jun', total: 51, actifs: 49 },
  ]

  const departmentCounts = employees.reduce((acc: Record<string, number>, employee) => {
    const key = (employee.departement || 'Non défini').toString().trim()
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const departmentData = Object.entries(departmentCounts)
    .map(([name, count]) => ({ name, employees: count }))
    .sort((a, b) => b.employees - a.employees)
    .slice(0, 6)

  const pendingItems = [
    ...pendingLeaveRequests.map((request) => ({
      id: `leave-${request.id}`,
      label: 'Congé',
      dateDebut: request.dateDebut,
      dateFin: request.dateFin,
    })),
    ...pendingTeleworkRequests.map((request) => ({
      id: `telework-${request.id}`,
      label: 'Télétravail',
      dateDebut: request.dateDebut,
      dateFin: request.dateFin,
    })),
  ].slice(0, 3)

  const stats = [
    {
      title: 'Collaborateurs',
      value: totalEmployees,
      subtitle: `${activeEmployees} actifs`,
      icon: Users,
      color: '#2E6DD8',
      trend: '+8%',
    },
    {
      title: 'Demandes pendantes',
      value: pendingRequests,
      subtitle: 'A valider',
      icon: Clock,
      color: '#C6861A',
    },
    {
      title: 'Prestataires',
      value: contractors.length,
      subtitle: 'Externes',
      icon: TrendingUp,
      color: '#1E8E5A',
    },
    {
      title: 'Conges approuves',
      value: leaveRequests.filter((request) => isApprovedStatus(request.statut)).length,
      subtitle: 'Ce mois',
      icon: CheckCircle,
      color: '#6B4FB2',
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="itanis-page-title">Tableau de bord RH</h1>
        <p className="mt-1 text-[14px] text-[#857B72]">Pilotage du personnel, des absences et des validations.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="rounded-xl border border-[#E8E1DA] bg-white p-5 shadow-none">
              <div className="flex items-start justify-between">
                <Icon size={20} strokeWidth={1.5} style={{ color: stat.color }} />
                {stat.trend && (
                  <Badge className="h-6 rounded-full border border-green-200 bg-green-50 px-2 text-[11px] font-medium text-green-700 hover:bg-green-50">
                    {stat.trend}
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-[32px] leading-none font-medium text-[#2F2A26]">{stat.value}</p>
              <p className="mt-2 text-[12px] text-[#8B837B]">{stat.title}</p>
              <p className="text-[12px] text-[#8B837B]">{stat.subtitle}</p>
            </Card>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-xl border border-[#E8E1DA] bg-white p-5 shadow-none">
          <h2 className="itanis-section-title mb-3">Evolution Collaborateurs</h2>
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFE8E1" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8B837B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8B837B' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#E07B2A" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="actifs" stroke="#1E8E5A" strokeWidth={2} name="Actifs" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="rounded-xl border border-[#E8E1DA] bg-white p-5 shadow-none">
          <h2 className="itanis-section-title mb-3">Repartition Departements</h2>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={departmentData} layout="vertical">
              <CartesianGrid horizontal={false} stroke="#F1ECE6" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#8B837B' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={76} tick={{ fontSize: 12, fill: '#7A726B' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="employees" fill="#E07B2A" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-xl border border-[#E8E1DA] bg-white p-5 shadow-none">
          <h2 className="itanis-section-title mb-3">Demandes En Attente</h2>
          <div className="space-y-2">
            {pendingItems.map((request) => (
              <div key={request.id} className="rounded-lg border border-[#F0E8DC] bg-[#FCFAF8] p-3">
                <p className="text-[14px] font-medium text-[#2F2A26]">{request.label}</p>
                <p className="text-[12px] text-[#8B837B]">
                  {request.dateDebut ? new Date(request.dateDebut).toLocaleDateString('fr-FR') : 'N/A'} -{' '}
                  {request.dateFin ? new Date(request.dateFin).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            ))}
            {pendingItems.length === 0 && (
              <p className="text-[12px] text-[#8B837B]">Aucune demande en attente.</p>
            )}
          </div>
        </Card>

        <Card className="rounded-xl border border-[#E8E1DA] bg-white p-5 shadow-none">
          <h2 className="itanis-section-title mb-3">Activite Recente</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 border-b border-[#EFE8E1] pb-3">
              <CheckCircle className="mt-0.5" size={18} strokeWidth={1.5} color="#1E8E5A" />
              <div>
                <p className="text-[14px] font-medium text-[#2F2A26]">Nouvelle embauche</p>
                <p className="text-[12px] text-[#8B837B]">2 nouveaux collaborateurs</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-b border-[#EFE8E1] pb-3">
              <TrendingUp className="mt-0.5" size={18} strokeWidth={1.5} color="#2E6DD8" />
              <div>
                <p className="text-[14px] font-medium text-[#2F2A26]">Bilan RH</p>
                <p className="text-[12px] text-[#8B837B]">Rapport mensuel genere</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5" size={18} strokeWidth={1.5} color="#C6861A" />
              <div>
                <p className="text-[14px] font-medium text-[#2F2A26]">Formation obligatoire</p>
                <p className="text-[12px] text-[#8B837B]">5 collaborateurs a former</p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
