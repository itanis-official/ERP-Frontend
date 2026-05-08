import { useState } from 'react'
import {
  Box, Card, Grid, Stack, Typography, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Avatar, Button, Tab, Tabs, LinearProgress, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Divider,
} from '@mui/material'
import {
  Description as DescriptionIcon, TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon, Receipt as ReceiptIcon,
  Download as DownloadIcon, CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon, Support as SupportIcon, Message as MessageIcon,
} from '@mui/icons-material'

const CONTRACTS = [
  { id: 1, reference: 'CTR-2026-001', title: 'Maintenance applicative', amount: 45000, status: 'active', dateStart: '2026-01-01', dateEnd: '2026-12-31' },
  { id: 2, reference: 'CTR-2026-002', title: 'Développement ERP', amount: 120000, status: 'active', dateStart: '2026-02-15', dateEnd: '2026-08-15' },
  { id: 3, reference: 'CTR-2025-018', title: 'Audit sécurité', amount: 18000, status: 'completed', dateStart: '2025-09-01', dateEnd: '2025-12-31' },
]

const INVOICES = [
  { id: 'INV-2026-034', date: '2026-03-31', amount: 7500, status: 'paid' },
  { id: 'INV-2026-028', date: '2026-02-28', amount: 7500, status: 'paid' },
  { id: 'INV-2026-019', date: '2026-01-31', amount: 7500, status: 'pending' },
]

const TICKETS = [
  { id: 'TK-0412', subject: 'Erreur export PDF', status: 'open', priority: 'high', date: '2026-04-05' },
  { id: 'TK-0408', subject: 'Demande évolution filtre', status: 'in_progress', priority: 'medium', date: '2026-04-02' },
  { id: 'TK-0395', subject: 'Formation nouveaux utilisateurs', status: 'resolved', priority: 'low', date: '2026-03-25' },
]

const ACTIVITIES = [
  { icon: <CheckCircleIcon />, color: '#27AE60', text: 'Facture INV-2026-034 payée', time: 'Il y a 2 jours' },
  { icon: <ScheduleIcon />, color: '#E67E22', text: 'Nouvelle réunion planifiée avec votre chargé de compte', time: 'Il y a 4 jours' },
  { icon: <DescriptionIcon />, color: '#3498DB', text: 'Contrat CTR-2026-002 signé', time: 'Il y a 1 semaine' },
  { icon: <MessageIcon />, color: '#9B59B6', text: 'Nouveau message de support', time: 'Il y a 2 semaines' },
]

function StatCard({ icon, label, value, color }: any) {
  return (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 56, height: 56, bgcolor: color + '22', color, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" fontWeight={700}>{value}</Typography>
      </Box>
    </Card>
  )
}

export function ClientPortal() {
  const [tab, setTab] = useState(0)

  const totalSpent = INVOICES.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = INVOICES.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 4, background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)', color: '#fff' }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#ef7c21', color: '#fff', fontSize: 32, fontWeight: 700 }}>SA</Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>Bienvenue, Société Alpha</Typography>
            <Typography sx={{ opacity: 0.9 }}>Votre portail client ITANIS</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Dernière connexion : aujourd'hui à 09:42</Typography>
          </Box>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<DescriptionIcon />} label="Contrats actifs" value={CONTRACTS.filter((c) => c.status === 'active').length} color="#27AE60" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<TrendingUpIcon />} label="Total contrats" value={`${CONTRACTS.reduce((s, c) => s + c.amount, 0).toLocaleString()} €`} color="#3498DB" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<AttachMoneyIcon />} label="Payé" value={`${totalSpent.toLocaleString()} €`} color="#E67E22" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<ReceiptIcon />} label="En attente" value={`${pendingAmount.toLocaleString()} €`} color="#9B59B6" />
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Contrats" />
          <Tab label="Factures" />
          <Tab label="Support" />
          <Tab label="Activité" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Table>
              <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                <TableRow>
                  <TableCell>Référence</TableCell><TableCell>Objet</TableCell>
                  <TableCell>Montant</TableCell><TableCell>Période</TableCell>
                  <TableCell>Statut</TableCell><TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CONTRACTS.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography fontWeight={500}>{c.reference}</Typography></TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>{c.amount.toLocaleString()} €</TableCell>
                    <TableCell><Typography variant="caption">{c.dateStart} → {c.dateEnd}</Typography></TableCell>
                    <TableCell><Chip label={c.status === 'active' ? 'Actif' : 'Terminé'} size="small" color={c.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell><IconButton size="small"><DownloadIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {tab === 1 && (
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Progression annuelle</Typography>
                  <Typography variant="body2" fontWeight={600}>{totalSpent.toLocaleString()} € / {(totalSpent + pendingAmount).toLocaleString()} €</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(totalSpent / (totalSpent + pendingAmount)) * 100} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Table>
                <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                  <TableRow>
                    <TableCell>Numéro</TableCell><TableCell>Date</TableCell>
                    <TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INVOICES.map((i) => (
                    <TableRow key={i.id} hover>
                      <TableCell><Typography fontWeight={500}>{i.id}</Typography></TableCell>
                      <TableCell>{i.date}</TableCell>
                      <TableCell>{i.amount.toLocaleString()} €</TableCell>
                      <TableCell><Chip label={i.status === 'paid' ? 'Payée' : 'En attente'} size="small" color={i.status === 'paid' ? 'success' : 'warning'} /></TableCell>
                      <TableCell><IconButton size="small"><DownloadIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>Mes tickets</Typography>
                <Button variant="contained" startIcon={<SupportIcon />}>Nouveau ticket</Button>
              </Stack>
              <Stack spacing={1}>
                {TICKETS.map((t) => (
                  <Card key={t.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={500}>{t.id}</Typography>
                          <Chip
                            label={t.priority === 'high' ? 'Haute' : t.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            size="small"
                            color={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'default'}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{t.subject}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.date}</Typography>
                      </Box>
                      <Chip
                        label={t.status === 'open' ? 'Ouvert' : t.status === 'in_progress' ? 'En cours' : 'Résolu'}
                        color={t.status === 'resolved' ? 'success' : t.status === 'in_progress' ? 'info' : 'warning'}
                        size="small"
                      />
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          )}

          {tab === 3 && (
            <List>
              {ACTIVITIES.map((a, i) => (
                <Box key={i}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: a.color + '22', color: a.color }}>{a.icon}</Avatar>
                    </ListItemIcon>
                    <ListItemText primary={a.text} secondary={a.time} />
                  </ListItem>
                  {i < ACTIVITIES.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Card>
    </Stack>
  )
}
