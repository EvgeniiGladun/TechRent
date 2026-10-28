import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VOtpInput from './VOtpInput.vue'

const mountOtp = (modelValue = '') =>
  mount(VOtpInput, {
    props: {
      modelValue,
      length: 5,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })

let wrapper: ReturnType<typeof mountOtp>

describe('VOtpInput', () => {
  it('рисует ячейку на каждую цифру', () => {
    wrapper = mountOtp()
    expect(wrapper.findAll('input')).toHaveLength(5)
  })

  it('ввод цифр собирает код и эмитит complete на последней', async () => {
    wrapper = mountOtp()
    const cells = wrapper.findAll('input')

    for (const [index, digit] of ['1', '2', '3', '4', '5'].entries()) {
      await cells[index]!.setValue(digit)
    }

    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['12345'])
    expect(wrapper.emitted('complete')).toEqual([['12345']])
  })

  it('быстрый ввод: события приходят раньше перерисовки, цифры не теряются', () => {
    wrapper = mountOtp()
    const cells = wrapper.findAll('input').map(cell => cell.element as HTMLInputElement)

    ;['9', '8', '7', '6', '5'].forEach((digit, index) => {
      cells[index]!.value = digit
      cells[index]!.dispatchEvent(new Event('input'))
    })

    expect(wrapper.emitted('complete')).toEqual([['98765']])
  })

  it('несколько цифр в одной ячейке (быстрый ввод, автоподстановка) раскладываются дальше', async () => {
    wrapper = mountOtp()
    await wrapper.findAll('input')[0]!.setValue('12345')
    expect(wrapper.emitted('complete')).toEqual([['12345']])
  })

  it('ввод в заполненную ячейку заменяет цифру, а не сдвигает код', async () => {
    wrapper = mountOtp('12345')
    await wrapper.findAll('input')[2]!.setValue('39')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['12945'])
  })

  it('буквы игнорируются', async () => {
    wrapper = mountOtp()
    await wrapper.findAll('input')[0]!.setValue('a')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
  })

  it('вставка «Ваш код: 54-321» раскладывается по ячейкам', async () => {
    wrapper = mountOtp()
    await wrapper.find('[role="group"]').trigger('paste', {
      clipboardData: { getData: () => 'Ваш код: 54-321' },
    })

    expect(wrapper.emitted('complete')).toEqual([['54321']])
  })

  it('показывает ошибку', () => {
    wrapper = mount(VOtpInput, { props: { modelValue: '', error: 'Неверный код' } })
    expect(wrapper.get('[role="alert"]').text()).toBe('Неверный код')
  })
})
