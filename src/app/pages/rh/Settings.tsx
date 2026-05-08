import { useTheme } from '@mui/material/styles'
import { Card } from '../../components/ui/card'
import { SelectOptionsManager } from '../../components/settings'

export function Settings() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <div className="space-y-4">
      <header>
        <h1 className="itanis-page-title" style={{ color: isDark ? '#F1E9DE' : undefined }}>Paramètres RH</h1>
        <p style={{ marginBlockStart: 4, color: isDark ? '#A79A8E' : '#857B72', fontSize: 14 }}>
          Configuration des listes et préférences RH.
        </p>
      </header>

      <Card
        className="rounded-xl"
        style={{
          border: `1px solid ${isDark ? '#3D352E' : '#E2E8F0'}`,
          background: isDark ? '#241F1B' : '#F8FAFC',
          boxShadow: 'none',
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, color: isDark ? '#F1E9DE' : '#2C3E50', fontWeight: 700, fontSize: 18 }}>
            Listes de sélection RH
          </p>
          <p style={{ margin: 0, color: isDark ? '#A79A8E' : '#857B72', fontSize: 12 }}>
            Gérez les options affichées dans les formulaires RH.
          </p>
        </div>
      </Card>

      <Card
        className="rounded-xl p-5"
        style={{
          border: `1px solid ${isDark ? '#3C342C' : '#E2E8F0'}`,
          background: isDark ? '#1F1A16' : '#FFFFFF',
          boxShadow: 'none',
        }}
      >
        <SelectOptionsManager module="rh" />
      </Card>
    </div>
  )
}
