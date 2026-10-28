import type { Equipment, MyRentals, Payment, Rental } from '../schemas'
import { buildSchedule } from '@/modules/rent/schedule'

interface RentalSeed {
  id?: string
  equipment: Pick<Equipment, 'id' | 'title' | 'owner' | 'rate' | 'term_months' | 'payment_type'>
  amount: number
  /** Сколько месяцев назад оформлена аренда */
  monthsAgo: number
  /** Сколько последних наступивших платежей арендатор не оплатил */
  unpaid?: number
}

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

/** Даты строятся от «сегодня», поэтому просрочка и ближайшие платежи есть при любом запуске */
export const buildRental = (seed: RentalSeed, today = new Date()) => {
  const { equipment, amount, monthsAgo, unpaid = 0 } = seed
  const startedAt = addMonths(today, -monthsAgo)
  const schedule = buildSchedule({
    amount,
    rate: equipment.rate,
    termMonths: equipment.term_months,
    type: equipment.payment_type,
  })

  const id = seed.id ?? `r-${equipment.id}-${monthsAgo}`
  const dueCount = Math.min(monthsAgo, schedule.rows.length)

  const payments: Payment[] = schedule.rows.map(row => {
    const date = addMonths(startedAt, row.month)
    const isDue = row.month <= dueCount
    const isSkipped = isDue && row.month > dueCount - unpaid
    return {
      id: `${id}-${row.month}`,
      rental_id: id,
      date: isoDate(date),
      amount: row.payment,
      paid_at: isDue && !isSkipped ? isoDate(date) : null,
    }
  })

  const rental: Rental = {
    id,
    equipment_id: equipment.id,
    title: equipment.title,
    owner: equipment.owner,
    status: payments.every(payment => payment.paid_at) ? 'closed' : 'active',
    amount,
    rate: equipment.rate,
    total_rent: schedule.totalRent,
    started_at: isoDate(startedAt),
    ends_at: isoDate(addMonths(startedAt, equipment.term_months)),
  }

  return { rental, payments }
}

const PAST_EQUIPMENT: RentalSeed['equipment'][] = [
  {
    id: 'eq-090',
    title: 'Виброплита Wacker Neuson',
    owner: 'ИП Орлова',
    rate: 20,
    term_months: 6,
    payment_type: 'annuity',
  },
  {
    id: 'eq-085',
    title: 'Генератор дизельный 30 кВт',
    owner: 'ООО «Энергопрокат»',
    rate: 22,
    term_months: 9,
    payment_type: 'annuity',
  },
  {
    id: 'eq-097',
    title: 'Строительные леса, 500 м²',
    owner: 'ООО «СтройДом»',
    rate: 17.5,
    term_months: 12,
    payment_type: 'bullet',
  },
  {
    id: 'eq-099',
    title: 'Бетономешалка 500 л',
    owner: 'ИП Лебедев',
    rate: 23,
    term_months: 12,
    payment_type: 'annuity',
  },
  {
    id: 'eq-100',
    title: 'Самосвал КАМАЗ 65115',
    owner: 'ООО «Быстро»',
    rate: 19,
    term_months: 18,
    payment_type: 'annuity',
  },
]

const pastEquipment = (id: string) => PAST_EQUIPMENT.find(item => item.id === id)!

const SEEDS: Record<string, RentalSeed[]> = {
  'u-1': [
    { equipment: pastEquipment('eq-090'), amount: 50_000, monthsAgo: 8 },
    { equipment: pastEquipment('eq-085'), amount: 30_000, monthsAgo: 10 },
    { equipment: pastEquipment('eq-097'), amount: 100_000, monthsAgo: 4 },
    { equipment: pastEquipment('eq-099'), amount: 40_000, monthsAgo: 5, unpaid: 2 },
    { equipment: pastEquipment('eq-100'), amount: 70_000, monthsAgo: 3 },
    { equipment: pastEquipment('eq-085'), amount: 20_000, monthsAgo: 2, unpaid: 1 },
  ],
  'u-2': [
    { equipment: pastEquipment('eq-097'), amount: 1_000_000, monthsAgo: 6 },
    { equipment: pastEquipment('eq-100'), amount: 500_000, monthsAgo: 1 },
  ],
}

export const rentalsByUser = new Map<string, MyRentals>(
  Object.entries(SEEDS).map(([userId, seeds]) => {
    const built = seeds.map(seed => buildRental(seed))
    return [
      userId,
      {
        rentals: built.map(item => item.rental),
        payments: built.flatMap(item => item.payments),
      },
    ]
  })
)

export const addRental = (userId: string, seed: RentalSeed): void => {
  const myRentals = rentalsByUser.get(userId) ?? { rentals: [], payments: [] }
  const { rental, payments } = buildRental(seed)
  myRentals.rentals.push(rental)
  myRentals.payments.push(...payments)
  rentalsByUser.set(userId, myRentals)
}
