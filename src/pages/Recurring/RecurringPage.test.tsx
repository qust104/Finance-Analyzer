// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof setupServer>

beforeEach(async () => {
  localStorage.clear()
  vi.resetModules()
  const { handlers } = await import('../../mocks/handlers')
  server = setupServer(...handlers)
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.close()
})

async function renderPage() {
  const { RecurringPage } = await import('./RecurringPage')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/recurring']}>
        <RecurringPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findAllByRole('button', { name: 'Add template' })
}

describe('recurring page', () => {
  it('creates a template and shows it in the list', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Add template' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Add template' })
    await user.type(within(dialog).getByLabelText('Description'), 'Netflix')
    await user.type(within(dialog).getByLabelText('Amount'), '799')
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'entertainment')
    await user.selectOptions(within(dialog).getByLabelText('Interval'), 'monthly')
    await user.type(within(dialog).getByLabelText('Start date'), '2026-08-01')
    await user.click(within(dialog).getByRole('button', { name: 'Add template' }))

    expect(await screen.findByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText(/799/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('edits an existing template', async () => {
    const user = userEvent.setup()
    const api = await import('../../api/recurring')
    await api.createRecurring({
      description: 'Netflix',
      amount: 799,
      type: 'expense',
      category: 'entertainment',
      interval: 'monthly',
      startDate: '2026-08-01',
      endDate: null,
      active: true,
    })
    await renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Edit template' })
    const amount = within(dialog).getByLabelText('Amount')
    await user.clear(amount)
    await user.type(amount, '899')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText(/899/)).toBeInTheDocument()
    await expectNoDialog()
  })

  it('deletes a template', async () => {
    const user = userEvent.setup()
    const api = await import('../../api/recurring')
    await api.createRecurring({
      description: 'Netflix',
      amount: 799,
      type: 'expense',
      category: 'entertainment',
      interval: 'monthly',
      startDate: '2026-08-01',
      endDate: null,
      active: true,
    })
    await renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await waitFor(() => expect(screen.queryByText('Netflix')).not.toBeInTheDocument())
  })

  it('shows the pause badge for inactive templates', async () => {
    const api = await import('../../api/recurring')
    await api.createRecurring({
      description: 'Netflix',
      amount: 799,
      type: 'expense',
      category: 'entertainment',
      interval: 'monthly',
      startDate: '2026-08-01',
      endDate: null,
      active: false,
    })
    await renderPage()

    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText('paused')).toBeInTheDocument()
  })
})

async function expectNoDialog() {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}