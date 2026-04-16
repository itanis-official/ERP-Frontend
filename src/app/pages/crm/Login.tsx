import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../../contexts/AuthContext'
import { BrandLogo } from '../../components/BrandLogo'

export function Login() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const result = await login(loginId, password)
      if (result.mustChangePassword) {
        setErr('Mot de passe temporaire détecté. Veuillez changer votre mot de passe depuis la connexion RH.')
        return
      }
      navigate('/crm/dashboard')
    } catch (e: any) {
      setErr(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#121210' : '#fffaf5' }}>
      <Card sx={{ p: 5, width: 400, bgcolor: isDark ? '#1a1a18' : '#fff', border: `1px solid ${isDark ? '#2b2a28' : '#f1dfd2'}` }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <BrandLogo height={40} variant="auth" alt="Logo ITANIS CRM" fallbackText="ITANIS CRM" />
            <Typography color="text.secondary">Connectez-vous à votre espace</Typography>
          </Box>
          {err && <Alert severity="error">{err}</Alert>}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Login ou Email" value={loginId} onChange={(e) => setLoginId(e.target.value)} fullWidth required autoFocus />
              <TextField label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Box>
  )
}
