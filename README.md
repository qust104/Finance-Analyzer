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

A full-featured SPA that tracks income and expenses: transaction CRUD with filters and CSV import, monthly budgets, spending analytics, charts and automatically generated financial insights.

## ✨ Features

| Feature | Details |
| --- | --- |
| 🧾 **Transactions** | CRUD, search, category / type / month filters, URL-synced sort state |
| 📥 **CSV import** | Hand-written state-machine parser, category aliases (`еда` → `food`), duplicate detection, size / row limits |
| 🎯 **Budgets** | Per-category monthly limits with progress bars and warnings |
| 📊 **Dashboard** | Cash flow and spending charts (Recharts), recent activity, budget overview |
| 💡 **Insights** | Rule-based hints: overspending, high savings rate, budget warnings |
| 📦 **Mock API** | MSW service worker acts as the backend — no server needed, works in production builds |
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
| Mock backend | MSW |
| Tests | Vitest + React Testing Library (108 tests) |
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
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` without emitting |
| `npm run format` | Prettier --write |

## 🧪 Testing

- **99+ unit tests** for domain logic, analytics, CSV parsing and validation
- **Integration tests** drive real user flows (add / edit / delete / import) against the MSW API
- **Accessibility tests** verify focus management in the modal dialog
- **Performance test** proves row memoization with a 2 000-row list (React Profiler)

```bash
npm run test
```

## 📁 Project Structure

```
src/
├── analytics/            # calculations, budget usage, insights
├── api/                  # fetch layer (ApiError, endpoints)
├── app/                  # router, layout, lazy-loaded routes
├── data/                 # seed data
├── entities/
│   ├── transaction/      # model, storage, repository, form, list, filters
│   └── budget/           # model, storage, form, progress
├── features/
│   └── import-transactions/  # CSV parser + import modal
├── mocks/                # MSW handlers (the "backend")
├── pages/                # Dashboard, Transactions, Budgets, Analytics, Settings
└── shared/
    ├── hooks/            # data hooks (useTransactions, useBudgets)
    ├── lib/              # formatting, monitoring, category colors
    ├── store/            # Zustand UI store
    └── ui/               # Modal, AsyncStates, ErrorBoundary, PageContainer
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
