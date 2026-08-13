import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'

// The app is served from a sub-path on GitHub Pages; BASE_URL is '/'
// in dev and '/Finance-Analyzer/' in production builds.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

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
        },
        {
          path: 'transactions',
          lazy: () =>
            import('../pages/Transactions/TransactionsPage').then((m) => ({
              Component: m.TransactionsPage,
            })),
        },
        {
          path: 'analytics',
          lazy: () =>
            import('../pages/Analytics/AnalyticsPage').then((m) => ({
              Component: m.AnalyticsPage,
            })),
        },
        {
          path: 'budgets',
          lazy: () =>
            import('../pages/Budgets/BudgetsPage').then((m) => ({
              Component: m.BudgetsPage,
            })),
        },
        {
          path: 'settings',
          lazy: () =>
            import('../pages/Settings/SettingsPage').then((m) => ({
              Component: m.SettingsPage,
            })),
        },
      ],
    },
  ],
  { basename },
)