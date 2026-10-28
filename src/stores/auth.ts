import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCookies } from '@/composables/useCookies'
import { AUTH_COOKIE, TIME } from '@/constants'
import type { ScreenStatus } from '@/constants'
import type { Tokens } from '@/api/schemas'
import { isTokenExpired, toExpirationTimestamp } from '@/utils/token'

const REFRESH_COOKIE_MAX_AGE = (30 * TIME.DAY) / TIME.SECOND

export const useAuthStore = defineStore('auth', () => {
  const cookies = useCookies()

  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const accountId = ref<string | null>(null)
  const expiresAt = ref<number | null>(null)
  const screenStatus = ref<ScreenStatus | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value || !!refreshToken.value)
  const isAccessExpired = computed(() => isTokenExpired(expiresAt.value))

  const setTokens = (tokens: Tokens): void => {
    const expires = toExpirationTimestamp(tokens.expires_in)

    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    accountId.value = tokens.account_id
    expiresAt.value = expires

    cookies.setMany(
      {
        [AUTH_COOKIE.ACCESS]: tokens.access_token,
        [AUTH_COOKIE.ACCOUNT]: tokens.account_id,
        [AUTH_COOKIE.EXPIRES]: expires != null ? String(expires) : undefined,
      },
      { maxAge: REFRESH_COOKIE_MAX_AGE }
    )
    cookies.set(AUTH_COOKIE.REFRESH, tokens.refresh_token, { maxAge: REFRESH_COOKIE_MAX_AGE })
  }

  const hydrate = (): void => {
    accessToken.value = cookies.get(AUTH_COOKIE.ACCESS) ?? null
    refreshToken.value = cookies.get(AUTH_COOKIE.REFRESH) ?? null
    accountId.value = cookies.get(AUTH_COOKIE.ACCOUNT) ?? null
    expiresAt.value = toExpirationTimestamp(cookies.get(AUTH_COOKIE.EXPIRES))
  }

  const setScreenStatus = (status: ScreenStatus | null): void => {
    screenStatus.value = status
  }

  const clear = (): void => {
    accessToken.value = null
    refreshToken.value = null
    accountId.value = null
    expiresAt.value = null
    cookies.remove(Object.values(AUTH_COOKIE))
  }

  return {
    accessToken,
    refreshToken,
    accountId,
    expiresAt,
    screenStatus,
    isAuthenticated,
    isAccessExpired,
    setTokens,
    hydrate,
    setScreenStatus,
    clear,
  }
})
