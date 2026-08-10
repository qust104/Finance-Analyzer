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

// Amounts are stored positive; the sign is only a display concern.
export function formatAmount(amount: number, type: TransactionType): string {
  return type === 'income' ? `+${currencyFormatter.format(amount)}` : `\u2212${currencyFormatter.format(amount)}`
}