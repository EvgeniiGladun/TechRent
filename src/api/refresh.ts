import { useAuthStore } from '@/stores/auth'
import { TOKEN } from '@/constants'
import { logError } from '@/utils/error'
import { tokensSchema } from './schemas'
import { rawClient } from './raw-client'

let refreshPromise: Promise<string | null> | null = null

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Token refresh timeout')), ms)
    }),
  ])

/**
 * Обновляет токен доступа и гарантирует, что запрос на обновление уйдёт только один,
 * даже если его одновременно попросили несколько запросов страницы.
 * Первый вызов отправляет запрос и запоминает его промис, остальные просто ждут тот же
 * промис. Иначе сервер получил бы один и тот же refresh-токен несколько раз, принял бы
 * только первый, а остальные счёл бы попыткой взлома и разлогинил пользователя.
 * Если обновить не удалось, сессия очищается и возвращается null.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise

  const authStore = useAuthStore()
  const refreshToken = authStore.refreshToken

  if (!refreshToken) return Promise.resolve(null)

  refreshPromise = withTimeout(
    rawClient.post('/auth/refresh', { refresh_token: refreshToken }),
    TOKEN.REFRESH_TIMEOUT_MS
  )
    .then(({ data }) => {
      const tokens = tokensSchema.parse(data)
      authStore.setTokens(tokens)
      return tokens.access_token
    })
    .catch(error => {
      logError(error, 'Token refresh')
      authStore.clear()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export const ensureFreshToken = async (): Promise<boolean> => {
  const authStore = useAuthStore()
  authStore.hydrate()

  if (!authStore.refreshToken) return false
  if (authStore.accessToken && !authStore.isAccessExpired) return true

  return (await refreshAccessToken()) !== null
}
