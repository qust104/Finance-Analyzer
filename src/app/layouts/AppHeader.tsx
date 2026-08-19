import { Link, useMatches } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProfile } from '../../shared/hooks/useProfile'
import { ProfileBadge } from '../../shared/ui/ProfileBadge'
import { useUiStore } from '../../shared/store/uiStore'
import { NotificationBell } from './NotificationBell'
import { PeriodSelector } from './PeriodSelector'
import './AppHeader.css'

// Each route carries a handle: { title }; the deepest match names the
// page the header is rendering for, so pages don't repeat their own h1.
function usePageTitle(): string {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const title = (last?.handle as { title?: string } | undefined)?.title
  return title ?? 'Finance Analyzer'
}

export function AppHeader() {
  const title = usePageTitle()
  const { profile } = useProfile()
  const openTransactionForm = useUiStore((state) => state.openTransactionForm)

  return (
    <header className="app-header">
      <h1 className="app-header__title">{title}</h1>
      <div className="app-header__actions">
        <PeriodSelector />
        <NotificationBell />
        <button
          type="button"
          className="button button--primary app-header__add"
          onClick={() => openTransactionForm('new')}
        >
          <Plus size={16} aria-hidden="true" />
          Add transaction
        </button>
        <Link to="/settings" className="app-header__profile" aria-label="Profile">
          <ProfileBadge displayName={profile.displayName} avatarInitials={profile.avatarInitials} />
        </Link>
      </div>
    </header>
  )
}