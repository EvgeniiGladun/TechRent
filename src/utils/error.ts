import { isAxiosError } from 'axios'
import { HTTP_STATUS } from '@/constants'
import { messages } from './messages'

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiErrorBody {
  message?: string
  fields?: Record<string, string[] | string>
  retry_after?: number
}

export interface ProcessedError {
  type: ErrorType
  message: string
  status?: number
  fields: Record<string, string>
  retryAfter?: number
  originalError: unknown
}

export const getErrorType = (error: unknown): ErrorType => {
  if (isAxiosError(error)) {
    const status = error.response?.status

    if (!status) return ErrorType.NETWORK
    if (status === HTTP_STATUS.UNAUTHORIZED || status === HTTP_STATUS.FORBIDDEN) {
      return ErrorType.AUTH
    }
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) return ErrorType.RATE_LIMIT
    if (status >= HTTP_STATUS.BAD_REQUEST && status < HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      return ErrorType.VALIDATION
    }
    return ErrorType.SERVER
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorType.NETWORK
  }

  return ErrorType.UNKNOWN
}

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || error.response?.statusText || error.message
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return messages.unknown
}

const getFieldErrors = (error: unknown): Record<string, string> => {
  if (!isAxiosError<ApiErrorBody>(error)) return {}

  const fields = error.response?.data?.fields ?? {}
  return Object.fromEntries(
    Object.entries(fields).map(([name, value]) => [
      name,
      Array.isArray(value) ? value.join('. ') : value,
    ])
  )
}

export const processError = (error: unknown): ProcessedError => ({
  type: getErrorType(error),
  message: getErrorMessage(error),
  status: isAxiosError(error) ? error.response?.status : undefined,
  fields: getFieldErrors(error),
  retryAfter: isAxiosError<ApiErrorBody>(error) ? error.response?.data?.retry_after : undefined,
  originalError: error,
})

export const logError = (error: unknown, context?: string): void => {
  const { type, message, status } = processError(error)
  const prefix = context ? `[${context}] ` : ''

  console.error(`${prefix}${type}: ${message}`, { status, error })
}
