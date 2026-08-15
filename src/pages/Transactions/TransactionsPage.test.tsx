// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Every test gets a fresh module graph: the mock backend keeps state
// in module-scoped repositories, and resetModules rebuilds it from a
// clean localStorage, so tests never leak transactions into each other.
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

// Wait until the transaction table is rendered instead of the loader.
// Keep expectations on table rows: each transaction also renders
// a mobile card, so button counts would change by two per row.
async function renderPage() {
  const { TransactionsPage } = await import('./TransactionsPage')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/transactions']}>
        <TransactionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('table')
}

async function expectNoDialog() {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('transactions page', () => {
  it('adds a transaction through the form', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Add transaction' }))

    const dialog = screen.getByRole('dialog', { name: 'Add transaction' })
    await user.type(within(dialog).getByLabelText('Amount'), '1500')
    await user.type(within(dialog).getByLabelText('Description'), 'Team lunch')
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'food')
    await user.type(within(dialog).getByLabelText('Date'), '2026-08-05')
    await user.click(within(dialog).getByRole('button', { name: 'Add transaction' }))

    // The description shows in both the table and the mobile cards.
    expect(await screen.findAllByText('Team lunch')).not.toHaveLength(0)
    await expectNoDialog()
  })

  it('edits an existing transaction', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    const dialog = screen.getByRole('dialog', { name: 'Edit transaction' })
    const description = within(dialog).getByLabelText('Description')
    await user.clear(description)
    await user.type(description, 'Salary updated')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findAllByText('Salary updated')).not.toHaveLength(0)
    await expectNoDialog()
  })

  it('deletes a transaction', async () => {
    const user = userEvent.setup()
    await renderPage()

    const rowsBefore = screen.getAllByRole('row').length
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(rowsBefore - 1))
  })

  it('imports a CSV file and skips duplicates', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Import CSV' }))

    const file = new File(
      [
        [
          'date,description,amount,type,category',
          '2026-08-05,Imported lunch,900,expense,food',
          '2026-08-01,Salary,150000,income,salary',
        ].join('\n'),
      ],
      'transactions.csv',
      { type: 'text/csv' },
    )
    await user.upload(screen.getByLabelText('Choose CSV file'), file)

    // The count renders inside a <strong>, which splits the text nodes.
    expect(await screen.findByText(/ready to import/)).toBeInTheDocument()
    expect(screen.getByText(/skipped as duplicates/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Import 1 transaction' }))

    // The batch POST and cache refetch take longer than the default
    // waitFor budget in jsdom, so give this assertion more room.
    expect(
      await screen.findAllByText('Imported lunch', undefined, { timeout: 4000 }),
    ).not.toHaveLength(0)
    await expectNoDialog()
  })

  it('keeps the import modal open and shows the error when the batch fails', async () => {
    server.use(
      http.post('*/api/transactions', () =>
        HttpResponse.json({ error: 'Invalid transaction data' }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    await renderPage()

    await user.click(screen.getByRole('button', { name: 'Import CSV' }))

    const file = new File(
      ['date,description,amount,type,category\n2026-08-05,Imported lunch,900,expense,food'],
      'transactions.csv',
      { type: 'text/csv' },
    )
    await user.upload(screen.getByLabelText('Choose CSV file'), file)

    await user.click(await screen.findByRole('button', { name: 'Import 1 transaction' }))

    expect(await screen.findByText('1 of 1 rows failed to import')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
