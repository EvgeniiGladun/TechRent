import { describe, expect, it } from 'vitest'
import type { Rental, Payment } from '@/api/schemas'
import {
  RENTALS_TAB,
  buildRentalsView,
  countByTab,
  getOverdueIds,
  getRentalsSummary,
  toRentalRows,
} from './rentals'

const today = new Date('2026-05-20T15:00:00')

const rental = (patch: Partial<Rental> & Pick<Rental, 'id'>): Rental => ({
  equipment_id: `eq-${patch.id}`,
  title: `Техника ${patch.id}`,
  owner: 'ООО «Тест»',
  status: 'active',
  amount: 100_000,
  rate: 20,
  total_rent: 10_000,
  started_at: '2026-01-10',
  ends_at: '2026-12-10',
  ...patch,
})

const payment = (rentalId: string, date: string, paid: boolean, amount = 5_000): Payment => ({
  id: `${rentalId}-${date}`,
  rental_id: rentalId,
  date,
  amount,
  paid_at: paid ? date : null,
})

const rentals = [
  rental({ id: 'a', title: 'Экскаватор', amount: 50_000, ends_at: '2026-09-01' }),
  rental({ id: 'b', title: 'Автокран', amount: 200_000, rate: 17.5, ends_at: '2026-07-01' }),
  rental({ id: 'c', title: 'Погрузчик', status: 'closed', ends_at: '2026-03-01' }),
  rental({ id: 'd', title: 'Бетономешалка', amount: 30_000, rate: 25, ends_at: '2027-01-01' }),
]

const payments = [
  payment('a', '2026-04-10', true),
  payment('a', '2026-05-10', true),
  payment('a', '2026-06-10', false),
  // Платёж «сегодня» уже считается просроченным, если не оплачен
  payment('b', '2026-05-20', false, 20_000),
  payment('d', '2026-03-01', false, 3_000),
  payment('d', '2026-06-01', false, 3_000),
  payment('c', '2026-03-01', true),
]

const rows = toRentalRows(rentals, payments, today)

const titles = (
  tab: (typeof RENTALS_TAB)[keyof typeof RENTALS_TAB],
  search = '',
  sort = null as Parameters<typeof buildRentalsView>[0]['sort']
) => buildRentalsView({ rows, tab, search, sort }).map(row => row.title)

describe('getOverdueIds', () => {
  it('неоплаченный платёж с датой до сегодня включительно — просрочка', () => {
    expect([...getOverdueIds(payments, today)].sort()).toEqual(['b', 'd'])
  })
})

describe('buildRentalsView', () => {
  it('во вкладке «Активные» аренды с просрочкой наверху, внутри групп — по сортировке', () => {
    expect(titles(RENTALS_TAB.ACTIVE, '', { key: 'amount', order: 'asc' })).toEqual([
      'Бетономешалка',
      'Автокран',
      'Экскаватор',
    ])
  })

  it('«Просрочка» не показывает выкупленную технику', () => {
    expect(titles(RENTALS_TAB.OVERDUE)).toEqual(['Автокран', 'Бетономешалка'])
  })

  it('«Выкупленные» и «Все»', () => {
    expect(titles(RENTALS_TAB.CLOSED)).toEqual(['Погрузчик'])
    expect(titles(RENTALS_TAB.ALL)).toHaveLength(4)
  })

  it('поиск по тексту, который видит пользователь: статус, ставка, дата', () => {
    expect(titles(RENTALS_TAB.ALL, 'выкуплена')).toEqual(['Погрузчик'])
    expect(titles(RENTALS_TAB.ALL, '25%')).toEqual(['Бетономешалка'])
    // Ставка на экране «17,5 %» — находится и с запятой, и с точкой
    expect(titles(RENTALS_TAB.ALL, '17,5 %')).toEqual(['Автокран'])
    expect(titles(RENTALS_TAB.ALL, '17.5')).toEqual(['Автокран'])
    expect(titles(RENTALS_TAB.ALL, '01.07.2026')).toEqual(['Автокран'])
    expect(titles(RENTALS_TAB.ACTIVE, 'просрочка')).toEqual(['Автокран', 'Бетономешалка'])
  })
})

describe('countByTab', () => {
  it('считает количество для бейджей на вкладках', () => {
    expect(countByTab(rows)).toEqual({ active: 3, overdue: 2, closed: 1, all: 4 })
  })
})

describe('getRentalsSummary', () => {
  it('стоимость техники в аренде, просрочка и ближайший будущий платёж', () => {
    const summary = getRentalsSummary(rows, payments, today)
    expect(summary).toMatchObject({
      rentedValue: 280_000,
      totalRent: 30_000,
      overdueAmount: 23_000,
    })
    expect(summary.nextPayment?.date).toBe('2026-06-01')
  })

  it('ближайший платёж по аренде — первый неоплаченный платёж', () => {
    expect(rows.find(row => row.id === 'a')?.nextPayment?.date).toBe('2026-06-10')
  })
})
