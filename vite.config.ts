import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base works both locally and under github.io/notey/.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        name: 'Notey',
        short_name: 'Notey',
        description: 'Notes and tasks, filed by AI.',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        theme_color: '#000000',
        background_color: '#000000',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
