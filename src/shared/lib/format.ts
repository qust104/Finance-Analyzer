import type { TransactionType } from '../../entities/transaction/model/types'

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

export function formatMonthKey(month: string): string {
  const [year, monthIndex] = month.split('-')
  const date = new Date(Number(year), Number(monthIndex) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

// Amounts are stored positive; the sign is only a display concern.
export function formatAmount(amount: number, type: TransactionType): string {
  return type === 'income'
    ? `+${currencyFormatter.format(amount)}`
    : `\u2212${currencyFormatter.format(amount)}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatMonthShort(month: string): string {
  return formatMonthKey(month).split(' ')[0]
}
