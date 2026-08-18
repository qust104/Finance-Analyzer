// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toast } from './Toast'

afterEach(cleanup)

describe('Toast', () => {
  it('announces a status message by default', () => {
    render(<Toast message="Transaction deleted" onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('Transaction deleted')
  })

  it('announces errors as alerts', () => {
    render(<Toast variant="error" message="Something broke" onClose={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something broke')
  })

  it('renders the Undo button only when an undo action exists', () => {
    render(<Toast message="Deleted" />)
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    render(<Toast message="Deleted" onUndo={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('auto-dismisses after the given timeout', () => {
    vi.useFakeTimers()
    try {
      const onClose = vi.fn()
      render(<Toast message="Done" onClose={onClose} autoDismissMs={4000} />)
      expect(onClose).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(4000))
      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('dismisses manually through the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Toast message="Done" onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})