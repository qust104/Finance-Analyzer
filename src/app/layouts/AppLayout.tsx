import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LoadingState } from '../../shared/ui/AsyncStates'
import './AppLayout.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/categories', label: 'Categories' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
] as const

export function AppLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">Finance Analyzer</div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="layout__main">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
