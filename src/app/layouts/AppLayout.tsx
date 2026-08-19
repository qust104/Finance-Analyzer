import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  LayoutDashboard,
  List,
  PiggyBank,
  Repeat,
  Settings,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { CommandPalette } from '../../shared/command-palette/CommandPalette'
import { useCommandPaletteStore } from '../../shared/command-palette/useCommandPalette'
import { useProfile } from '../../shared/hooks/useProfile'
import { LoadingState } from '../../shared/ui/AsyncStates'
import { ProfileBadge } from '../../shared/ui/ProfileBadge'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'
import { Toast } from '../../shared/ui/Toast'
import { TransactionFormModal } from '../../entities/transaction/ui/TransactionFormModal'
import { useRecurringMaintenance } from './useRecurringMaintenance'
import { AppHeader } from './AppHeader'
import './AppLayout.css'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const NAV_GROUPS: { label: string; items: readonly NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Money',
    items: [
      { to: '/transactions', label: 'Transactions', icon: List },
      { to: '/budgets', label: 'Budgets', icon: PiggyBank },
      { to: '/categories', label: 'Categories', icon: Tag },
      { to: '/recurring', label: 'Recurring', icon: Repeat },
    ],
  },
  {
    label: 'Analytics',
    items: [{ to: '/analytics', label: 'Analytics', icon: BarChart3 }],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
]

export function AppLayout() {
  const { result, error, dismiss } = useRecurringMaintenance()
  const { profile } = useProfile()
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">Finance Analyzer</div>
        <nav className="sidebar__nav" aria-label="Main">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="sidebar__group">
              <span className="sidebar__group-label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                    }
                  >
                    <Icon className="sidebar__link-icon" size={18} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
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
        <div className="sidebar__footer">
          <ThemeToggle />
          <NavLink to="/settings" className="sidebar__profile" aria-label="Profile">
            <ProfileBadge compact displayName={profile.displayName} avatarInitials={profile.avatarInitials} />
          </NavLink>
        </div>
      </aside>
      <main className="layout__main">
        <AppHeader />
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
      <CommandPalette />
      <TransactionFormModal />
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