import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://carshop-r48i.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'wss://carshop-r48i.onrender.com',
        ws: true,
        secure: false
      },
      '/uploads': {
        target: 'https://carshop-r48i.onrender.com',
        changeOrigin: true,
        secure: false
      }
    },
    host: true,
    allowedHosts: [
      'localhost',
      'carshop-1-x523.onrender.com',
      'carshop-frontend.onrender.com',
      '.onrender.com'
    ]
  }
})
