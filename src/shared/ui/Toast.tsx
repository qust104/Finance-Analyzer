import './Toast.css'

interface ToastProps {
  message: string
  onUndo: () => void
  onClose: () => void
}

export function Toast({ message, onUndo, onClose }: ToastProps) {
  return (
    <div className="toast" role="status">
      <span className="toast__message">{message}</span>
      <button type="button" className="toast__undo" onClick={onUndo}>
        Undo
      </button>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}