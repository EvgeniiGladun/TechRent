import { describe, expect, it } from 'vitest'
import { calcLimits, isRentPossible, validateAmount, type LimitsInput } from './limits'

const base: LimitsInput = {
  equipmentMin: 10_000,
  fleetValue: 1_000_000,
  rentedValue: 200_000,
  balance: 2_000_000,
  rentedThisYear: 0,
  hasYearlyLimit: false,
}

describe('calcLimits', () => {
  it('без годового лимита максимум = свободная техника в парке', () => {
    expect(calcLimits(base)).toMatchObject({
      min: 10_000,
      max: 800_000,
      maxReason: 'fleet',
      yearlyLeft: null,
    })
  })

  it('физлицо без подтверждения упирается в годовой лимит с учётом уже арендованного', () => {
    const limits = calcLimits({ ...base, hasYearlyLimit: true, rentedThisYear: 450_000 })
    expect(limits).toMatchObject({ max: 150_000, maxReason: 'yearly', yearlyLeft: 150_000 })
  })

  it('залог меньше остальных ограничений — ограничивает залог', () => {
    expect(calcLimits({ ...base, balance: 30_000 })).toMatchObject({
      max: 30_000,
      maxReason: 'balance',
    })
  })

  it('минимум для техники не задан — берётся минимум платформы', () => {
    expect(calcLimits({ ...base, equipmentMin: null }).min).toBe(10_000)
  })

  it('годовой лимит исчерпан → арендовать нельзя', () => {
    const limits = calcLimits({ ...base, hasYearlyLimit: true, rentedThisYear: 600_000 })
    expect(limits.max).toBe(0)
    expect(isRentPossible(limits)).toBe(false)
  })

  it('перебор по парку не уводит максимум в минус', () => {
    expect(calcLimits({ ...base, rentedValue: 1_200_000 }).max).toBe(0)
  })
})

describe('validateAmount', () => {
  const limits = calcLimits({ ...base, balance: 100_000 })

  it.each([
    ['', 'Введите сумму'],
    ['abc', 'Сумма должна быть числом'],
    ['5 000', 'Минимальная сумма — 10 000 ₽'],
    ['150 000', 'Недостаточно залога на счёте'],
  ])('«%s» → %s', (input, expected) => {
    expect(validateAmount(input, limits)).toBe(expected)
  })

  it('при ограничении парком показывает конкретный максимум', () => {
    const fleetLimited = calcLimits({ ...base, rentedValue: 950_000 })
    expect(validateAmount('60000', fleetLimited)).toBe('Максимальная сумма — 50 000 ₽')
  })

  it('валидная сумма в формате ввода «50 000,50» проходит', () => {
    expect(validateAmount('50 000,50', limits)).toBeNull()
  })
})
