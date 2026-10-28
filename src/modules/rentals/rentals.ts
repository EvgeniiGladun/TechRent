import type { Rental, Payment } from '@/api/schemas'
import { rentalStatus } from '@/utils/dictionaries'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { compareBy, normalizeSearch, type TableSort } from '@/modules/data-table/table-query'

export const RENTALS_TAB = {
  ACTIVE: 'active',
  OVERDUE: 'overdue',
  CLOSED: 'closed',
  ALL: 'all',
} as const

export type RentalsTab = (typeof RENTALS_TAB)[keyof typeof RENTALS_TAB]

export const RENTALS_TABS: ReadonlyArray<{ value: RentalsTab; label: string; empty: string }> = [
  { value: RENTALS_TAB.ACTIVE, label: 'Активные', empty: 'Активных аренд пока нет' },
  { value: RENTALS_TAB.OVERDUE, label: 'Просрочка', empty: 'Просроченных платежей нет' },
  { value: RENTALS_TAB.CLOSED, label: 'Выкупленные', empty: 'Выкупленной техники пока нет' },
  { value: RENTALS_TAB.ALL, label: 'Все', empty: 'Вы ещё ничего не арендовали' },
]

export interface RentalRow extends Rental {
  isOverdue: boolean
  nextPayment: Payment | null
}

export interface RentalsSummary {
  rentedValue: number
  totalRent: number
  overdueAmount: number
  nextPayment: Payment | null
}

const SORT_GETTERS: Record<string, (row: RentalRow) => string | number> = {
  title: row => row.title,
  amount: row => row.amount,
  rate: row => row.rate,
  total_rent: row => row.total_rent,
  ends_at: row => new Date(row.ends_at).getTime(),
}

export const startOfDay = (date: Date | string = new Date()): Date => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

const isPaid = (payment: Payment) => payment.paid_at !== null

/** Аренды, по которым есть неоплаченный платёж с датой не позже сегодняшней */
export const getOverdueIds = (payments: readonly Payment[], today: Date): Set<string> => {
  const day = startOfDay(today).getTime()
  return new Set(
    payments
      .filter(payment => !isPaid(payment) && startOfDay(payment.date).getTime() <= day)
      .map(payment => payment.rental_id)
  )
}

export const getNextPayments = (payments: readonly Payment[]): Map<string, Payment> => {
  const next = new Map<string, Payment>()
  for (const payment of payments) {
    if (isPaid(payment)) continue
    const current = next.get(payment.rental_id)
    if (!current || payment.date < current.date) next.set(payment.rental_id, payment)
  }
  return next
}

export const toRentalRows = (
  rentals: readonly Rental[],
  payments: readonly Payment[],
  today: Date
): RentalRow[] => {
  const overdue = getOverdueIds(payments, today)
  const next = getNextPayments(payments)
  return rentals.map(rental => ({
    ...rental,
    isOverdue: overdue.has(rental.id),
    nextPayment: next.get(rental.id) ?? null,
  }))
}

export const filterByTab = (rows: readonly RentalRow[], tab: RentalsTab): RentalRow[] => {
  const isClosed = (row: RentalRow) => rentalStatus.is(row.status, 'CLOSED')

  switch (tab) {
    case RENTALS_TAB.CLOSED:
      return rows.filter(isClosed)
    case RENTALS_TAB.OVERDUE:
      return rows.filter(row => !isClosed(row) && row.isOverdue)
    case RENTALS_TAB.ALL:
      return rows.slice()
    default:
      return rows.filter(row => !isClosed(row))
  }
}

/**
 * Ищем по тому, что пользователь видит на экране: «17,5 %», «1 458,33 ₽», «выкуплена»,
 * «15.03.2026». Сырые числа тоже оставляем, чтобы находилось и «17.5».
 */
export const matchesRentalSearch = (row: RentalRow, search: string): boolean => {
  const query = normalizeSearch(search)
  if (!query) return true

  return [
    row.title,
    row.owner,
    row.amount,
    formatCurrency(row.amount),
    row.rate,
    formatPercent(row.rate),
    formatCurrency(row.total_rent),
    rentalStatus.textOf(row.status),
    row.isOverdue ? 'просрочка' : '',
    formatDate(row.started_at),
    formatDate(row.ends_at),
  ].some(value => normalizeSearch(value).includes(query))
}

export const countByTab = (rows: readonly RentalRow[]): Record<RentalsTab, number> =>
  Object.fromEntries(
    RENTALS_TABS.map(tab => [tab.value, filterByTab(rows, tab.value).length])
  ) as Record<RentalsTab, number>

export interface RentalsViewInput {
  rows: readonly RentalRow[]
  tab: RentalsTab
  search: string
  sort: TableSort | null
}

export const buildRentalsView = ({ rows, tab, search, sort }: RentalsViewInput) => {
  const filtered = filterByTab(rows, tab).filter(row => matchesRentalSearch(row, search))
  const get = sort ? SORT_GETTERS[sort.key] : undefined
  const sorted = get && sort ? filtered.sort(compareBy(get, sort.order)) : filtered

  // Во вкладке «Активные» аренды с просрочкой всегда наверху, независимо от сортировки
  if (tab !== RENTALS_TAB.ACTIVE) return sorted
  return [...sorted.filter(row => row.isOverdue), ...sorted.filter(row => !row.isOverdue)]
}

export const getRentalsSummary = (
  rows: readonly RentalRow[],
  payments: readonly Payment[],
  today: Date
): RentalsSummary => {
  const active = filterByTab(rows, RENTALS_TAB.ACTIVE)
  const day = startOfDay(today).getTime()
  const unpaid = payments.filter(payment => !isPaid(payment))

  return {
    rentedValue: active.reduce((sum, row) => sum + row.amount, 0),
    totalRent: active.reduce((sum, row) => sum + row.total_rent, 0),
    overdueAmount: unpaid
      .filter(payment => startOfDay(payment.date).getTime() <= day)
      .reduce((sum, payment) => sum + payment.amount, 0),
    nextPayment:
      unpaid
        .filter(payment => startOfDay(payment.date).getTime() > day)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
  }
}
