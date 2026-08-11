import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/test/setup.ts'],
    // Integration tests run in jsdom and fetch against the same origin
    // the browser uses, so the MSW handlers keep matching.
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})