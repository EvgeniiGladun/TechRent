import type { PaymentTypeValue } from '@/utils/dictionaries'
import { paymentType } from '@/utils/dictionaries'

export interface ScheduleRow {
  month: number
  buyout: number
  rent: number
  payment: number
  remaining: number
}

export interface Schedule {
  rows: ScheduleRow[]
  totalPayment: number
  totalRent: number
}

export interface ScheduleParams {
  amount: number
  rate: number
  termMonths: number
  type: PaymentTypeValue
}

const toCents = (value: number) => Math.round(value * 100)
const fromCents = (value: number) => value / 100

/**
 * Равные платежи — каждый месяц арендатор платит одинаковую сумму: аренду и часть выкупа.
 * Аренда начисляется на ещё не выкупленную стоимость, поэтому в начале срока большая часть
 * платежа уходит на аренду, к концу — на выкуп.
 * Всё считается в копейках: если считать в рублях с дробями, ошибки округления
 * накапливаются, и сумма выкупа расходится со стоимостью техники.
 * В последний месяц выкупаем весь остаток, чтобы эти копейки сошлись ровно.
 */
const annuity = (amountCents: number, monthlyRate: number, term: number): ScheduleRow[] => {
  const payment =
    monthlyRate === 0
      ? Math.round(amountCents / term)
      : Math.round((amountCents * monthlyRate) / (1 - (1 + monthlyRate) ** -term))

  const rows: ScheduleRow[] = []
  let remaining = amountCents

  for (let month = 1; month <= term; month++) {
    const rent = Math.round(remaining * monthlyRate)
    const buyout = month === term ? remaining : payment - rent
    remaining -= buyout

    rows.push({
      month,
      buyout: fromCents(buyout),
      rent: fromCents(rent),
      payment: fromCents(buyout + rent),
      remaining: fromCents(remaining),
    })
  }

  return rows
}

/** Выкуп в конце срока — каждый месяц только аренда, стоимость техники платится последним платежом */
const bullet = (amountCents: number, monthlyRate: number, term: number): ScheduleRow[] => {
  const rent = Math.round(amountCents * monthlyRate)

  return Array.from({ length: term }, (_, index) => {
    const month = index + 1
    const buyout = month === term ? amountCents : 0
    return {
      month,
      buyout: fromCents(buyout),
      rent: fromCents(rent),
      payment: fromCents(buyout + rent),
      remaining: fromCents(amountCents - buyout),
    }
  })
}

export const buildSchedule = ({ amount, rate, termMonths, type }: ScheduleParams): Schedule => {
  if (!(amount > 0) || !(termMonths > 0)) {
    return { rows: [], totalPayment: 0, totalRent: 0 }
  }

  const amountCents = toCents(amount)
  const monthlyRate = rate / 100 / 12
  const rows = paymentType.is(type, 'BULLET')
    ? bullet(amountCents, monthlyRate, termMonths)
    : annuity(amountCents, monthlyRate, termMonths)

  const totalPaymentCents = rows.reduce((sum, row) => sum + toCents(row.payment), 0)

  return {
    rows,
    totalPayment: fromCents(totalPaymentCents),
    totalRent: fromCents(totalPaymentCents - amountCents),
  }
}
