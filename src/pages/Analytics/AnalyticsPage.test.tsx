// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
  const { AnalyticsPage } = await import('./AnalyticsPage')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AnalyticsPage />
    </QueryClientProvider>,
  )
  return waitFor(() => expect(screen.getByText('Monthly Trend')).toBeInTheDocument())
}

describe('analytics page', () => {
  it('renders trend, breakdown and comparison from seeded data', async () => {
    await renderPage()

    expect(screen.getByText('Spending by Category')).toBeInTheDocument()
    expect(screen.getByText('Month Comparison')).toBeInTheDocument()
  })

  it('exposes monthly income in the screen-reader summary', async () => {
    await renderPage()

    await waitFor(() => {
      const srOnly = document.querySelector('.sr-only')
      expect(srOnly?.textContent).toContain('income 150')
    })
    expect(screen.getByText('Monthly Trend')).toBeInTheDocument()
  })

  it('breaks spending down by category over the window', async () => {
    await renderPage()

    const srBreakdown = screen.getByText((content) => content.includes('Food:'))
    expect(srBreakdown).toBeInTheDocument()
  })

  it('shows total income across all data in the summary cards', async () => {
    await renderPage()

    expect(screen.getByText('1 500 000 \u20bd')).toBeInTheDocument()
  })

  it('shows an empty state when there are no transactions', async () => {
    server.close()
    localStorage.setItem('finance-analyzer.transactions.v2', '[]')
    vi.resetModules()
    const { handlers } = await import('../../mocks/handlers')
    server = setupServer(...handlers)
    server.listen({ onUnhandledRequest: 'error' })

    const { AnalyticsPage } = await import('./AnalyticsPage')
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsPage />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText(/Add transactions to see trends/),
    ).toBeInTheDocument()
    expect(screen.queryByText('Monthly Trend')).not.toBeInTheDocument()
  })
})