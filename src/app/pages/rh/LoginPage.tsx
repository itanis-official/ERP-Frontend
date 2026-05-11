import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../../contexts/AuthContext'
import { BrandLogo } from '../../components/BrandLogo'

export function LoginPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { login, completeFirstLoginPasswordChange } = useAuth()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [firstLoginIdentifier, setFirstLoginIdentifier] = useState('')
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const result = await login(loginId, password)

      if (result.mustChangePassword) {
        setRequiresPasswordChange(true)
        setFirstLoginIdentifier(result.login || loginId)
        setCurrentPasswordForChange(password)
        return
      }

      navigate('/rh/dashboard')
    } catch (e: any) {
      setErr(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    if (newPassword.length < 8) {
      setErr('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setErr('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      await completeFirstLoginPasswordChange(firstLoginIdentifier, currentPasswordForChange, newPassword)
      navigate('/rh/dashboard')
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
            <BrandLogo height={40} variant="auth" alt="Logo ITANIS RH" fallbackText="ITANIS RH" />
            <Typography color="text.secondary">
              {requiresPasswordChange ? 'Définissez votre nouveau mot de passe' : 'Connectez-vous à votre espace'}
            </Typography>
          </Box>
          {err && <Alert severity="error">{err}</Alert>}
          {!requiresPasswordChange ? (
            <form onSubmit={handleLogin}>
              <Stack spacing={2}>
                <TextField label="Login ou Email" value={loginId} onChange={(e) => setLoginId(e.target.value)} fullWidth required autoFocus />
                <TextField label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange}>
              <Stack spacing={2}>
                <Alert severity="warning">
                  Mot de passe temporaire détecté. Veuillez le changer pour continuer.
                </Alert>
                <TextField label="Nouveau mot de passe" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth required autoFocus />
                <TextField label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth required />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Card>
    </Box>
  )
}
