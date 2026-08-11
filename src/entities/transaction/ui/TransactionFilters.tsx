import type { TransactionFilters } from '../model/filters'
import { formatMonthKey, hasActiveFilters } from '../model/filters'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '../model/types'
import './TransactionFilters.css'

interface TransactionFiltersProps {
  filters: TransactionFilters
  months: string[]
  onChange: (patch: Partial<TransactionFilters>) => void
  onReset: () => void
}

export function TransactionFilters({
  filters,
  months,
  onChange,
  onReset,
}: TransactionFiltersProps) {
  return (
    <div className="transaction-filters">
      <label className="transaction-filters__search">
        <span className="sr-only">Search transactions</span>
        <input
          type="search"
          className="form-field__control"
          placeholder="Search transactions..."
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </label>

      <div className="transaction-filters__row">
        <label className="transaction-filters__field">
          <span className="sr-only">Category</span>
          <select
            className="form-field__control"
            value={filters.category}
            onChange={(event) =>
              onChange({ category: event.target.value as TransactionFilters['category'] })
            }
          >
            <option value="all">All categories</option>
            {ALL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="transaction-filters__field">
          <span className="sr-only">Type</span>
          <select
            className="form-field__control"
            value={filters.type}
            onChange={(event) =>
              onChange({ type: event.target.value as TransactionFilters['type'] })
            }
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <label className="transaction-filters__field">
          <span className="sr-only">Month</span>
          <select
            className="form-field__control"
            value={filters.month}
            onChange={(event) => onChange({ month: event.target.value })}
          >
            <option value="all">All months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonthKey(month)}
              </option>
            ))}
          </select>
        </label>

        <label className="transaction-filters__field">
          <span className="sr-only">Sort by</span>
          <select
            className="form-field__control"
            value={filters.sortBy}
            onChange={(event) =>
              onChange({ sortBy: event.target.value as TransactionFilters['sortBy'] })
            }
          >
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
          </select>
        </label>

        <label className="transaction-filters__field">
          <span className="sr-only">Sort direction</span>
          <select
            className="form-field__control"
            value={filters.sortDir}
            onChange={(event) =>
              onChange({ sortDir: event.target.value as TransactionFilters['sortDir'] })
            }
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>

        {hasActiveFilters(filters) && (
          <button type="button" className="button button--secondary" onClick={onReset}>
            Reset filters
          </button>
        )}
      </div>
    </div>
  )
}
