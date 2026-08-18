import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { CommandPalette } from '../../shared/command-palette/CommandPalette'
import { useCommandPaletteStore } from '../../shared/command-palette/useCommandPalette'
import { LoadingState } from '../../shared/ui/AsyncStates'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'
import { Toast } from '../../shared/ui/Toast'
import { useRecurringMaintenance } from './useRecurringMaintenance'
import './AppLayout.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/categories', label: 'Categories' },
  { to: '/recurring', label: 'Recurring' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
] as const

export function AppLayout() {
  const { result, error, dismiss } = useRecurringMaintenance()
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
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
        <button
          type="button"
          className="sidebar__search"
          onClick={openCommandPalette}
          aria-label="Search (Ctrl K)"
        >
          Search
        </button>
        <ThemeToggle />
      </aside>
      <main className="layout__main">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
      <CommandPalette />
      {result !== null && (
        <Toast onClose={dismiss} autoDismissMs={4000}>
          Added {result.created} recurring transaction{result.created > 1 ? 's' : ''}.{' '}
          <Link to="/transactions?sort=date&dir=desc">View</Link>
        </Toast>
      )}
      {error !== null && (
        <Toast
          variant="error"
          message={`Couldn't check recurring transactions: ${error}`}
          onClose={dismiss}
          autoDismissMs={6000}
        />
      )}
    </div>
  )
}
