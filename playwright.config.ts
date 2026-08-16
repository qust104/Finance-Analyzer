import { defineConfig } from '@playwright/test'

// E2E runs against the production build: the app serves itself offline
// (no MSW worker in prod), so `vite preview` is the real app surface.
// Built without --base: preview serves assets from the root, unlike the
// /Finance-Analyzer/ prefix used for GitHub Pages deploys.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})