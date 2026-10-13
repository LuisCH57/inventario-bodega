import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Al compilar para publicar, la app vivirá en luisch57.github.io/inventario-bodega/.
  // En desarrollo (npm run dev) sigue en la raíz: localhost:5173/
  base: command === 'build' ? '/inventario-bodega/' : '/',

  server: {
    // PROXY: durante el desarrollo, cuando React pide "/api/...", Vite
    // reenvía la petición a la API que corre en el puerto 3000.
    // Así el navegador cree que todo viene del mismo lugar.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
}))
