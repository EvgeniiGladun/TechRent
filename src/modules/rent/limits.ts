import { RENT_LIMITS } from '@/constants'
import { formatCurrency, parseAmount } from '@/utils/format'
import { messages } from '@/utils/messages'

export interface LimitsInput {
  equipmentMin: number | null
  fleetValue: number
  rentedValue: number
  balance: number
  rentedThisYear: number
  hasYearlyLimit: boolean
}

export type LimitReason = 'fleet' | 'yearly' | 'balance'

export interface RentLimits {
  min: number
  max: number
  maxReason: LimitReason
  yearlyLeft: number | null
}

/**
 * На какую стоимость техники можно оформить аренду. Сверху сумму ограничивают сразу три вещи:
 * сколько техники в парке ещё свободно, какой залог лежит на счёте (договор обеспечивается
 * залогом) и — для физлица без статуса проверенного арендатора — сколько осталось от годового
 * лимита 600 тыс. Итоговый максимум — самое строгое из них.
 * Заодно запоминаем, какое именно ограничение сработало, чтобы объяснить это пользователю.
 */
export const calcLimits = (input: LimitsInput): RentLimits => {
  const min = input.equipmentMin ?? RENT_LIMITS.DEFAULT_MIN
  const fleetLeft = Math.max(0, input.fleetValue - input.rentedValue)
  const yearlyLeft = input.hasYearlyLimit
    ? Math.max(0, RENT_LIMITS.UNQUALIFIED_YEARLY - input.rentedThisYear)
    : null

  const candidates: Array<[LimitReason, number]> = [
    ['fleet', fleetLeft],
    ['balance', input.balance],
  ]
  if (yearlyLeft !== null) candidates.push(['yearly', yearlyLeft])

  const [maxReason, max] = candidates.reduce((acc, item) => (item[1] < acc[1] ? item : acc))

  return { min, max, maxReason, yearlyLeft }
}

export const validateAmount = (raw: string | number, limits: RentLimits): string | null => {
  if (raw === '' || raw == null) return messages.amountRequired

  const amount = parseAmount(raw)
  if (Number.isNaN(amount)) return messages.amountInvalid
  if (amount < limits.min) return messages.amountMin(formatCurrency(limits.min))
  if (amount > limits.max) {
    return limits.maxReason === 'balance'
      ? messages.amountBalance
      : messages.amountMax(formatCurrency(limits.max))
  }
  return null
}

export const isRentPossible = (limits: RentLimits): boolean => limits.max >= limits.min

export const LIMIT_HINTS: Record<LimitReason, string> = {
  fleet: 'Свободная техника в парке',
  yearly: 'Годовой лимит для арендатора без подтверждения',
  balance: 'Залог на счёте',
}
