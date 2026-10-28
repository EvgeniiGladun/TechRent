/**
 * Форма, описанная схемой. Схема — обычный JSON (её может прислать бэкенд),
 * поэтому регулярки хранятся строками, а условия показа — списком значений.
 */
import { parseAmount } from '@/utils/format'

export type FieldComponent = 'text' | 'date' | 'select' | 'radio' | 'checkbox' | 'group'

export type FieldValue = string | boolean

export type FormValues = Record<string, FieldValue>

export type FormErrors = Record<string, string>

export interface FieldOption {
  value: string
  label: string
}

/** Дополнительные поля, которые появляются, когда значение поля входит в `when` */
export interface FieldExtension {
  when: FieldValue[]
  fields: FieldSchema[]
}

export interface FieldSchema {
  /** У группы имя необязательно: без имени её поля попадут в payload на верхний уровень */
  name?: string
  component: FieldComponent
  label?: string
  required?: boolean
  pattern?: string
  patternMessage?: string
  mask?: 'phone' | 'amount' | 'date'
  placeholder?: string
  hint?: string
  options?: FieldOption[]
  fields?: FieldSchema[]
  extensions?: FieldExtension[]
  /** Поле на всю ширину строки (по умолчанию — половина на десктопе) */
  wide?: boolean
}

export type Payload = { [key: string]: FieldValue | number | Payload }

export const FORM_MESSAGES = {
  required: 'Поле обязательно для заполнения',
  checkboxRequired: 'Необходимо ваше согласие',
  pattern: 'Поле заполнено некорректно',
  date: 'Укажите существующую дату в формате ДД.ММ.ГГГГ',
} as const

const isGroup = (field: FieldSchema) => field.component === 'group'

export const isExtensionActive = (extension: FieldExtension, value: FieldValue | undefined) =>
  value !== undefined && extension.when.includes(value)

/** Все поля ввода схемы, включая скрытые: нужны для начальных значений */
const collectAll = (fields: readonly FieldSchema[]): FieldSchema[] =>
  fields.flatMap(field => [
    ...(isGroup(field) ? collectAll(field.fields ?? []) : [field]),
    ...(field.extensions ?? []).flatMap(extension => collectAll(extension.fields)),
  ])

/** Поля ввода, которые сейчас видит пользователь (с учётом раскрытых расширений) */
export const getVisibleFields = (
  fields: readonly FieldSchema[],
  values: FormValues
): FieldSchema[] =>
  fields.flatMap(field => [
    ...(isGroup(field) ? getVisibleFields(field.fields ?? [], values) : [field]),
    ...(field.extensions ?? [])
      .filter(extension =>
        isExtensionActive(extension, field.name ? values[field.name] : undefined)
      )
      .flatMap(extension => getVisibleFields(extension.fields, values)),
  ])

export const createInitialValues = (schema: readonly FieldSchema[]): FormValues =>
  Object.fromEntries(
    collectAll(schema)
      .filter(field => field.name)
      .map(field => [field.name!, field.component === 'checkbox' ? false : ''])
  )

/** «31.02.2024» не пройдёт: после разбора дата должна совпасть с введённой */
export const isValidDate = (value: string): boolean => {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
  if (!match) return false
  const [, day, month, year] = match.map(Number) as [number, number, number, number]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

const isEmpty = (value: FieldValue | undefined) =>
  value === undefined || value === false || (typeof value === 'string' && !value.trim())

export const validateField = (field: FieldSchema, value: FieldValue | undefined): string | null => {
  if (isEmpty(value)) {
    if (!field.required) return null
    return field.component === 'checkbox' ? FORM_MESSAGES.checkboxRequired : FORM_MESSAGES.required
  }

  if (typeof value !== 'string') return null
  if (field.component === 'date' && !isValidDate(value.trim())) return FORM_MESSAGES.date
  if (field.pattern && !new RegExp(field.pattern).test(value.trim())) {
    return field.patternMessage ?? FORM_MESSAGES.pattern
  }
  return null
}

/** Ошибки только по видимым полям: скрытое расширение не должно блокировать отправку */
export const validateForm = (schema: readonly FieldSchema[], values: FormValues): FormErrors =>
  Object.fromEntries(
    getVisibleFields(schema, values)
      .map(field => [field.name!, validateField(field, values[field.name!])] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== null)
  )

export const getRequiredProgress = (schema: readonly FieldSchema[], values: FormValues) => {
  const required = getVisibleFields(schema, values).filter(field => field.required)
  const filled = required.filter(field => !isEmpty(values[field.name!]))
  return { filled: filled.length, total: required.length }
}

const toPayloadValue = (field: FieldSchema, value: FieldValue): FieldValue | number => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (field.mask === 'amount' && trimmed) return parseAmount(trimmed)
  if (field.mask === 'phone') return trimmed.replace(/[^\d+]/g, '')
  return trimmed
}

/**
 * Собирает данные для отправки: именованные группы становятся вложенными объектами,
 * значения скрытых полей не отправляются, строки обрезаются, суммы приводятся к числу.
 */
export const buildPayload = (schema: readonly FieldSchema[], values: FormValues): Payload => {
  const payload: Payload = {}

  for (const field of schema) {
    if (isGroup(field)) {
      const nested = buildPayload(field.fields ?? [], values)
      if (field.name) payload[field.name] = nested
      else Object.assign(payload, nested)
    } else if (field.name) {
      payload[field.name] = toPayloadValue(field, values[field.name] ?? '')
    }

    for (const extension of field.extensions ?? []) {
      if (isExtensionActive(extension, field.name ? values[field.name] : undefined)) {
        Object.assign(payload, buildPayload(extension.fields, values))
      }
    }
  }

  return payload
}
