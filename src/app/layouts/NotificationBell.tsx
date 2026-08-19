import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { generateInsights } from '../../analytics/insights'
import type { Insight } from '../../analytics/insights'
import { useBudgets } from '../../shared/hooks/useBudgets'
import { useReportMonth } from '../../shared/hooks/useReportMonth'
import { useTransactions } from '../../shared/hooks/useTransactions'
import './NotificationBell.css'

const SEEN_STORAGE_KEY = 'finance-analyzer.notifications-seen'

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeSeen(ids: string[]): void {
  localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids))
}

const INSIGHT_ICONS: Record<Insight['type'], string> = {
  warning: '\u0021',
  positive: '\u2713',
  info: 'i',
}

// Bell in the app header: the same derived insights as the dashboard
// card, but scoped to notifications — opened once, they count as read.
// Seen ids are local UI state, never uploaded anywhere.
export function NotificationBell() {
  const { transactions } = useTransactions()
  const { budgets } = useBudgets()
  const { month } = useReportMonth(transactions)
  const insights = generateInsights(transactions, budgets, month)

  const [open, setOpen] = useState(false)
  const [seenIds, setSeenIds] = useState<string[]>(() => readSeen())
  const rootRef = useRef<HTMLDivElement>(null)

  const unseen = insights.filter((insight) => !seenIds.includes(insight.id))

  const markAllRead = () => {
    setSeenIds(insights.map((insight) => insight.id))
    writeSeen(insights.map((insight) => insight.id))
  }

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell__button"
        aria-label={
          unseen.length === 0 ? 'Notifications' : `Notifications (${unseen.length} new)`
        }
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
          if (!open) {
            markAllRead()
          }
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {unseen.length > 0 && (
          <span className="notification-bell__badge" aria-hidden="true">
            {unseen.length}
          </span>
        )}
      </button>
      {open && (
        <div className="notification-bell__dropdown" role="menu" aria-label="Notifications">
          <div className="notification-bell__dropdown-header">
            <span>Notifications</span>
            <button type="button" className="notification-bell__mark-all" onClick={markAllRead}>
              Mark all read
            </button>
          </div>
          {insights.length === 0 ? (
            <p className="notification-bell__empty">No notifications yet.</p>
          ) : (
            <ul className="notification-bell__list">
              {insights.map((insight) => (
                <li key={insight.id} className={`notification notification--${insight.type}`}>
                  <span className={`notification__icon notification__icon--${insight.type}`} aria-hidden="true">
                    {INSIGHT_ICONS[insight.type]}
                  </span>
                  <div className="notification__body">
                    <p className="notification__title">{insight.title}</p>
                    <p className="notification__description">{insight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}