// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../api/recurring', () => ({ applyRecurring: vi.fn() }))

const { applyRecurring } = await import('../../api/recurring')
const { useRecurringMaintenance } = await import('./useRecurringMaintenance')

const mockedApply = vi.mocked(applyRecurring)

function renderMaintenance() {
  const queryClient = new QueryClient()
  return renderHook(() => useRecurringMaintenance(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

describe('useRecurringMaintenance', () => {
  beforeEach(() => {
    mockedApply.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reports the created count when the engine posts transactions', async () => {
    mockedApply.mockResolvedValue({ created: 2 })
    const { result } = renderMaintenance()

    await waitFor(() => expect(result.current.result).toEqual({ created: 2 }))
    expect(result.current.error).toBeNull()
  })

  it('stays silent when nothing was created', async () => {
    mockedApply.mockResolvedValue({ created: 0 })
    const { result } = renderMaintenance()

    await waitFor(() => expect(mockedApply).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.result).toBeNull())
    expect(result.current.error).toBeNull()
  })

  it('surfaces the engine error without crashing', async () => {
    mockedApply.mockRejectedValue(new Error('apply exploded'))
    const { result } = renderMaintenance()

    await waitFor(() => expect(result.current.error).toBe('apply exploded'))
    expect(result.current.result).toBeNull()
  })

  it('dismiss clears both the result and the error', async () => {
    mockedApply.mockResolvedValue({ created: 1 })
    const { result } = renderMaintenance()

    await waitFor(() => expect(result.current.result).toEqual({ created: 1 }))
    act(() => result.current.dismiss())
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})