<div align="center">

# 💸 Finance Analyzer

**A personal finance dashboard with transactions, budgets, analytics and insights — all running locally with a mock API.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Zustand](https://img.shields.io/badge/Zustand-764ABC?logo=zustand&logoColor=white)](https://zustand.docs.pmnd.rs)
[![React Hook Form + Zod](https://img.shields.io/badge/RHF_%2B_Zod-EC5990?logo=reacthookform&logoColor=white)](https://react-hook-form.com)
[![Recharts](https://img.shields.io/badge/Recharts-22b8cf?logo=recharts&logoColor=white)](https://recharts.org)
[![MSW](https://img.shields.io/badge/MSW-FF6A33?logo=mockserviceworker&logoColor=white)](https://mswjs.io)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)

</div>

A full-featured SPA that tracks income and expenses: transaction CRUD with filters and CSV import, monthly budgets, custom categories, recurring transactions, spending analytics, charts and automatically generated financial insights — with backup/restore and a dark mode.

## ✨ Features

| Feature | Details |
| --- | --- |
| 🧾 **Transactions** | CRUD, search, category / type / month filters, date range, amount range, URL-synced sort state |
| 🚀 **Virtualized list** | Long lists are window-rendered (>1 500 rows) with fixed row heights and overscan — the DOM stays tiny no matter the list size |
| 📥 **CSV import** | Hand-written state-machine parser, category aliases (`еда` → `food`), duplicate detection, size / row limits, drag & drop |
| 🎯 **Budgets** | Per-category monthly limits with progress bars and warnings |
| 🔁 **Recurring transactions** | Weekly / monthly / yearly templates auto-posted on app load, backfill and duplicate protection; delete is undoable (template restored with its engine state), auto-posting reported via toast |
| 🏷 **Custom categories** | User-defined categories with colors and aliases, built-in catalogue, CSV alias resolution; rows must reference an existing category (referential integrity on write) |
| 📊 **Dashboard** | Cash flow and spending charts (Recharts), recent activity, budget overview |
| 📈 **Analytics** | Monthly trend, category breakdown and month-over-month comparison |
| 💡 **Insights** | Rule-based hints: overspending, high savings rate, budget warnings |
| 💾 **Backup & restore** | JSON export / import covering transactions, budgets, categories and recurring templates |
| 🌙 **Dark mode** | Sidebar toggle, persisted, no-flash bootstrap before first paint |
| 🔍 **Command palette** | Ctrl/Cmd+K fuzzy search over transactions, budgets, categories and pages, with match highlighting and grouped results |
| 📦 **Mock API** | MSW service worker acts as the backend — no server needed, works in production builds |
| 📲 **PWA / offline** | Installable app with a precached shell — the SPA works with no network after the first visit |
| 💾 **Persistence** | All data survives reloads via `localStorage` |

## 🛠 Tech Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 (Rolldown), route-level code splitting |
| Server state | TanStack Query (cache + mutations) |
| Client state | Zustand (modal / form flags) |
| Forms | React Hook Form + Zod schemas |
| Charts | Recharts |
| Mock backend | MSW (dev/tests) + inline local handler (production) |
| Tests | Vitest + React Testing Library (247 tests) + Playwright (11 E2E scenarios) |
| Quality | ESLint + Prettier, strict TypeScript |

## 🚀 Getting Started

```bash
npm install
npm run dev        # start the dev server (HMR)
npm run preview    # serve the production build
```

### 📜 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the built app |
| `npm run test` | Run all tests (Vitest) |
| `npm run test:e2e` | Playwright E2E against a fresh production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` without emitting |
| `npm run check:bundle` | Fail when the total JS payload exceeds the budget |
| `npm run format` | Prettier --write |

## 🧪 Testing

- **200+ unit tests** for domain logic, analytics, CSV parsing, validation and theming
- **Integration tests** drive real user flows (add / edit / delete / import / undo) against the MSW API
- **Accessibility tests** verify focus management in the modal dialog
- **Performance test** proves row memoization with a 2 000-row list (React Profiler); windowed rendering keeps the DOM under 100 rows for lists of 2 500
- **11 Playwright E2E scenarios** run against a production build (`vite preview`): navigation, transaction → dashboard → budget flow, custom categories, recurring auto-posting + undo, backup export, dark mode, offline reload via the PWA shell, drag & drop CSV import, windowing in a 2 500-row list

```bash
npm run test
npm run test:e2e
```

## 📁 Project Structure

```
src/
├── analytics/            # calculations, budget usage, insights, recurring schedule
├── api/                  # fetch layer (ApiError, endpoints)
├── app/                  # router, layout (nav + theme toggle), lazy-loaded routes
├── data/                 # seed data
├── entities/
│   ├── transaction/      # model, storage, repository, form, list, filters
│   ├── budget/           # model, storage, form, progress
│   ├── category/         # model, catalogue, storage, form
│   └── recurring/        # model, storage, form
├── features/
│   ├── import-transactions/  # CSV parser + import modal
│   ├── export-data/          # backup payload build / parse
│   └── recurring/            # schedule engine
├── mocks/                # MSW handlers (the "backend")
├── pages/                # Dashboard, Transactions, Budgets, Analytics,
│                         # Categories, Recurring, Settings
└── shared/
    ├── hooks/            # data hooks (useTransactions, useBudgets, useTheme)
    ├── command-palette/  # Ctrl/Cmd+K quick search (index + store + UI)
    ├── lib/              # formatting, monitoring, virtual window math, category colors
    ├── store/            # Zustand UI store
    └── ui/               # Modal, AsyncStates, ErrorBoundary, ThemeToggle
e2e/                      # Playwright scenarios (production build)
```

## 🧠 Architecture Notes

- **One validation source**: Zod schemas are shared by forms and the future API contract; CSV rows are re-validated on import.
- **The UI never touches storage**: repositories live behind the MSW handlers, the query cache is the only source the UI reads.
- **Safety by default**: CSP header in production builds, import size limits, no `dangerouslySetInnerHTML`.
- **Accessible dialogs**: focus trap, auto-focus and focus restore in the modal (WAI-ARIA dialog pattern).
- **Bundled with intent**: route-level lazy loading + vendor chunk splitting keeps the app shell at ~4 kB.

## 👤 Author

**Aleksei Zaharov**

- GitHub: [@az1023415](https://github.com/az1023415)
- Email: [az1023415@gmail.com](mailto:az1023415@gmail.com)
