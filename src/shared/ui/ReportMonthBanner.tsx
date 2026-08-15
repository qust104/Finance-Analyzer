import { formatMonthKey } from '../lib/format'
import './ReportMonthBanner.css'

interface ReportMonthBannerProps {
  month: string
}

// Shown whenever the report falls back to a month without fresh data:
// the numbers on screen are about an earlier month, and the user has
// to be told that instead of silently seeing old figures as "now".
export function ReportMonthBanner({ month }: ReportMonthBannerProps) {
  return (
    <p className="report-month-banner">
      No transactions yet this month — showing {formatMonthKey(month)}
    </p>
  )
}
