import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/events': { target: 'http://localhost:3001', changeOrigin: true },
      '/images': { target: 'http://localhost:3001', changeOrigin: true },
      '/files': { target: 'http://localhost:3001', changeOrigin: true },
      '/upload': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})