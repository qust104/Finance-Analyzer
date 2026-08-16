import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { visualizer } from 'rollup-plugin-visualizer'
import type { Plugin } from 'vite'

// The mock worker is a service worker, recharts paints with inline
// style attributes, and everything else is self-hosted. The meta tag
// only ships in production builds: the dev server relies on inline
// scripts and a websocket for HMR.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function injectCspMeta(): Plugin {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectCspMeta(), visualizer({ filename: 'dist/bundle-report.html', open: false })],
  server: {
    // Bind to IPv4 loopback: the default IPv6-only listener ("::1")
    // breaks the HMR websocket on setups where localhost resolves to
    // 127.0.0.1 or a proxy/firewall chokes on IPv6 upgrades.
    host: '127.0.0.1',
  },
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
    // E2E specs live in e2e/ and are owned by Playwright, not Vitest.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      'e2e/**',
      'test-results/**',
    ],
    // Integration and performance tests are slow under parallel load.
    testTimeout: 10_000,
    // Integration tests run in jsdom and fetch against the same origin
    // the browser uses, so the MSW handlers keep matching.
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})