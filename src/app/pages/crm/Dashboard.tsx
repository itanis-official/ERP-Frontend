import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Target, Briefcase, Users } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { crmApi } from '../../lib/api'

export function Dashboard() {
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try { return (await crmApi.get('/api/companies')).data }
      catch { return [] }
    },
  })

  const { data: opportunities = [] } = useQuery<any[]>({
    queryKey: ['opportunities'],
    queryFn: async () => {
      try { return (await crmApi.get('/api/opportunities')).data }
      catch { return [] }
    },
  })

  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      try { return (await crmApi.get('/api/contracts')).data }
      catch { return [] }
    },
  })

  const totalRevenue = opportunities.reduce((sum, o) => sum + (o.valeurEstimee || 0), 0)
  const wonOpportunities = opportunities.filter(o => o.pipelineStage === 'gagne').length
  const activeClients = companies.filter(c => c.statut === 'client').length
  const conversionRate = opportunities.length > 0 ? ((wonOpportunities / opportunities.length) * 100).toFixed(1) : '0'

  const monthlyData = [
    { month: 'Sem 1', revenue: 45000, target: 50000 },
    { month: 'Sem 2', revenue: 52000, target: 55000 },
    { month: 'Sem 3', revenue: 48000, target: 52000 },
    { month: 'Sem 4', revenue: 61000, target: 60000 },
  ]

  const pipelineData = [
    { name: 'Prospection', value: opportunities.filter(o => o.pipelineStage === 'prospection').length, color: '#94A3B8' },
    { name: 'Qualification', value: opportunities.filter(o => o.pipelineStage === 'qualification').length, color: '#3B82F6' },
    { name: 'Proposition', value: opportunities.filter(o => o.pipelineStage === 'proposition').length, color: '#8B5CF6' },
    { name: 'Négociation', value: opportunities.filter(o => o.pipelineStage === 'negociation').length, color: '#E67E22' },
    { name: 'Gagné', value: opportunities.filter(o => o.pipelineStage === 'gagne').length, color: '#10B981' },
    { name: 'Perdu', value: opportunities.filter(o => o.pipelineStage === 'perdu').length, color: '#EF4444' },
  ].filter(p => p.value > 0)

  const kpis = [
    {
      title: "Chiffre d'Affaires", value: `${(totalRevenue / 1000).toFixed(0)}K€`,
      subtitle: "Valeur pipeline total",
      icon: <Briefcase className="w-5 h-5" />,
      trend: { value: '+12%', isPositive: true },
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    },
    {
      title: "Opportunités", value: opportunities.length,
      subtitle: `${wonOpportunities} gagnées`,
      icon: <Target className="w-5 h-5" />,
      iconBg: "bg-amber-50", iconColor: "text-amber-600",
    },
    {
      title: "Taux de Conversion", value: `${conversionRate}%`,
      subtitle: "Performance globale",
      icon: <TrendingUp className="w-5 h-5" />,
      trend: { value: '+5%', isPositive: true },
      iconBg: "bg-blue-50", iconColor: "text-blue-600",
    },
    {
      title: "Clients Actifs", value: activeClients,
      subtitle: `${contracts.length} contrats`,
      icon: <Users className="w-5 h-5" />,
      iconBg: "bg-violet-50", iconColor: "text-violet-600",
    },
  ]

  const getStageLabel = (stage: string) => {
    const map: Record<string, string> = {
      prospection: 'Prospection', qualification: 'Qualification', proposition: 'Proposition',
      negociation: 'Négociation', gagne: 'Gagné', perdu: 'Perdu', gagnee: 'Gagnée', perdue: 'Perdue',
    }
    return map[stage] || stage
  }

  const getStageStyle = (stage: string) => {
    const map: Record<string, string> = {
      prospection: 'bg-slate-50 text-slate-600 border-slate-200',
      qualification: 'bg-blue-50 text-blue-600 border-blue-200',
      proposition: 'bg-violet-50 text-violet-600 border-violet-200',
      negociation: 'bg-amber-50 text-amber-600 border-amber-200',
      gagne: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      gagnee: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      perdu: 'bg-rose-50 text-rose-600 border-rose-200',
      perdue: 'bg-rose-50 text-rose-600 border-rose-200',
    }
    return map[stage] || 'bg-slate-50 text-slate-600 border-slate-200'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de Bord</h1>
        <p className="text-sm text-slate-400 mt-1">Vue d'ensemble de votre activité commerciale</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                <span className={kpi.iconColor}>{kpi.icon}</span>
              </div>
              {kpi.trend && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                  kpi.trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {kpi.trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.trend.value}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.subtitle}</p>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 bg-white border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Chiffre d'Affaires par Semaine</h3>
              <p className="text-xs text-slate-400 mt-0.5">Réel vs Objectif</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingBlockStart: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#E67E22" strokeWidth={2.5} dot={{ fill: '#E67E22', r: 4 }} name="Réel" />
              <Line type="monotone" dataKey="target" stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Cible" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700">Distribution Pipeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">{opportunities.length} opportunités</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {pipelineData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-500">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Opportunities */}
      <Card className="bg-white border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Opportunités Récentes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Dernières activités commerciales</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg">
            Voir tout
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Titre</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Société</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Valeur</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Étape</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Probabilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.slice(0, 5).map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{opp.titre}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-500">{opp.company?.raisonSociale || 'N/A'}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-[#E67E22]">{(opp.valeurEstimee || 0).toLocaleString('fr-FR')} €</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getStageStyle(opp.pipelineStage)}`}>
                      {getStageLabel(opp.pipelineStage)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#E67E22] transition-all duration-500" style={{ inlineSize: `${opp.probabilite || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{opp.probabilite || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                    Aucune opportunité pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
