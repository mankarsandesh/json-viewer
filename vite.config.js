import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // For GitHub Pages: change "json-viewer" to your actual repo name
  // If deploying to <username>.github.io (a user/org root site), set this to '/'
  base: command === 'build' ? '/json-viewer/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
}))
