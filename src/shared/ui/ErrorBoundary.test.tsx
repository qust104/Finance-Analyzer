// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerErrorReporter } from '../lib/monitoring'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom')
  }
  return <p>All good</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children while there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('replaces the crashed subtree with the fallback', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    expect(screen.queryByText('All good')).not.toBeInTheDocument()
  })

  it('reports the caught error to registered reporters', () => {
    const unregister = registerErrorReporter(vi.fn())
    const reporter = vi.fn()
    registerErrorReporter(reporter)

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )

    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom', context: 'error boundary' }),
    )
    unregister()
  })

  it('recovers when the boundary is remounted with a new key', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    rerender(
      <ErrorBoundary key="fresh">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})