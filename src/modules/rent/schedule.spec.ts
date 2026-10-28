import { describe, expect, it } from 'vitest'
import { buildSchedule } from './schedule'

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100

describe('buildSchedule', () => {
  it('равные платежи: все равны, кроме последнего (корректировка округления)', () => {
    const { rows } = buildSchedule({ amount: 100_000, rate: 12, termMonths: 12, type: 'annuity' })

    expect(rows).toHaveLength(12)
    expect(rows[0]!.payment).toBe(8884.88)
    const regular = rows.slice(0, -1).map(row => row.payment)
    expect(new Set(regular).size).toBe(1)
  })

  it('равные платежи: сумма выкупа ровно равна стоимости техники, остаток в конце — 0', () => {
    const { rows } = buildSchedule({ amount: 333_333.33, rate: 21, termMonths: 7, type: 'annuity' })

    expect(sum(rows.map(row => row.buyout))).toBe(333_333.33)
    expect(rows.at(-1)!.remaining).toBe(0)
  })

  it('равные платежи: аренда уменьшается от месяца к месяцу', () => {
    const { rows } = buildSchedule({ amount: 500_000, rate: 24, termMonths: 24, type: 'annuity' })

    rows.slice(1).forEach((row, index) => {
      expect(row.rent).toBeLessThan(rows[index]!.rent)
    })
  })

  it('выкуп в конце: ежемесячно только аренда, стоимость платится последним платежом', () => {
    const { rows, totalRent } = buildSchedule({
      amount: 120_000,
      rate: 18,
      termMonths: 6,
      type: 'bullet',
    })

    expect(rows.slice(0, -1).every(row => row.buyout === 0 && row.rent === 1800)).toBe(true)
    expect(rows.at(-1)).toMatchObject({ buyout: 120_000, payment: 121_800, remaining: 0 })
    expect(totalRent).toBe(10_800)
  })

  it('totalPayment = стоимость техники + totalRent', () => {
    const schedule = buildSchedule({ amount: 75_000, rate: 19.5, termMonths: 9, type: 'annuity' })
    expect(schedule.totalPayment).toBeCloseTo(75_000 + schedule.totalRent, 2)
  })

  it('нулевая ставка не ломает формулу равных платежей', () => {
    const { rows, totalRent } = buildSchedule({
      amount: 1000,
      rate: 0,
      termMonths: 3,
      type: 'annuity',
    })

    expect(totalRent).toBe(0)
    expect(sum(rows.map(row => row.payment))).toBe(1000)
  })

  it.each([0, -100, NaN])('некорректная сумма %s → пустой график', amount => {
    expect(buildSchedule({ amount, rate: 10, termMonths: 12, type: 'annuity' }).rows).toEqual([])
  })
})
