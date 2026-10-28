import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { HTTP_STATUS } from '@/constants'
import { logError } from '@/utils/error'
import { clientConfig } from './raw-client'
import { refreshAccessToken } from './refresh'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const PUBLIC_AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/confirm', '/auth/refresh']

const isPublicAuthRequest = (url = ''): boolean =>
  PUBLIC_AUTH_ENDPOINTS.some(endpoint => url.startsWith(endpoint))

export const apiClient = axios.create(clientConfig)

apiClient.interceptors.request.use(config => {
  const { accessToken } = useAuthStore()
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/**
 * Если сервер ответил 401 «токен устарел», обновляем токен и повторяем запрос —
 * пользователь ничего не замечает. Повторяем только один раз, чтобы не уйти в цикл.
 * На входе и регистрации 401 означает «неверный пароль или код», там токен не обновляем.
 */
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isUnauthorized = error.response?.status === HTTP_STATUS.UNAUTHORIZED

    if (!original || !isUnauthorized || original._retry || isPublicAuthRequest(original.url)) {
      logError(error, 'API')
      return Promise.reject(error)
    }

    original._retry = true
    const newToken = await refreshAccessToken()

    if (!newToken) {
      return Promise.reject(error)
    }

    original.headers.Authorization = `Bearer ${newToken}`
    return apiClient(original)
  }
)
