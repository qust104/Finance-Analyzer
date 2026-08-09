import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { TransactionsPage } from '../pages/Transactions/TransactionsPage'
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage'
import { BudgetsPage } from '../pages/Budgets/BudgetsPage'
import { SettingsPage } from '../pages/Settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'budgets', element: <BudgetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
