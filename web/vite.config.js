import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // PROXY: durante el desarrollo, cuando React pide "/api/...", Vite
    // reenvía la petición a la API que corre en el puerto 3000.
    // Así el navegador cree que todo viene del mismo lugar.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
