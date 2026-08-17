import { Suspense, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { applyRecurring } from '../../api/recurring'
import { CommandPalette } from '../../shared/command-palette/CommandPalette'
import { useCommandPaletteStore } from '../../shared/command-palette/useCommandPalette'
import { LoadingState } from '../../shared/ui/AsyncStates'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'
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

// One run per app start: the engine posts the due recurring rows and
// advances the templates. Safe to repeat — fingerprints keep it from
// creating duplicates, so a crashed run simply retries next open.
function useRecurringMaintenance() {
  const queryClient = useQueryClient()
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { created } = await applyRecurring()
        if (created > 0 && !cancelled) {
          void queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }
      } catch {
        // Best-effort: a failed run is retried on the next app start.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [queryClient])
}

export function AppLayout() {
  useRecurringMaintenance()
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
    </div>
  )
}
