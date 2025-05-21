import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://carshop-r48i.onrender.com'
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: process.env.NODE_ENV === 'production'
          ? 'wss://carshop-r48i.onrender.com'
          : 'ws://localhost:5000',
        ws: true
      },
      '/uploads': {
        target: process.env.NODE_ENV === 'production'
          ? 'https://carshop-r48i.onrender.com'
          : 'http://localhost:5000',
        changeOrigin: true
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
