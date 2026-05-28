import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      '/api': {
        target: 'https://shubham-ai-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },

      '/socket.io': {
        target: 'https://shubham-ai-backend.onrender.com',
        changeOrigin: true,
        ws: true,
        secure: true,
      },
    },
  },
})
