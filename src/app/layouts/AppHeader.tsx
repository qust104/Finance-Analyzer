import { Link, useMatches } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProfile } from '../../shared/hooks/useProfile'
import { ProfileBadge } from '../../shared/ui/ProfileBadge'
import { useUiStore } from '../../shared/store/uiStore'
import { NotificationBell } from './NotificationBell'
import { PeriodSelector } from './PeriodSelector'
import './AppHeader.css'

// Each route carries a handle: { title, subtitle }. The deepest match
// names the page the header renders for, so pages don't repeat their
// own h1; the subtitle sits under it as a one-line description.
function usePageMeta(): { title: string; subtitle?: string } {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const handle = (last?.handle as { title?: string; subtitle?: string } | undefined) ?? {}
  return { title: handle.title ?? 'Finance Analyzer', subtitle: handle.subtitle }
}

export function AppHeader() {
  const { title, subtitle } = usePageMeta()
  const { profile } = useProfile()
  const openTransactionForm = useUiStore((state) => state.openTransactionForm)

  return (
    <header className="app-header">
      <div className="app-header__heading">
        <h1 className="app-header__title">{title}</h1>
        {subtitle && <p className="app-header__subtitle">{subtitle}</p>}
      </div>
      <div className="app-header__actions">
        <PeriodSelector />
        <NotificationBell />
        <Link to="/settings" className="app-header__profile" aria-label="Profile">
          <ProfileBadge
            hideName
            displayName={profile.displayName}
            avatarInitials={profile.avatarInitials}
          />
        </Link>
        <button
          type="button"
          className="button button--primary app-header__add"
          onClick={() => openTransactionForm('new')}
        >
          <Plus size={16} aria-hidden="true" />
          Add transaction
        </button>
      </div>
    </header>
  )
}