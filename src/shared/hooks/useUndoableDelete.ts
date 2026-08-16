import { useCallback, useEffect, useRef, useState } from 'react'

export interface PendingUndo<T> {
  message: string
  item: T
}

interface UseUndoableDeleteOptions<T> {
  remove: (id: string) => void
  restore: (item: T) => void | Promise<void>
  find: (id: string) => T | undefined
  message: string
}

// Delete happens immediately; the removed row is kept aside for a short
// window and restored on demand. The callbacks passed in are read from a
// ref so the returned functions stay referentially stable — rows memoize
// on them, just like on the mutation wrappers in useTransactions.
export function useUndoableDelete<T>(
  options: UseUndoableDeleteOptions<T>,
  durationMs = 5000,
): {
  requestDelete: (id: string) => void
  restorePending: (item: T) => void
  clearUndo: () => void
  pendingUndo: PendingUndo<T> | null
} {
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })
  const timerRef = useRef<number | null>(null)
  const [pendingUndo, setPendingUndo] = useState<PendingUndo<T> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearUndo = useCallback(() => {
    clearTimer()
    setPendingUndo(null)
  }, [clearTimer])

  const scheduleClear = useCallback(() => {
    clearTimer()
    timerRef.current = window.setTimeout(clearUndo, durationMs)
  }, [clearTimer, clearUndo, durationMs])

  // Explicitly not in the dependency list: `options` is recreated every
  // render, and the latest value is read through optionsRef anyway.
  const requestDelete = useCallback((id: string) => {
    const item = optionsRef.current.find(id)
    if (!item) return
    optionsRef.current.remove(id)
    setPendingUndo({ message: optionsRef.current.message, item })
    scheduleClear()
  }, [scheduleClear])

  const restorePending = useCallback((item: T) => {
    void optionsRef.current.restore(item)
    setPendingUndo(null)
    clearTimer()
  }, [clearTimer])

  useEffect(() => clearUndo, [clearUndo])

  return { requestDelete, restorePending, clearUndo, pendingUndo }
}