import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        lazy: () =>
          import('../pages/Dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
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
          import('../pages/Budgets/BudgetsPage').then((m) => ({ Component: m.BudgetsPage })),
      },
      {
        path: 'settings',
        lazy: () =>
          import('../pages/Settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
      },
    ],
  },
])