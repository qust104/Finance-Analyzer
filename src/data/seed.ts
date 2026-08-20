import type { Transaction } from '../entities/transaction/model/types'

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function random01(seed: string): number {
  let t = hashString(seed) + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t = t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function between(seed: string, min: number, max: number): number {
  return Math.round(min + random01(seed) * (max - min))
}

const CHECKING = 'Checking Account'
const CASH = 'Cash'
const CREDIT = 'Credit Card'

interface DemoSpec {
  description: string
  category: string
  type: 'income' | 'expense'
  range: [number, number]
  days: number[]
  account: string
}

const DEMO_MONTHS = [
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
]

const SEASONAL_FACTOR: Record<string, number> = {
  '2025-12': 1.6,
  '2026-01': 0.8,
  '2026-06': 1.25,
}

const MONTHLY_SPECS: DemoSpec[] = [
  { description: 'Salary', category: 'salary', type: 'income', range: [150000, 150000], days: [1], account: CHECKING },
  { description: 'Rent', category: 'housing', type: 'expense', range: [8990, 8990], days: [2], account: CHECKING },
  { description: 'Utilities', category: 'housing', type: 'expense', range: [3800, 5600], days: [7], account: CHECKING },
  { description: 'Subscriptions', category: 'other', type: 'expense', range: [300, 900], days: [5], account: CREDIT },
  { description: 'Pyaterochka', category: 'food', type: 'expense', range: [1400, 2800], days: [3, 16], account: CASH },
  { description: 'Magnit', category: 'food', type: 'expense', range: [1800, 3000], days: [8], account: CASH },
  { description: 'Delivery', category: 'food', type: 'expense', range: [1700, 3300], days: [17], account: CASH },
  { description: 'Coffee shop', category: 'food', type: 'expense', range: [350, 800], days: [15], account: CASH },
  { description: 'Metro card', category: 'transport', type: 'expense', range: [420, 580], days: [13], account: CASH },
  { description: 'Yandex Taxi', category: 'transport', type: 'expense', range: [550, 1350], days: [11], account: CASH },
  { description: 'Wildberries', category: 'shopping', type: 'expense', range: [2400, 7000], days: [9], account: CREDIT },
  { description: 'Ozon', category: 'shopping', type: 'expense', range: [2000, 6400], days: [18], account: CREDIT },
  { description: 'Clothes', category: 'shopping', type: 'expense', range: [2500, 8000], days: [24], account: CREDIT },
  { description: 'Steam', category: 'entertainment', type: 'expense', range: [700, 3200], days: [6], account: CREDIT },
  { description: 'Cinema', category: 'entertainment', type: 'expense', range: [900, 2000], days: [19], account: CASH },
  { description: 'Pharmacy', category: 'health', type: 'expense', range: [900, 3200], days: [10], account: CASH },
]

const SEASONAL_EVENTS: Record<string, Transaction[]> = {
  '2025-12': [
    { id: 's-202512-bonus', date: '2025-12-24', amount: 150000, type: 'income', category: 'salary', description: 'Year-end bonus', account: CHECKING },
    { id: 's-202512-ny', date: '2025-12-29', amount: 9000, type: 'expense', category: 'entertainment', description: 'New Year dinner', account: CREDIT },
  ],
  '2026-04': [
    { id: 's-202604-insurance', date: '2026-04-09', amount: 24000, type: 'expense', category: 'housing', description: 'Car insurance', account: CHECKING },
  ],
  '2026-06': [
    { id: 's-202606-flights', date: '2026-06-11', amount: 32000, type: 'expense', category: 'transport', description: 'Flights to Mallorca', account: CREDIT },
    { id: 's-202606-stay', date: '2026-06-18', amount: 46000, type: 'expense', category: 'housing', description: 'Vacation stay', account: CREDIT },
  ],
}

const PENTAL_MONTHS = new Set(['2026-04'])

function buildDemoMonth(month: string, index: number): Transaction[] {
  const factor = SEASONAL_FACTOR[month] ?? 1
  const rows: Transaction[] = []

  for (const spec of MONTHLY_SPECS) {
    if (spec.category === 'health' && index % 2 !== 0) {
      continue
    }
    for (const day of spec.days) {
      const seed = `${month}-${spec.description}-${day}`
      const scaled =
        spec.type === 'expense' &&
        (spec.category === 'food' ||
          spec.category === 'shopping' ||
          spec.category === 'entertainment')
          ? between(seed, ...spec.range) * factor
          : between(seed, ...spec.range)
      rows.push({
        id: `s-${month.replace('-', '')}-${rows.length + 1}`,
        date: `${month}-${String(day).padStart(2, '0')}`,
        amount: Math.round(scaled),
        type: spec.type,
        category: spec.category,
        description: spec.description,
        account: spec.account,
      })
    }
  }

  if (PENTAL_MONTHS.has(month)) {
    const seed = `${month}-Dentist`
    rows.push({
      id: `s-${month.replace('-', '')}-${rows.length + 1}`,
      date: `${month}-22`,
      amount: between(seed, 3000, 5200),
      type: 'expense',
      category: 'health',
      description: 'Dentist',
      account: CHECKING,
    })
  }

  return [...rows, ...(SEASONAL_EVENTS[month] ?? [])]
}

const demoHistory: Transaction[] = DEMO_MONTHS.flatMap(buildDemoMonth)

const CURRENT_MONTHS: Transaction[] = [
  {
    id: '1',
    date: '2026-07-01',
    amount: 150000,
    type: 'income',
    category: 'salary',
    description: 'Salary',
    account: CHECKING,
  },
  {
    id: '2',
    date: '2026-07-03',
    amount: 2340,
    type: 'expense',
    category: 'food',
    description: 'Pyaterochka',
    account: CASH,
  },
  {
    id: '3',
    date: '2026-07-05',
    amount: 650,
    type: 'expense',
    category: 'transport',
    description: 'Yandex Taxi',
    account: CASH,
  },
  {
    id: '4',
    date: '2026-07-06',
    amount: 8990,
    type: 'expense',
    category: 'housing',
    description: 'Rent',
    account: CHECKING,
  },
  {
    id: '5',
    date: '2026-07-08',
    amount: 4200,
    type: 'expense',
    category: 'shopping',
    description: 'Wildberries',
    account: CREDIT,
  },
  {
    id: '6',
    date: '2026-07-10',
    amount: 1800,
    type: 'expense',
    category: 'entertainment',
    description: 'Cinema',
    account: CASH,
  },
  {
    id: '7',
    date: '2026-07-12',
    amount: 3200,
    type: 'expense',
    category: 'health',
    description: 'Pharmacy',
    account: CASH,
  },
  {
    id: '8',
    date: '2026-07-15',
    amount: 1950,
    type: 'expense',
    category: 'food',
    description: 'Magnit',
    account: CASH,
  },
  {
    id: '9',
    date: '2026-07-18',
    amount: 540,
    type: 'expense',
    category: 'transport',
    description: 'Metro card',
    account: CASH,
  },
  {
    id: '10',
    date: '2026-07-20',
    amount: 6100,
    type: 'expense',
    category: 'shopping',
    description: 'Ozon',
    account: CREDIT,
  },
  {
    id: '11',
    date: '2026-07-22',
    amount: 2900,
    type: 'expense',
    category: 'entertainment',
    description: 'PlayStation Store',
    account: CREDIT,
  },
  {
    id: '12',
    date: '2026-07-25',
    amount: 1500,
    type: 'expense',
    category: 'food',
    description: 'Coffee shop',
    account: CASH,
  },
  {
    id: '13',
    date: '2026-07-27',
    amount: 780,
    type: 'expense',
    category: 'transport',
    description: 'Yandex Taxi',
    account: CASH,
  },
  {
    id: '14',
    date: '2026-07-29',
    amount: 350,
    type: 'expense',
    category: 'other',
    description: 'Mobile top-up',
    account: CHECKING,
  },
  {
    id: '15',
    date: '2026-08-01',
    amount: 150000,
    type: 'income',
    category: 'salary',
    description: 'Salary',
    account: CHECKING,
  },
  {
    id: '16',
    date: '2026-08-01',
    amount: 4500,
    type: 'expense',
    category: 'housing',
    description: 'Utilities',
    account: CHECKING,
  },
  {
    id: '17',
    date: '2026-08-02',
    amount: 1340,
    type: 'expense',
    category: 'food',
    description: 'Pyaterochka',
    account: CASH,
  },
  {
    id: '18',
    date: '2026-08-03',
    amount: 1900,
    type: 'expense',
    category: 'food',
    description: 'VkusVill',
    account: CASH,
  },
  {
    id: '19',
    date: '2026-08-03',
    amount: 420,
    type: 'expense',
    category: 'transport',
    description: 'Metro card',
    account: CASH,
  },
  {
    id: '20',
    date: '2026-08-04',
    amount: 3800,
    type: 'expense',
    category: 'shopping',
    description: 'Wildberries',
    account: CREDIT,
  },
  {
    id: '21',
    date: '2026-08-05',
    amount: 2590,
    type: 'expense',
    category: 'food',
    description: 'Magnit',
    account: CASH,
  },
  {
    id: '22',
    date: '2026-08-06',
    amount: 1200,
    type: 'expense',
    category: 'entertainment',
    description: 'Steam',
    account: CREDIT,
  },
  {
    id: '23',
    date: '2026-08-07',
    amount: 8900,
    type: 'expense',
    category: 'housing',
    description: 'Rent',
    account: CHECKING,
  },
  {
    id: '24',
    date: '2026-08-08',
    amount: 640,
    type: 'expense',
    category: 'transport',
    description: 'Yandex Taxi',
    account: CASH,
  },
  {
    id: '25',
    date: '2026-08-09',
    amount: 2750,
    type: 'expense',
    category: 'food',
    description: 'Delivery',
    account: CASH,
  },
  {
    id: '26',
    date: '2026-08-10',
    amount: 2100,
    type: 'expense',
    category: 'entertainment',
    description: 'Kinopoisk + concerts',
    account: CREDIT,
  },
  {
    id: '27',
    date: '2026-08-11',
    amount: 4900,
    type: 'expense',
    category: 'shopping',
    description: 'Clothes',
    account: CREDIT,
  },
  {
    id: '28',
    date: '2026-08-12',
    amount: 1500,
    type: 'expense',
    category: 'health',
    description: 'Dentist',
    account: CHECKING,
  },
  {
    id: '29',
    date: '2026-08-13',
    amount: 890,
    type: 'expense',
    category: 'food',
    description: 'Coffee shop',
    account: CASH,
  },
  {
    id: '30',
    date: '2026-08-14',
    amount: 300,
    type: 'expense',
    category: 'other',
    description: 'Subscriptions',
    account: CREDIT,
  },
]

export const seedTransactions: Transaction[] = [...demoHistory, ...CURRENT_MONTHS]

export function isLegacySeed(rows: readonly Transaction[]): boolean {
  return (
    rows.length === CURRENT_MONTHS.length &&
    rows.every((row, index) => {
      const legacy = CURRENT_MONTHS[index]
      return (
        row.id === legacy.id &&
        row.date === legacy.date &&
        row.amount === legacy.amount &&
        row.category === legacy.category &&
        row.description === legacy.description
      )
    })
  )
}