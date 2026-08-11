// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

function renderWithTrigger() {
  const onClose = vi.fn()
  render(
    <>
      <button type="button">Open</button>
      <Modal title="Test modal" onClose={onClose}>
        <input placeholder="First field" />
        <input placeholder="Last field" />
        <button type="button">Done</button>
      </Modal>
    </>,
  )
  return { onClose }
}

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <Modal title="Test modal" onClose={() => setOpen(false)}>
          <input placeholder="First field" />
        </Modal>
      ) : null}
    </>
  )
}

describe('Modal accessibility', () => {
  it('moves focus to the first form element when opened', () => {
    renderWithTrigger()
    expect(screen.getByPlaceholderText('First field')).toHaveFocus()
  })

  it('returns focus to the trigger when closed with Escape', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('cycles focus forward with Tab, keeping it inside the dialog', async () => {
    const user = userEvent.setup()
    renderWithTrigger()
    expect(screen.getByPlaceholderText('First field')).toHaveFocus()
    await user.tab()
    expect(screen.getByPlaceholderText('Last field')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    await user.tab()
    expect(screen.getByPlaceholderText('First field')).toHaveFocus()
  })

  it('cycles focus backward with Shift+Tab', async () => {
    const user = userEvent.setup()
    renderWithTrigger()
    expect(screen.getByPlaceholderText('First field')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByPlaceholderText('Last field')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByPlaceholderText('First field')).toHaveFocus()
  })

  it('uses the title as the accessible name of the dialog', () => {
    renderWithTrigger()
    expect(screen.getByRole('dialog', { name: 'Test modal' })).toBeInTheDocument()
  })
})