import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LoadingState } from '../shared/ui/AsyncStates'

// The app is served from a sub-path on GitHub Pages; BASE_URL is '/'
// in dev and '/Finance-Analyzer/' in production builds.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

// Shown while the lazy route module is loading on the first render;
// the router warns about its absence otherwise.
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        {
          path: 'dashboard',
          handle: { title: 'Dashboard' },
          lazy: () =>
            import('../pages/Dashboard/DashboardPage').then((m) => ({
              Component: m.DashboardPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'transactions',
          handle: { title: 'Transactions' },
          lazy: () =>
            import('../pages/Transactions/TransactionsPage').then((m) => ({
              Component: m.TransactionsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'analytics',
          handle: { title: 'Analytics' },
          lazy: () =>
            import('../pages/Analytics/AnalyticsPage').then((m) => ({
              Component: m.AnalyticsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'budgets',
          handle: { title: 'Budgets' },
          lazy: () =>
            import('../pages/Budgets/BudgetsPage').then((m) => ({
              Component: m.BudgetsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'categories',
          handle: { title: 'Categories' },
          lazy: () =>
            import('../pages/Categories/CategoriesPage').then((m) => ({
              Component: m.CategoriesPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'recurring',
          handle: { title: 'Recurring' },
          lazy: () =>
            import('../pages/Recurring/RecurringPage').then((m) => ({
              Component: m.RecurringPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'settings',
          handle: { title: 'Settings' },
          lazy: () =>
            import('../pages/Settings/SettingsPage').then((m) => ({
              Component: m.SettingsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
      ],
    },
  ],
  { basename },
)