import { useEffect } from 'react'
import type { ReactNode } from 'react'
import './Toast.css'

interface ToastProps {
  message?: string
  children?: ReactNode
  variant?: 'default' | 'error'
  onUndo?: () => void
  onClose?: () => void
  autoDismissMs?: number
}

// Non-blocking feedback for background or undoable actions: with
// `autoDismissMs` the toast closes itself, with `onUndo` it offers
// a same-click restore. Error variant is announced as an alert.
export function Toast({
  message,
  children,
  variant = 'default',
  onUndo,
  onClose,
  autoDismissMs,
}: ToastProps) {
  useEffect(() => {
    if (autoDismissMs === undefined || onClose === undefined) {
      return
    }
    const timer = window.setTimeout(onClose, autoDismissMs)
    return () => window.clearTimeout(timer)
  }, [autoDismissMs, onClose])

  return (
    <div
      className={`toast${variant === 'error' ? ' toast--error' : ''}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className="toast__message">{message ?? children}</span>
      {onUndo && (
        <button type="button" className="toast__undo" onClick={onUndo}>
          Undo
        </button>
      )}
      {onClose && (
        <button
          type="button"
          className="toast__close"
          aria-label="Dismiss"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  )
}