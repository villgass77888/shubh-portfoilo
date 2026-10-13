import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
  },
  build: {
    // hashed bundles live apart from the (unhashed) media in /assets, so they can be cached forever
    assetsDir: '_app',
    // read by scripts/prerender.mjs to preload each route's chunks
    manifest: true,
  },
})
