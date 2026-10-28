import { QueryClient } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { HTTP_STATUS, TIME } from '@/constants'

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status && status < HTTP_STATUS.INTERNAL_SERVER_ERROR) return false
  return failureCount < 1
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      staleTime: 5 * TIME.MINUTE,
    },
    mutations: {
      retry: false,
    },
  },
})
