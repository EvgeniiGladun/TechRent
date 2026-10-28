import { describe, expect, it } from 'vitest'
import {
  FORM_MESSAGES,
  buildPayload,
  createInitialValues,
  getRequiredProgress,
  getVisibleFields,
  isValidDate,
  validateForm,
  type FieldSchema,
  type FormValues,
} from './schema'

const schema: FieldSchema[] = [
  {
    name: 'type',
    component: 'radio',
    required: true,
    options: [
      { value: 'FL', label: 'Физлицо' },
      { value: 'IE', label: 'ИП' },
    ],
    extensions: [
      {
        when: ['IE'],
        fields: [{ name: 'inn', component: 'text', required: true, pattern: '^\\d{12}$' }],
      },
    ],
  },
  {
    name: 'personal',
    component: 'group',
    fields: [
      { name: 'name', component: 'text', required: true },
      { name: 'birth_date', component: 'date', required: true },
    ],
  },
  {
    component: 'group',
    fields: [
      { name: 'amount', component: 'text', mask: 'amount' },
      {
        name: 'is_qualified',
        component: 'checkbox',
        extensions: [
          { when: [true], fields: [{ name: 'basis', component: 'select', required: true }] },
        ],
      },
      { name: 'agree', component: 'checkbox', required: true },
    ],
  },
]

const filled = (patch: FormValues = {}): FormValues => ({
  ...createInitialValues(schema),
  type: 'FL',
  name: '  Анна  ',
  birth_date: '01.02.2000',
  agree: true,
  ...patch,
})

const names = (values: FormValues) => getVisibleFields(schema, values).map(field => field.name)

describe('createInitialValues', () => {
  it('создаёт значения для всех полей, включая скрытые; чекбоксы — false', () => {
    expect(createInitialValues(schema)).toEqual({
      type: '',
      inn: '',
      name: '',
      birth_date: '',
      amount: '',
      is_qualified: false,
      basis: '',
      agree: false,
    })
  })
})

describe('getVisibleFields', () => {
  it('поля расширения появляются только при подходящем значении', () => {
    expect(names(filled())).not.toContain('inn')
    expect(names(filled({ type: 'IE' }))).toContain('inn')
    expect(names(filled({ is_qualified: true }))).toContain('basis')
  })
})

describe('validateForm', () => {
  it('заполненная форма проходит проверку', () => {
    expect(validateForm(schema, filled())).toEqual({})
  })

  it('скрытое обязательное поле не мешает отправке, раскрытое — проверяется', () => {
    expect(validateForm(schema, filled({ inn: '' }))).toEqual({})
    expect(validateForm(schema, filled({ type: 'IE', inn: '123' }))).toEqual({
      inn: FORM_MESSAGES.pattern,
    })
  })

  it('обязательный чекбокс-согласие и несуществующая дата', () => {
    expect(validateForm(schema, filled({ agree: false, birth_date: '31.02.2000' }))).toEqual({
      agree: FORM_MESSAGES.checkboxRequired,
      birth_date: FORM_MESSAGES.date,
    })
  })
})

describe('isValidDate', () => {
  it.each([
    ['29.02.2024', true],
    ['29.02.2023', false],
    ['1.02.2024', false],
    ['31.04.2024', false],
  ])('%s → %s', (value, expected) => {
    expect(isValidDate(value)).toBe(expected)
  })
})

describe('getRequiredProgress', () => {
  it('считает только видимые обязательные поля', () => {
    expect(getRequiredProgress(schema, createInitialValues(schema))).toEqual({
      filled: 0,
      total: 4,
    })
    expect(getRequiredProgress(schema, filled({ type: 'IE' }))).toEqual({ filled: 4, total: 5 })
  })
})

describe('buildPayload', () => {
  it('именованная группа — вложенный объект, безымянная — поля на верхнем уровне', () => {
    expect(buildPayload(schema, filled({ amount: '1 500 000' }))).toEqual({
      type: 'FL',
      personal: { name: 'Анна', birth_date: '01.02.2000' },
      amount: 1_500_000,
      is_qualified: false,
      agree: true,
    })
  })

  it('значения скрытых полей не отправляются, раскрытых — отправляются', () => {
    const payload = buildPayload(
      schema,
      filled({ inn: '123456789012', basis: 'assets', is_qualified: true })
    )
    expect(payload).not.toHaveProperty('inn')
    expect(payload).toMatchObject({ is_qualified: true, basis: 'assets' })
  })
})
