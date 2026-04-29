import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Box, Card, Stack, Typography, TextField, Button, Divider, Switch, MenuItem,
  FormControlLabel, Grid, Avatar, Chip, IconButton, Tab, Tabs,
} from '@mui/material'
import {
  Business as BusinessIcon, Notifications as NotificationsIcon,
  Security as SecurityIcon, Palette as PaletteIcon, Language as LanguageIcon,
  CloudUpload as CloudUploadIcon, Delete as DeleteIcon,
} from '@mui/icons-material'
import { SelectOptionsManager } from '../../components/settings'

export function Settings() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [tab, setTab] = useState(0)
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography
          className="itanis-page-title"
          sx={{
            color: isDark ? '#F1E9DE' : '#2C3E50',
          }}
        >
          Paramètres CRM
        </Typography>
        <Typography sx={{ mt: 0.5, color: isDark ? '#A79A8E' : '#857B72', fontSize: 14 }}>
          Configuration générale du module commercial.
        </Typography>
      </Box>

      <Card
        variant="outlined"
        sx={{
          borderColor: isDark ? '#3B332B' : '#E2E8F0',
          bgcolor: isDark ? '#1F1A16' : '#FFFFFF',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            borderBlockEnd: `1px solid ${isDark ? '#3A342E' : '#E5E7EB'}`,
            bgcolor: isDark ? '#241F1B' : '#F8FAFC',
            '& .MuiTabs-indicator': {
              backgroundColor: '#E67E22',
              blockSize: 2.5,
            },
          }}
        >
          <Tab
            icon={<BusinessIcon />}
            iconPosition="start"
            label="Entreprise"
            sx={{ minBlockSize: 44, textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          />
          <Tab
            icon={<NotificationsIcon />}
            iconPosition="start"
            label="Notifications"
            sx={{ minBlockSize: 44, textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          />
          <Tab
            icon={<SecurityIcon />}
            iconPosition="start"
            label="Sécurité"
            sx={{ minBlockSize: 44, textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          />
          <Tab
            icon={<PaletteIcon />}
            iconPosition="start"
            label="Apparence"
            sx={{ minBlockSize: 44, textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          />
          <Tab
            icon={<LanguageIcon />}
            iconPosition="start"
            label="Régional"
            sx={{ minBlockSize: 44, textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          />
          <Tab
            icon={<BusinessIcon />}
            iconPosition="start"
            label="Listes"
            sx={{ minBlockSize: 44, textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>Informations entreprise</Typography>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ inlineSize: 96, blockSize: 96, bgcolor: '#E67E22', fontSize: 36 }}>IT</Avatar>
                <Stack spacing={1}>
                  <Button variant="outlined" startIcon={<CloudUploadIcon />} size="small">Télécharger un logo</Button>
                  <Typography variant="caption" color="text.secondary">PNG ou JPG, max 2MB</Typography>
                </Stack>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Nom de l'entreprise" fullWidth defaultValue="ITANIS" /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Matricule fiscal" fullWidth defaultValue="1234567/A/B/000" /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Email" fullWidth defaultValue="contact@itanis.com" /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Téléphone" fullWidth defaultValue="+216 71 000 000" /></Grid>
                <Grid size={{ xs: 12 }}><TextField label="Adresse" fullWidth defaultValue="Rue du Lac Léman, Les Berges du Lac 2, Tunis" /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Ville" fullWidth defaultValue="Tunis" /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Pays" fullWidth defaultValue="Tunisie" /></Grid>
              </Grid>
              <Box><Button variant="contained">Enregistrer</Button></Box>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>Préférences de notification</Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />}
                  label={<Box><Typography>Notifications email</Typography><Typography variant="caption" color="text.secondary">Recevoir un email pour chaque nouvelle activité</Typography></Box>}
                />
                <Divider />
                <FormControlLabel
                  control={<Switch checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} />}
                  label={<Box><Typography>Notifications push</Typography><Typography variant="caption" color="text.secondary">Alertes en temps réel dans le navigateur</Typography></Box>}
                />
                <Divider />
                <FormControlLabel
                  control={<Switch checked={weeklyReport} onChange={(e) => setWeeklyReport(e.target.checked)} />}
                  label={<Box><Typography>Rapport hebdomadaire</Typography><Typography variant="caption" color="text.secondary">Synthèse commerciale chaque lundi matin</Typography></Box>}
                />
              </Stack>
              <TextField label="Email de notification" fullWidth defaultValue="crm@itanis.com" />
              <Box><Button variant="contained">Enregistrer</Button></Box>
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>Sécurité du compte</Typography>
              <Stack spacing={2}>
                <TextField label="Mot de passe actuel" type="password" fullWidth />
                <TextField label="Nouveau mot de passe" type="password" fullWidth />
                <TextField label="Confirmer le mot de passe" type="password" fullWidth />
              </Stack>
              <Divider />
              <FormControlLabel
                control={<Switch checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />}
                label={<Box><Typography>Authentification à deux facteurs</Typography><Typography variant="caption" color="text.secondary">Sécurité renforcée via SMS ou application</Typography></Box>}
              />
              <Box>
                <Typography variant="subtitle2" mb={1}>Sessions actives</Typography>
                <Stack spacing={1}>
                  {[
                    { device: 'Chrome sur Windows', location: 'Tunis, Tunisie', current: true },
                    { device: 'Safari sur iPhone', location: 'Tunis, Tunisie', current: false },
                  ].map((s, i) => (
                    <Card key={i} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography fontWeight={500}>{s.device}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.location}</Typography>
                      </Box>
                      {s.current ? <Chip label="Session actuelle" color="success" size="small" /> : <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>}
                    </Card>
                  ))}
                </Stack>
              </Box>
              <Box><Button variant="contained">Mettre à jour</Button></Box>
            </Stack>
          )}

          {tab === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>Apparence</Typography>
              <TextField select label="Thème" fullWidth defaultValue="light">
                <MenuItem value="light">Clair</MenuItem>
                <MenuItem value="dark">Sombre</MenuItem>
                <MenuItem value="auto">Automatique</MenuItem>
              </TextField>
              <Box>
                <Typography variant="subtitle2" mb={1}>Couleur principale</Typography>
                <Stack direction="row" spacing={1}>
                  {['#E67E22', '#3498DB', '#9B59B6', '#27AE60', '#E74C3C'].map((c) => (
                    <Box key={c} sx={{ inlineSize: 40, blockSize: 40, bgcolor: c, borderRadius: 1, cursor: 'pointer', border: c === '#E67E22' ? '3px solid #2C3E50' : 'none' }} />
                  ))}
                </Stack>
              </Box>
              <TextField select label="Densité" fullWidth defaultValue="normal">
                <MenuItem value="compact">Compacte</MenuItem>
                <MenuItem value="normal">Normale</MenuItem>
                <MenuItem value="comfortable">Confortable</MenuItem>
              </TextField>
              <Box><Button variant="contained">Appliquer</Button></Box>
            </Stack>
          )}

          {tab === 4 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>Paramètres régionaux</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField select label="Langue" fullWidth defaultValue="fr">
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ar">العربية</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField select label="Fuseau horaire" fullWidth defaultValue="africa-tunis">
                    <MenuItem value="africa-tunis">Africa/Tunis (GMT+1)</MenuItem>
                    <MenuItem value="europe-paris">Europe/Paris (GMT+1)</MenuItem>
                    <MenuItem value="utc">UTC</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField select label="Devise" fullWidth defaultValue="EUR">
                    <MenuItem value="EUR">Euro (€)</MenuItem>
                    <MenuItem value="TND">Dinar tunisien (DT)</MenuItem>
                    <MenuItem value="USD">Dollar US ($)</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField select label="Format de date" fullWidth defaultValue="dd/mm/yyyy">
                    <MenuItem value="dd/mm/yyyy">DD/MM/YYYY</MenuItem>
                    <MenuItem value="mm/dd/yyyy">MM/DD/YYYY</MenuItem>
                    <MenuItem value="yyyy-mm-dd">YYYY-MM-DD</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <Box><Button variant="contained">Enregistrer</Button></Box>
            </Stack>
          )}

          {tab === 5 && (
            <Stack spacing={1.5}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: isDark ? '#3D352E' : '#E2E8F0',
                  bgcolor: isDark ? '#241F1B' : '#F8FAFC',
                  borderRadius: 2,
                  boxShadow: 'none',
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.5}>
                  <Typography variant="h6" fontWeight={700} color={isDark ? '#F1E9DE' : '#2C3E50'}>
                    Listes de sélection CRM
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#A79A8E' : '#857B72', alignSelf: { xs: 'flex-start', md: 'center' } }}>
                    Personnalisez les choix visibles dans les formulaires CRM.
                  </Typography>
                </Stack>
              </Card>
              <SelectOptionsManager module="crm" />
            </Stack>
          )}
        </Box>
      </Card>
    </Stack>
  )
}
