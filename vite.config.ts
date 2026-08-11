import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/bundle-report.html', open: false }),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts'
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@tanstack')
          ) {
            return 'vendor-react'
          }
          if (
            id.includes('node_modules/msw') ||
            id.includes('node_modules/@mswjs') ||
            id.includes('node_modules/@bundled-es-modules') ||
            id.includes('node_modules/@open-draft') ||
            id.includes('node_modules/outvariant') ||
            id.includes('node_modules/path-to-regexp') ||
            id.includes('node_modules/strict-event-emitter') ||
            id.includes('node_modules/headers-polyfill') ||
            id.includes('node_modules/cookie') ||
            id.includes('node_modules/statuses') ||
            id.includes('node_modules/graphql') ||
            id.includes('node_modules/events') ||
            id.includes('node_modules/type-fest')
          ) {
            return 'mocks'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  test: {
    setupFiles: ['./src/test/setup.ts'],
    // Integration tests run in jsdom and fetch against the same origin
    // the browser uses, so the MSW handlers keep matching.
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})