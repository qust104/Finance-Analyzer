import './AsyncStates.css'
import '../../shared/ui/form.css'

export function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-label="Loading">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="error-state">
      <p className="error-state__title">Something went wrong</p>
      <p className="error-state__hint">Unable to load the data. Please try again.</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
