import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { ErrorType, logError, processError, type ProcessedError } from '@/utils/error'

export interface UseErrorHandlerOptions {
  autoLog?: boolean
  context?: string
  handlers?: Partial<Record<ErrorType, (error: ProcessedError) => void>>
  statusHandlers?: Partial<Record<number, (error: ProcessedError) => void>>
}

export interface UseErrorHandlerReturn {
  error: Ref<ProcessedError | null>
  errorMessage: ComputedRef<string>
  fieldErrors: ComputedRef<Record<string, string>>
  hasError: ComputedRef<boolean>
  handleError: (error: unknown) => ProcessedError
  clearError: () => void
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const { autoLog = true, context, handlers = {}, statusHandlers = {} } = options

  const error = ref<ProcessedError | null>(null)

  const handleError = (raw: unknown): ProcessedError => {
    const processed = processError(raw)
    error.value = processed

    if (autoLog) logError(raw, context)

    const statusHandler = processed.status ? statusHandlers[processed.status] : undefined
    if (statusHandler) {
      statusHandler(processed)
    } else {
      handlers[processed.type]?.(processed)
    }

    return processed
  }

  const clearError = () => {
    error.value = null
  }

  return {
    error,
    errorMessage: computed(() => error.value?.message ?? ''),
    fieldErrors: computed(() => error.value?.fields ?? {}),
    hasError: computed(() => error.value !== null),
    handleError,
    clearError,
  }
}
