# AGENTS.md

Personal finance SPA: React 19 + TypeScript + Vite 8 (Rolldown). No real backend — MSW service worker acts as the API in dev and production. Data persists in `localStorage`.

## Commands

- `npm run dev` — dev server (HMR)
- `npm run build` — `tsc -b && vite build` (typecheck is part of build)
- `npm run preview` — serve built app
- `npm run test` — Vitest (unit + integration + RTL)
- `npm run test:e2e` — Playwright `e2e/` against a fresh production build (runs `npm run preview`)
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npx vitest run <path>` — single test file; integration tests need jsdom + MSW handlers

## Structure

- `src/entities/{transaction,budget}/model` — domain: types, zod schemas, localStorage storage, repositories
- `src/api/` — fetch layer; `ApiError` thrown on non-2xx and network failure. Recurring undo goes through `POST /api/recurring/:id/restore` (full template body, validated with `isRecurring`)
- `src/api/local.ts` — the inline "server": referential integrity (`categoryExists` = built-ins + custom) checked in the 4 transaction/recurring write handlers; category deletion is blocked (409) when used by transactions, budgets **or recurring templates**
- `src/app/layouts/` — AppLayout + `useRecurringMaintenance` (engine run on open; outcome/error surfaced via toast in the layout)
- `src/mocks/` — MSW handlers = the "backend"; module-scoped repositories (handlers are created once per module load — reset modules in tests with `vi.resetModules()`)
- `src/shared/hooks/` — TanStack Query hooks (stable callbacks via `useCallback` — rows memoize on them)
- `src/shared/lib/monitoring.ts` — error reporting core (reporters + window listeners)
- `src/shared/lib/virtualWindow.ts` — windowed rendering math for long lists (pure `computeVirtualRange`); TransactionList virtualizes above 1 500 rows with fixed 48px rows (`table-layout: fixed`, ellipsis), activated only when the viewport is actually measurable (jsdom clientHeight 0 → full render, tests unaffected)
- `src/shared/ui/` — Modal (focus trap), ErrorBoundary, AsyncStates, PageContainer, Toast (status/alert variant, undo action, auto-dismiss)
- `src/pages/*` — lazy-loaded routes (`src/app/router.tsx`)
- `e2e/` + `playwright.config.ts` — Playwright E2E (chromium only), config lives in `tsconfig.node.json` scope
- `src/data/seed.ts` — 30 demo transactions seeded on first run (empty localStorage); E2E asserts against the seeded data
- `CONTRIBUTING.md` — checklist of defensive properties every new CRUD entity must inherit (undo with exact-state restore, surfaced mutation errors, referential integrity)

## Conventions

- No code comments unless asked; existing comments are kept
- Validation lives in zod schemas at the boundaries (form + CSV import re-validates raw cells)
- CSV import: aliases for categories, duplicate fingerprint = `date|amount|description(lowercased)`, limits: 5 MB file, 10 000 rows
- Modal: auto-focus first form element (skip `.modal__close`), Tab trap, focus restore on close
- New UI strings in English; tests in the same file style (`*.test.ts(x)` next to sources)
- Never run `npm audit` results into the repo; keep `rollup-plugin-visualizer` (build report → `dist/bundle-report.html`)

## QA gate (run before finishing)

`npx vitest run` → all green · `npm run lint` · `npm run build` (includes typecheck) · `npm run test:e2e` when Playwright-relevant files changed

## Gotchas

- MSW is intentional only in dev/tests: production runs the "server" inline — `handleLocalRequest` in `src/api/local.ts` (shared with `src/mocks/handlers.ts`, which delegates into it). No service worker in prod builds; `main.tsx` starts the worker only when `!import.meta.env.PROD`
- The worker only intercepts requests inside its scope: API paths and MSW handlers must both be prefixed with the deployment base (`resolveUrl` in `src/api/request.ts`, `API_BASE` in `src/mocks/handlers.ts`)
- GitHub Pages CDN caches everything for 10 min (`max-age=600`) — a fresh deploy briefly 404s old asset URLs; a hard reload fixes it. The deploy workflow caches `dist` so old hashed assets survive deploys
- E2E: `vite preview` serves the dist root, so tests run against builds made *without* `--base`; deploy builds (with `/Finance-Analyzer/` base) are not previewable locally. Vitest's `exclude` must keep `e2e/` out (specs would otherwise be collected)
- RTL needs `afterEach(cleanup)` — already set in `src/test/setup.ts`
- `PromiseRejectionEvent` in jsdom requires the `promise` init property
- jsdom URL is `http://localhost` so MSW handlers match in tests
- Vite 8 = Rolldown: manual chunks go under `build.rolldownOptions.output.manualChunks`
- CSP meta is injected only in production builds (dev needs inline scripts/websocket)
