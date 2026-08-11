import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import './Modal.css'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => !element.hasAttribute('disabled'))
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    lastFocused.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = dialog ? getFocusableElements(dialog) : []
    const initial = focusable.find((element) => !element.classList.contains('modal__close')) ?? null
    if (initial) {
      initial.focus()
    } else {
      dialog?.focus()
    }
    return () => {
      lastFocused.current?.focus()
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleTab = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') {
      return
    }
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    const focusable = getFocusableElements(dialog)
    const active = document.activeElement
    if (focusable.length === 0) {
      if (active !== dialog) {
        event.preventDefault()
        dialog.focus()
      }
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!dialog.contains(active)) {
      event.preventDefault()
      first.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleTab}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}