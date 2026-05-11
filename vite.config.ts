import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: 3000,
    },
  proxy: {
  '/api/helpdesk': {
    target: 'http://host.docker.internal:5006',
    changeOrigin: true,
  },
  '/api/timesheet': {
    target: 'http://host.docker.internal:5004',
    changeOrigin: true,
  }
}
  }
})