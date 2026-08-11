import { Component } from 'react'
import type { ReactNode } from 'react'
import { reportError } from '../lib/monitoring'
import './AsyncStates.css'
import './form.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// Catches render-time errors that the query-based ErrorStates cannot:
// a crashing subtree replaces itself with the fallback instead of
// unmounting the whole app, and the error still reaches the reporters.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    reportError(error, 'error boundary')
  }

  render() {
    if (this.state.error === null) {
      return this.props.children
    }
    return (
      <div className="error-state">
        <p className="error-state__title">Something went wrong</p>
        <p className="error-state__hint">An unexpected error occurred. Please reload the page.</p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    )
  }
}