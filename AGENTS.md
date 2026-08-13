# AGENTS.md

Personal finance SPA: React 19 + TypeScript + Vite 8 (Rolldown). No real backend — MSW service worker acts as the API in dev and production. Data persists in `localStorage`.

## Commands

- `npm run dev` — dev server (HMR)
- `npm run build` — `tsc -b && vite build` (typecheck is part of build)
- `npm run preview` — serve built app
- `npm run test` — Vitest (unit + integration + RTL)
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npx vitest run <path>` — single test file; integration tests need jsdom + MSW handlers

## Structure

- `src/entities/{transaction,budget}/model` — domain: types, zod schemas, localStorage storage, repositories
- `src/api/` — fetch layer; `ApiError` thrown on non-2xx and network failure
- `src/mocks/` — MSW handlers = the "backend"; module-scoped repositories (handlers are created once per module load — reset modules in tests with `vi.resetModules()`)
- `src/shared/hooks/` — TanStack Query hooks (stable callbacks via `useCallback` — rows memoize on them)
- `src/shared/lib/monitoring.ts` — error reporting core (reporters + window listeners)
- `src/shared/ui/` — Modal (focus trap), ErrorBoundary, AsyncStates, PageContainer
- `src/pages/*` — lazy-loaded routes (`src/app/router.tsx`)

## Conventions

- No code comments unless asked; existing comments are kept
- Validation lives in zod schemas at the boundaries (form + CSV import re-validates raw cells)
- CSV import: aliases for categories, duplicate fingerprint = `date|amount|description(lowercased)`, limits: 5 MB file, 10 000 rows
- Modal: auto-focus first form element (skip `.modal__close`), Tab trap, focus restore on close
- New UI strings in English; tests in the same file style (`*.test.ts(x)` next to sources)
- Never run `npm audit` results into the repo; keep `rollup-plugin-visualizer` (build report → `dist/bundle-report.html`)

## QA gate (run before finishing)

`npx vitest run` → all green · `npm run lint` · `npm run build` (includes typecheck)

## Gotchas

- MSW in production is intentional: the mock worker IS the backend infra (see `main.tsx` comment)
- RTL needs `afterEach(cleanup)` — already set in `src/test/setup.ts`
- `PromiseRejectionEvent` in jsdom requires the `promise` init property
- jsdom URL is `http://localhost` so MSW handlers match in tests
- Vite 8 = Rolldown: manual chunks go under `build.rolldownOptions.output.manualChunks`
- CSP meta is injected only in production builds (dev needs inline scripts/websocket)
