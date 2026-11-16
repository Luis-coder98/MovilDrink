import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Rutas relativas: así la carpeta `dist` funciona igual en Netlify,
  // en GitHub Pages dentro de un subdirectorio o abierta desde disco.
  base: './',

  server: {
    host: true,   // expone el servidor al WiFi para probar en el celular
    port: 5173,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
