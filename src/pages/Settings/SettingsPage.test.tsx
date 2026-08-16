// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildExportPayload } from '../../features/export-data/exportData'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'

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
  vi.restoreAllMocks()
})

async function renderPage() {
  const { SettingsPage } = await import('./SettingsPage')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <SettingsPage />
    </QueryClientProvider>,
  )
  return waitFor(() => expect(screen.getByRole('button', { name: 'Export data' })).toBeEnabled())
}

const transactions: Transaction[] = [
  {
    id: 'restored-1',
    date: '2026-01-10',
    amount: 500,
    type: 'expense',
    category: 'food',
    description: 'Restored lunch',
  },
]

const budgets: Budget[] = [{ id: 'restored-b', category: 'health', amount: 2000, period: 'monthly' }]

async function uploadBackup(file: File) {
  const input = screen.getByLabelText(/Restore from file/) as HTMLInputElement
  const user = userEvent.setup()
  await user.upload(input, file)
}

describe('settings page', () => {
  it('renders export and restore controls', async () => {
    await renderPage()

    expect(screen.getByRole('button', { name: 'Export data' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Restore from file/)).toBeInTheDocument()
  })

  it('restores data from a valid backup after confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await renderPage()

    const payload = JSON.stringify(buildExportPayload(transactions, budgets))
    const file = new File([payload], 'backup.json', { type: 'application/json' })
    await uploadBackup(file)

    expect(await screen.findByText(/Backup restored/)).toBeInTheDocument()
    expect(confirm).toHaveBeenCalled()
  })

  it('shows an error for an invalid backup file', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await renderPage()

    const file = new File(['{ "version": 99, "transactions": [], "budgets": [] }'], 'bad.json', {
      type: 'application/json',
    })
    await uploadBackup(file)

    expect(await screen.findByRole('alert')).toHaveTextContent(/Unsupported backup version/)
  })

  it('does nothing when the user declines the confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await renderPage()

    const payload = JSON.stringify(buildExportPayload(transactions, budgets))
    const file = new File([payload], 'backup.json', { type: 'application/json' })
    await uploadBackup(file)

    await waitFor(() => expect(confirm).toHaveBeenCalled())
    expect(screen.queryByText(/Backup restored/)).not.toBeInTheDocument()
  })
})