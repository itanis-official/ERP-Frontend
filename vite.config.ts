import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: { clientPort: 3000 },
    proxy: {
      '/api/crm': {
        target: 'http://localhost:5095',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/crm/, '/api')
      },
      '/api/rh': {
        target: 'http://localhost:5085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rh/, '/api')
      },
      '/api/bi': {
        target: 'http://localhost:5103',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bi/, '/api')
      },
      '/api/projet': {
        target: 'http://localhost:5101',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/projet/, '/api')
      },
      '/api/helpdesk': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/helpdesk/, '/api')
      },
      '/api/timesheet': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/timesheet/, '/api')
      }
    }
  }
})