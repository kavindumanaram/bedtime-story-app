import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // .env.local lives at the repo root, not packages/frontend
  envDir: `${__dirname}/../..`,
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
