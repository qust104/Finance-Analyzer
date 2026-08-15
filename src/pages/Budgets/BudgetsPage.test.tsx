// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
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
  const { BudgetsPage } = await import('./BudgetsPage')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/budgets']}>
        <BudgetsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return screen.findByText(/No budgets yet/)
}

async function fillBudgetForm(user: UserEvent, category: string, amount: string) {
  await user.click(screen.getAllByRole('button', { name: 'Add budget' })[0])
  const dialog = screen.getByRole('dialog', { name: 'Add budget' })
  await user.selectOptions(within(dialog).getByLabelText('Category'), category)
  await user.type(within(dialog).getByLabelText('Monthly limit'), amount)
  await user.click(within(dialog).getByRole('button', { name: 'Add budget' }))
}

async function addBudget(user: UserEvent, category: string, amount: string) {
  await fillBudgetForm(user, category, amount)
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('budgets page', () => {
  it('adds a budget', async () => {
    const user = userEvent.setup()
    await renderPage()

    await addBudget(user, 'food', '5000')

    expect(await screen.findByText('Food')).toBeInTheDocument()
    expect(screen.queryByText(/No budgets yet/)).not.toBeInTheDocument()
  })

  it('tracks the edited budget amount', async () => {
    const user = userEvent.setup()
    await renderPage()

    await addBudget(user, 'transport', '3000')
    expect(await screen.findByText('Transport')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit budget' })
    const limit = within(dialog).getByLabelText('Monthly limit')
    await user.clear(limit)
    await user.type(limit, '6000')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(await screen.findByText(/6 000 ₽/)).toBeInTheDocument()
  })

  it('hides categories that already have a budget', async () => {
    const user = userEvent.setup()
    await renderPage()

    await addBudget(user, 'food', '5000')
    await screen.findByText('Food')

    await user.click(screen.getAllByRole('button', { name: 'Add budget' })[0])
    const options = within(screen.getByRole('dialog'))
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(options).not.toContain('Food')
  })

  it('keeps the form open and shows the server error on a 409 conflict', async () => {
    server.use(
      http.post('*/api/budgets', () =>
        HttpResponse.json({ error: 'Category already has a budget' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    await renderPage()

    await fillBudgetForm(user, 'food', '5000')

    expect(await screen.findByText('Category already has a budget')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the form only after the mutation resolves', async () => {
    server.use(
      http.post('*/api/budgets', async () => {
        await delay(400)
        return HttpResponse.json(
          { id: 'x', category: 'food', amount: 5000, period: 'monthly' },
          { status: 201 },
        )
      }),
    )
    const user = userEvent.setup()
    await renderPage()

    await fillBudgetForm(user, 'food', '5000')

    // The response is still in flight: the form must stay open and
    // disable its submit button instead of closing synchronously.
    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
