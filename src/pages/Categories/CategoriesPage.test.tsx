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
  const { CategoriesPage } = await import('./CategoriesPage')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/categories']}>
        <CategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('list')
}

describe('categories page', () => {
  it('lists built-in categories and creates a custom one', async () => {
    const user = userEvent.setup()
    await renderPage()

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(within(list).getByText('Food')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add category' }))
    const dialog = screen.getByRole('dialog', { name: 'Add category' })
    await user.type(within(dialog).getByLabelText('Name'), 'Hobbies')
    await user.type(within(dialog).getByLabelText('CSV aliases'), 'guitar, lego')
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }))

    expect(await screen.findByText('Hobbies')).toBeInTheDocument()
    expect(screen.getByText('aliases: guitar, lego')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('shows the server error when the category already exists', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add category' }))
    const dialog = screen.getByRole('dialog', { name: 'Add category' })
    await user.type(within(dialog).getByLabelText('Name'), 'Food')
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('refuses to edit a built-in category', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByRole('dialog', { name: 'Edit category' })).toBeInTheDocument()
  })

  it('deleting an unused category removes it from the list', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add category' }))
    const dialog = screen.getByRole('dialog', { name: 'Add category' })
    await user.type(within(dialog).getByLabelText('Name'), 'Hobbies')
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }))
    await screen.findByText('Hobbies')

    const hobbiesItem = screen.getByText('Hobbies').closest('li')
    if (hobbiesItem === null) throw new Error('category row missing')
    await user.click(within(hobbiesItem).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByText('Hobbies')).not.toBeInTheDocument())
  })

  it('keeps the category when deletion fails because it is in use', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add category' }))
    const dialog = screen.getByRole('dialog', { name: 'Add category' })
    await user.type(within(dialog).getByLabelText('Name'), 'Snacks')
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }))
    await screen.findByText('Snacks')

    // The mock backend keeps its state in module-scoped repositories,
    // so the usage check must go through the same API the page uses.
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-08-01',
        amount: 10,
        type: 'expense',
        category: 'snacks',
        description: 'Chips',
      }),
    })
    expect(response.ok).toBe(true)

    const snacksItem = screen.getByText('Snacks').closest('li')
    if (snacksItem === null) throw new Error('category row missing')
    await user.click(within(snacksItem).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/used by transactions/i)
    expect(screen.getByText('Snacks')).toBeInTheDocument()
  })
})