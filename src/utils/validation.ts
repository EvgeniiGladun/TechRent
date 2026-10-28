import { regex } from './regex'
import { messages } from './messages'

export type Validator<T = string> = (value: T) => string | null

export interface ValidatePasswordOptions {
  minLength?: number
  strict?: boolean
}

const isBlank = (value: string | null | undefined): boolean => !value || !value.trim()

export const validatePhone: Validator = phone => {
  if (isBlank(phone)) return messages.phoneRequired
  if (!regex.phone.test(phone)) return messages.phoneInvalid
  return null
}

export const validateEmail: Validator = email => {
  if (isBlank(email)) return messages.emailRequired
  if (!regex.email.test(email.trim())) return messages.emailInvalid
  return null
}

export const validatePassword = (
  password: string,
  options: number | ValidatePasswordOptions = 6
): string | null => {
  const { minLength = 6, strict = false } =
    typeof options === 'number' ? { minLength: options } : options

  if (isBlank(password)) return messages.passwordRequired
  if (password.length < minLength) return messages.passwordMinLength(minLength)
  if (strict && !regex.strongPassword.test(password)) return messages.passwordWeak
  return null
}

export const validatePasswordMatch = (password: string, confirm: string): string | null => {
  if (isBlank(confirm)) return messages.passwordConfirmRequired
  if (password !== confirm) return messages.passwordsNotMatch
  return null
}

export const validateCode = (code: string, length: number): string | null => {
  const digits = code.replace(regex.digits, '')
  return digits.length === length ? null : messages.codeLength(length)
}

export const validateForm = <F extends Record<string, unknown>>(
  form: F,
  rules: { [K in keyof F]?: (value: F[K], form: F) => string | null }
): { valid: boolean; errors: Record<keyof F, string> } => {
  const errors = {} as Record<keyof F, string>
  let valid = true

  for (const key of Object.keys(form) as Array<keyof F>) {
    const error = rules[key]?.(form[key], form) ?? null
    errors[key] = error ?? ''
    if (error) valid = false
  }

  return { valid, errors }
}
