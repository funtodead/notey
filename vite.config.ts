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
      // Our own service worker (src/sw.ts), so it can show push notifications.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      pwaAssets: { config: true },
      manifest: {
        name: 'Notey',
        short_name: 'Notey',
        description: 'Notes and tasks, filed by AI.',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        theme_color: '#141319',
        background_color: '#141319',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}', 'assets/*-latin-*.woff2'],
      },
    }),
  ],
})
