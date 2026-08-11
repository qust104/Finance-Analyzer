import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEFAULT_FILTERS,
  parseFilters,
  serializeFilters,
} from '../../entities/transaction/model/filters'
import type { TransactionFilters } from '../../entities/transaction/model/filters'

// Filters live in the URL: the page state, shareable links, and browser
// back/forward all come from one place (see filters.ts for parsing rules).
export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)

  const updateFilters = useCallback(
    (patch: Partial<TransactionFilters>) => {
      setSearchParams(serializeFilters({ ...filters, ...patch }), { replace: true })
    },
    [filters, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(serializeFilters(DEFAULT_FILTERS), { replace: true })
  }, [setSearchParams])

  return { filters, updateFilters, resetFilters }
}
