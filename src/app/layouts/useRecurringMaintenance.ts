import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { applyRecurring } from '../../api/recurring'

export interface RecurringMaintenance {
  result: { created: number } | null
  error: string | null
  dismiss: () => void
}

// One run per app start: the engine posts the due recurring rows and
// advances the templates. Safe to repeat — fingerprints keep it from
// creating duplicates, so a crashed run simply retries next open.
// The outcome is reported to the caller: the layout decides how to
// surface it, the hook only owns the state.
export function useRecurringMaintenance(): RecurringMaintenance {
  const queryClient = useQueryClient()
  const [result, setResult] = useState<{ created: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { created } = await applyRecurring()
        if (cancelled || created === 0) {
          return
        }
        void queryClient.invalidateQueries({ queryKey: ['transactions'] })
        setResult({ created })
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [queryClient])

  const dismiss = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, error, dismiss }
}