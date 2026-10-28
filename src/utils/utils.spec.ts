import { describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { createDictionary } from './dictionary'
import { ErrorType, processError } from './error'
import {
  formatAmountInput,
  formatCurrency,
  formatSeconds,
  maskPhone,
  parseAmount,
  plural,
} from './format'
import { formatPhoneInput } from './phone-mask'
import { isTokenExpired, toExpirationTimestamp } from './token'
import {
  validateCode,
  validateForm,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
} from './validation'

describe('createDictionary', () => {
  const dict = createDictionary('test', {
    YES: { value: 'Y', text: 'Да' },
    NO: { value: 'N', text: 'Нет' },
  } as const)

  it('ключ ↔ код ↔ подпись', () => {
    expect(dict.value('YES')).toBe('Y')
    expect(dict.text('NO')).toBe('Нет')
    expect(dict.keyOf('N')).toBe('NO')
    expect(dict.textOf('Y')).toBe('Да')
    expect(dict.is('Y', 'YES')).toBe(true)
    expect(dict.options()).toEqual([
      { value: 'Y', label: 'Да' },
      { value: 'N', label: 'Нет' },
    ])
  })

  it('неизвестный код не роняет UI, а возвращает fallback и пишет warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(dict.textOf('X')).toBe('—')
    expect(dict.keyOf('X')).toBeNull()
    expect(warn).toHaveBeenCalled()
  })
})

describe('validation', () => {
  it('телефон', () => {
    expect(validatePhone('')).toBe('Введите номер телефона')
    expect(validatePhone('+7 (900) 000-00')).toBe('Неверный формат телефона')
    expect(validatePhone('+7 (900) 000-00-01')).toBeNull()
  })

  it('пароль: длина и сложность', () => {
    expect(validatePassword('abc', 6)).toBe('Пароль должен содержать минимум 6 символов')
    expect(validatePassword('abcdefgh', { minLength: 8, strict: true })).toMatch(/заглавную/)
    expect(validatePassword('Abcdef1!', { minLength: 8, strict: true })).toBeNull()
  })

  it('совпадение паролей и код', () => {
    expect(validatePasswordMatch('a', 'b')).toBe('Пароли не совпадают')
    expect(validateCode('12-34', 5)).toBe('Код должен состоять из 5 цифр')
    expect(validateCode('12345', 5)).toBeNull()
  })

  it('validateForm собирает ошибки по полям и передаёт всю форму в правило', () => {
    const result = validateForm(
      { password: 'Abcdef1!', confirm: 'other' },
      { confirm: (value, form) => validatePasswordMatch(form.password, value) }
    )
    expect(result).toEqual({
      valid: false,
      errors: { password: '', confirm: 'Пароли не совпадают' },
    })
  })
})

describe('format', () => {
  it('валюта, проценты, время', () => {
    expect(formatCurrency(1234567.5)).toBe('1 234 567,5 ₽')
    expect(formatCurrency(null)).toBe('—')
    expect(formatSeconds(125)).toBe('2:05')
  })

  it('formatAmountInput группирует разряды и ограничивает копейки', () => {
    expect(formatAmountInput(1000000)).toBe('1 000 000')
    expect(formatAmountInput('0012345.678')).toBe('12 345,67')
    expect(formatAmountInput('abc')).toBe('')
  })

  it('parseAmount понимает ввод пользователя', () => {
    expect(parseAmount('10 000,50 ₽')).toBe(10000.5)
    expect(Number.isNaN(parseAmount(''))).toBe(true)
  })

  it('склонения', () => {
    const forms = ['месяц', 'месяца', 'месяцев'] as const
    expect([1, 3, 5, 11, 21, 24].map(n => plural(n, forms))).toEqual([
      'месяц',
      'месяца',
      'месяцев',
      'месяцев',
      'месяц',
      'месяца',
    ])
  })

  it('маска телефона', () => {
    expect(formatPhoneInput('89001234567')).toBe('+7 (900) 123-45-67')
    expect(formatPhoneInput('+7 900 12')).toBe('+7 (900) 12')
    expect(formatPhoneInput('abc')).toBe('')
    expect(maskPhone('+7 (900) 123-45-67')).toBe('+7 (900) ***-**-67')
  })
})

describe('token', () => {
  const now = 1_700_000_000

  it('TTL в секундах и абсолютный timestamp приводятся к одному виду', () => {
    expect(toExpirationTimestamp(30, now)).toBe(now + 30)
    expect(toExpirationTimestamp(String(now + 100), now)).toBe(now + 100)
    expect(toExpirationTimestamp('garbage', now)).toBeNull()
  })

  it('токен считается истёкшим заранее, с буфером', () => {
    expect(isTokenExpired(now + 300, now)).toBe(false)
    expect(isTokenExpired(now + 5, now)).toBe(true)
    expect(isTokenExpired(null, now)).toBe(true)
  })
})

describe('processError', () => {
  const axiosError = (status: number, data: unknown) =>
    new AxiosError('fail', 'ERR', undefined, null, {
      status,
      data,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    })

  it('429 → RATE_LIMIT с retry_after', () => {
    const error = processError(axiosError(429, { message: 'Подождите', retry_after: 42 }))
    expect(error).toMatchObject({
      type: ErrorType.RATE_LIMIT,
      message: 'Подождите',
      retryAfter: 42,
    })
  })

  it('ошибки по полям приводятся к строкам', () => {
    const error = processError(axiosError(422, { fields: { phone: ['Занят', 'Проверьте номер'] } }))
    expect(error.type).toBe(ErrorType.VALIDATION)
    expect(error.fields).toEqual({ phone: 'Занят. Проверьте номер' })
  })

  it('нет ответа → NETWORK', () => {
    expect(processError(new AxiosError('Network Error')).type).toBe(ErrorType.NETWORK)
  })
})
