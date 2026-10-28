import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Equipment, User } from '@/api/schemas'
import { useUserStore } from '@/stores/user'
import { formatCurrency } from '@/utils/format'
import RentPanel from './RentPanel.vue'
import { buildSchedule } from './schedule'

const equipment: Equipment = {
  id: 'eq-1',
  title: 'Тестовый экскаватор',
  owner: 'ООО «Тест»',
  description: '',
  status: 'available',
  payment_type: 'annuity',
  rate: 12,
  term_months: 12,
  fleet_value: 1_000_000,
  rented_value: 0,
  min_amount: 10_000,
  renters_count: 0,
}

const user: User = {
  id: 'u-1',
  name: 'Тест',
  phone: '+7 (900) 000-00-01',
  email: 'test@example.com',
  role: 'renter',
  legal_type: 'FL',
  qualification: 'N',
  verification: 'C',
  balance: 750_000,
  rented_this_year: 200_000,
  is_blocked: false,
}

const mountPanel = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useUserStore().setUser(user)

  return mount(RentPanel, {
    props: { equipment, user },
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: true },
    },
  })
}

describe('RentPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('стартует с минимальной суммы и показывает остаток годового лимита', () => {
    const wrapper = mountPanel()

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('10 000')
    expect(wrapper.text()).toContain('От 10 000 ₽ до 400 000 ₽')
    expect(wrapper.text()).toContain('Годовой лимит для арендатора без подтверждения')
  })

  it('сумма сверх годового лимита — ошибка и заблокированная кнопка', async () => {
    const wrapper = mountPanel()

    await wrapper.get('input').setValue('500000')

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('500 000')
    expect(wrapper.get('[role="alert"]').text()).toBe('Максимальная сумма — 400 000 ₽')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('график пересчитывается после паузы ввода (debounce)', async () => {
    const wrapper = mountPanel()

    const totalFor = (amount: number) =>
      formatCurrency(
        buildSchedule({ amount, rate: 12, termMonths: 12, type: 'annuity' }).totalPayment
      )

    await wrapper.get('input').setValue('100000')
    expect(wrapper.text()).toContain(totalFor(10_000))

    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(wrapper.text()).toContain(totalFor(100_000))
    expect(totalFor(100_000)).toBe('106 618,53 ₽')
  })

  it('чип «Максимум» подставляет доступный максимум', async () => {
    const wrapper = mountPanel()

    const maxChip = wrapper.findAll('button').find(button => button.text() === 'Максимум')!
    await maxChip.trigger('click')

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('400 000')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Арендовать за 400 000 ₽')
  })
})
