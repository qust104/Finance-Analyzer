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
          lazy: () =>
            import('../pages/Dashboard/DashboardPage').then((m) => ({
              Component: m.DashboardPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'transactions',
          lazy: () =>
            import('../pages/Transactions/TransactionsPage').then((m) => ({
              Component: m.TransactionsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'analytics',
          lazy: () =>
            import('../pages/Analytics/AnalyticsPage').then((m) => ({
              Component: m.AnalyticsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'budgets',
          lazy: () =>
            import('../pages/Budgets/BudgetsPage').then((m) => ({
              Component: m.BudgetsPage,
            })),
          hydrateFallbackElement: <LoadingState />,
        },
        {
          path: 'settings',
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