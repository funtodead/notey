import { defineConfig } from '@vite-pwa/assets-generator/config'

// The icon artwork is full-bleed, so no padding: iOS rounds the corners itself.
const noPadding = { padding: 0 }

export default defineConfig({
  preset: {
    transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], ...noPadding },
    maskable: { sizes: [512], ...noPadding },
    apple: { sizes: [180], ...noPadding },
  },
  images: ['public/icon.svg'],
})
