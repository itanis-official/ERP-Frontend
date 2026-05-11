import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Typography,
} from '@mui/material'
import { Check as CheckIcon, Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material'
import { rhApi } from '../../lib/api'
import { useModuleSelectOptions } from '../../lib/selectOptionsConfig'

const initialTeleworkForm = {
  employeId: '',
  typeTeletravail: 'Regular',
  dateDebut: '',
  dateFin: '',
  joursParSemaine: '1',
  joursFixes: '',
  raison: '',
  equipementFourni: false,
  vpnConfigure: false,
  accesOutilsOk: false,
  horairesJoignables: '',
  modeContact: '',
}

export function RemoteWorkRequests() {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openCreate, setOpenCreate] = useState(false)
  const [form, setForm] = useState(initialTeleworkForm)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['teletravail'],
    queryFn: async () => {
      try { return (await rhApi.get('/api/demandesteletravail')).data }
      catch { return [] }
    },
  })

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['rh-employees'],
    queryFn: async () => {
      try { return (await rhApi.get('/api/collaborateursinternes')).data }
      catch { return [] }
    },
  })

  const approveMut = useMutation({
    mutationFn: (id: number) => rhApi.put(`/api/demandesteletravail/${id}/approve-rh`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teletravail'] }),
  })
  const rejectMut = useMutation({
    mutationFn: (id: number) => rhApi.put(`/api/demandesteletravail/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teletravail'] }),
  })

  const createTeleworkMut = useMutation({
    mutationFn: (payload: any) => rhApi.post('/api/demandesteletravail', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teletravail'] })
      setOpenCreate(false)
      setForm(initialTeleworkForm)
    },
  })

  const handleCreateTelework = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.employeId || !form.raison) return

    createTeleworkMut.mutate({
      EmployeId: Number(form.employeId),
      Type: form.typeTeletravail,
      DateDebut: form.dateDebut || null,
      DateFin: form.dateFin || null,
      JoursParSemaine: Number(form.joursParSemaine) || 0,
      JoursFixes: form.joursFixes || null,
      Raison: form.raison,
      TypeRaison: null,
      EquipementFourni: form.equipementFourni,
      VpnConfigure: form.vpnConfigure,
      AccesOutilsOk: form.accesOutilsOk,
      HorairesJoignables: form.horairesJoignables || null,
      ModeContact: form.modeContact || null,
    })
  }

  const filtered = data.filter((r) => {
    const name = `${r.employe?.prenom || ''} ${r.employe?.nom || ''}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.statut === statusFilter
    return matchSearch && matchStatus
  })

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  useEffect(() => {
    setPage(0)
  }, [search, statusFilter, rowsPerPage])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1)
    if (page > maxPage) setPage(maxPage)
  }, [filtered.length, page, rowsPerPage])

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#2C3E50">Demandes de Télétravail</Typography>
          <Typography color="text.secondary">Gestion des demandes de télétravail</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpenCreate(true)}>
          Nouvelle demande télétravail
        </Button>
      </Stack>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nouvelle demande de télétravail</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateTelework} sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="telework-employee-label">Employé</InputLabel>
              <Select
                labelId="telework-employee-label"
                label="Employé"
                value={form.employeId}
                onChange={(e) => setForm({ ...form, employeId: e.target.value })}
              >
                <MenuItem value="">Sélectionner un employé</MenuItem>
                {employees.map((employee: any) => (
                  <MenuItem key={employee.id} value={String(employee.id)}>
                    {employee.prenom} {employee.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="telework-type-label">Type de télétravail</InputLabel>
              <Select
                labelId="telework-type-label"
                label="Type de télétravail"
                value={form.typeTeletravail}
                onChange={(e) => setForm({ ...form, typeTeletravail: e.target.value })}
              >
                {(rhSelectOptions.teleworkTypes || []).map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Date de début"
                InputLabelProps={{ shrink: true }}
                value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              />
              <TextField
                fullWidth
                type="date"
                label="Date de fin"
                InputLabelProps={{ shrink: true }}
                value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              />
            </Stack>

            <TextField
              fullWidth
              type="number"
              label="Jours par semaine"
              inputProps={{ min: 1, max: 7 }}
              value={form.joursParSemaine}
              onChange={(e) => setForm({ ...form, joursParSemaine: e.target.value })}
            />

            <TextField
              fullWidth
              label="Jours fixes"
              value={form.joursFixes}
              onChange={(e) => setForm({ ...form, joursFixes: e.target.value })}
            />

            <TextField
              fullWidth
              label="Raison"
              multiline
              minRows={3}
              value={form.raison}
              onChange={(e) => setForm({ ...form, raison: e.target.value })}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.equipementFourni}
                  onChange={(e) => setForm({ ...form, equipementFourni: e.target.checked })}
                />
              }
              label="Équipement fourni"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.vpnConfigure}
                  onChange={(e) => setForm({ ...form, vpnConfigure: e.target.checked })}
                />
              }
              label="VPN configuré"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.accesOutilsOk}
                  onChange={(e) => setForm({ ...form, accesOutilsOk: e.target.checked })}
                />
              }
              label="Accès aux outils OK"
            />

            <TextField
              fullWidth
              label="Horaires joignables"
              value={form.horairesJoignables}
              onChange={(e) => setForm({ ...form, horairesJoignables: e.target.value })}
            />
            <TextField
              fullWidth
              label="Mode de contact"
              value={form.modeContact}
              onChange={(e) => setForm({ ...form, modeContact: e.target.value })}
            />

            <DialogActions sx={{ px: 0, pt: 0 }}>
              <Button variant="outlined" onClick={() => setOpenCreate(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="contained">
                Soumettre
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Card sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="flex-end">
          <TextField placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minInlineSize: 280 }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#7F8C8D' }} /> }} />
          <FormControl size="small" sx={{ minInlineSize: 190 }}>
            <InputLabel id="remote-work-status-filter-label">Statut</InputLabel>
            <Select
              labelId="remote-work-status-filter-label"
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                bgcolor: '#FFFFFF',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#DDD5CD',
                },
              }}
            >
              <MenuItem value="all">Tous</MenuItem>
              {(rhSelectOptions.requestStatuses || []).map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Card>

      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                <TableRow>
                  <TableCell>Employé</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Période</TableCell>
                  <TableCell>Jours/sem</TableCell>
                  <TableCell>Raison</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.employe ? `${r.employe.prenom} ${r.employe.nom}` : `#${r.employeId}`}</TableCell>
                    <TableCell><Chip label={r.type} size="small" /></TableCell>
                    <TableCell>{formatDate(r.dateDebut)} → {formatDate(r.dateFin)}</TableCell>
                    <TableCell>{r.joursParSemaine}</TableCell>
                    <TableCell sx={{ maxInlineSize: 240 }}><Typography noWrap variant="body2">{r.raison}</Typography></TableCell>
                    <TableCell><Chip label={r.statut} size="small" /></TableCell>
                    <TableCell>
                      {r.statut === 'Pending' && (
                        <>
                          <IconButton size="small" color="success" onClick={() => approveMut.mutate(r.id)}><CheckIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => rejectMut.mutate(r.id)}><CloseIcon fontSize="small" /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>Aucune demande</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Lignes"
            sx={{
              borderBlockStart: '1px solid',
              borderColor: '#E5E7EB',
              bgcolor: '#F8FAFC',
              '& .MuiTablePagination-toolbar': {
                minBlockSize: 52,
                px: 2,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: '#64748B',
                fontSize: 12,
                fontWeight: 600,
              },
              '& .MuiInputBase-root': {
                borderRadius: '10px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                px: 0.5,
                py: 0.1,
              },
              '& .MuiIconButton-root': {
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                mx: 0.2,
              },
            }}
          />
        )}
      </Card>
    </Stack>
  )
}
