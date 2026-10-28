import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DynamicForm from './DynamicForm.vue'
import { FORM_MESSAGES, type FieldSchema } from './schema'

const schema: FieldSchema[] = [
  {
    name: 'type',
    component: 'radio',
    label: 'Тип',
    required: true,
    options: [
      { value: 'FL', label: 'Физлицо' },
      { value: 'IE', label: 'ИП' },
    ],
    extensions: [
      { when: ['IE'], fields: [{ name: 'inn', component: 'text', label: 'ИНН', required: true }] },
    ],
  },
  { name: 'agree', component: 'checkbox', label: 'Согласен', required: true },
]

const mountForm = () =>
  mount(DynamicForm, {
    props: { schema },
    attachTo: document.body,
    global: { stubs: { RouterLink: true } },
  })

describe('DynamicForm', () => {
  beforeAll(() => {
    // В jsdom нет layout, поэтому scrollIntoView не реализован
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('показывает поля расширения после выбора значения', async () => {
    const wrapper = mountForm()
    expect(wrapper.find('[data-field="inn"]').exists()).toBe(false)

    await wrapper.find('input[value="IE"]').setValue(true)
    expect(wrapper.find('[data-field="inn"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('не отправляет пустую форму, показывает ошибки и фокусирует первое поле с ошибкой', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain(FORM_MESSAGES.required)
    expect(wrapper.text()).toContain(FORM_MESSAGES.checkboxRequired)
    expect(document.activeElement).toBe(wrapper.find('input[value="FL"]').element)
    wrapper.unmount()
  })

  it('отправляет собранный payload и выставляет ошибки бэкенда под поля', async () => {
    const wrapper = mountForm()
    await wrapper.find('input[value="IE"]').setValue(true)
    await wrapper.find('[data-field="inn"] input').setValue(' 123456789012 ')
    await wrapper.find('input[name="agree"]').setValue(true)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { type: 'IE', inn: '123456789012', agree: true },
    ])

    await wrapper.setProps({ serverErrors: { inn: 'ИНН не найден в реестре' } })
    expect(wrapper.find('[data-field="inn"]').text()).toContain('ИНН не найден в реестре')
    wrapper.unmount()
  })
})
