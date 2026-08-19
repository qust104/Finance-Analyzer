import { Calendar, ChevronDown } from 'lucide-react'
import { getAvailableMonths } from '../../entities/transaction/model/filters'
import { formatMonthKey } from '../../shared/lib/format'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { useUiStore } from '../../shared/store/uiStore'

// The header-level month picker: "Auto" follows the latest month that
// has data (resolveReportMonth), an explicit pick pins every report.
// The choice lives in the ui store so the dashboard and widgets can
// read the same period.
export function PeriodSelector() {
  const { transactions, isPending } = useTransactions()
  const reportMonth = useUiStore((state) => state.reportMonth)
  const setReportMonth = useUiStore((state) => state.setReportMonth)

  const months = getAvailableMonths(transactions)
  const value = reportMonth ?? ''

  return (
    <span className="period-selector">
      <Calendar className="period-selector__calendar" size={16} aria-hidden="true" />
      <span className="sr-only">Report month</span>
      <select
        className="period-selector__select"
        value={value}
        disabled={isPending || months.length === 0}
        onChange={(event) => setReportMonth(event.target.value === '' ? null : event.target.value)}
      >
        <option value="">Auto — latest month</option>
        {months.map((month) => (
          <option key={month} value={month}>
            {formatMonthKey(month)}
          </option>
        ))}
      </select>
      <ChevronDown className="period-selector__chevron" size={14} aria-hidden="true" />
    </span>
  )
}