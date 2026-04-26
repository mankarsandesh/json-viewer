import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use /json-viewer/ base path only for GitHub Pages (via GitHub Actions)
  // Otherwise default to / for Vercel and local dev
  base: process.env.GITHUB_ACTIONS ? '/json-viewer/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
}))
