import { Link } from 'react-router-dom'
import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { Business as BusinessIcon, People as PeopleIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { BrandLogo } from '../components/BrandLogo'

export function ModuleSelector() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: isDark ? '#121210' : '#fffaf5' }}>
      <Stack spacing={4} alignItems="center" maxWidth={900}>
        <Box textAlign="center">
          <BrandLogo height={48} variant="hero" alt="Logo ITANIS ERP" fallbackText="ITANIS ERP" />
          <Typography color="text.secondary" mt={1}>Sélectionnez un module pour continuer</Typography>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Card sx={{ p: 4, width: 320, textAlign: 'center', bgcolor: isDark ? '#1a1a18' : '#fff', border: `1px solid ${isDark ? '#2b2a28' : '#f1dfd2'}` }}>
            <PeopleIcon sx={{ fontSize: 64, color: '#E67E22', mb: 2 }} />
            <Typography variant="h5" fontWeight={600}>Module RH</Typography>
            <Typography color="text.secondary" mb={3}>Gestion du personnel et des congés</Typography>
            <Button component={Link} to="/rh/login" variant="contained" fullWidth>Accéder</Button>
          </Card>
          <Card sx={{ p: 4, width: 320, textAlign: 'center', bgcolor: isDark ? '#1a1a18' : '#fff', border: `1px solid ${isDark ? '#2b2a28' : '#f1dfd2'}` }}>
            <BusinessIcon sx={{ fontSize: 64, color: '#E67E22', mb: 2 }} />
            <Typography variant="h5" fontWeight={600}>Module CRM</Typography>
            <Typography color="text.secondary" mb={3}>Gestion clients et opportunités</Typography>
            <Button component={Link} to="/crm/login" variant="contained" fullWidth>Accéder</Button>
          </Card>
        </Stack>
      </Stack>
    </Box>
  )
}
