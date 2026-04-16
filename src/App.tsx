import { AuthProvider } from './app/contexts/AuthContext'
import { AppRoutes } from './app/routes'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
