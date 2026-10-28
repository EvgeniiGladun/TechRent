import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from './client'
import { rawClient } from './raw-client'
import { ensureFreshToken } from './refresh'
import { accessTokens, refreshTokens } from './mock/db'
import { useAuthStore } from '@/stores/auth'

const signInAs = (userId: string) => {
  const authStore = useAuthStore()
  refreshTokens.set('rt_valid', userId)
  authStore.setTokens({
    access_token: 'at_stale',
    refresh_token: 'rt_valid',
    expires_in: 300,
    account_id: userId,
  })
}

describe('apiClient: refresh токена', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    accessTokens.clear()
    refreshTokens.clear()
    document.cookie.split(';').forEach(cookie => {
      document.cookie = `${cookie.split('=')[0]!.trim()}=; max-age=0; path=/`
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('параллельные 401 обновляют токен один раз и повторяют все запросы', async () => {
    signInAs('u-1')
    const refreshSpy = vi.spyOn(rawClient, 'post')

    const responses = await Promise.all([
      apiClient.get('/me'),
      apiClient.get('/equipment'),
      apiClient.get('/equipment/eq-101'),
    ])

    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).toHaveBeenCalledWith('/auth/refresh', { refresh_token: 'rt_valid' })
    expect(responses.map(response => response.status)).toEqual([200, 200, 200])
    expect(useAuthStore().accessToken).not.toBe('at_stale')
  })

  it('отозванный refresh-токен → сессия очищается, запрос падает с 401', async () => {
    signInAs('u-1')
    refreshTokens.clear()

    await expect(apiClient.get('/me')).rejects.toMatchObject({ response: { status: 401 } })
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('401 на логине — это неверный пароль, refresh не запускается', async () => {
    const refreshSpy = vi.spyOn(rawClient, 'post')

    await expect(
      apiClient.post('/auth/login', { phone: '+7 (900) 000-00-01', password: 'wrong' })
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(refreshSpy).not.toHaveBeenCalled()
  })

  it('ensureFreshToken: живой токен не обновляется, протухший — обновляется', async () => {
    signInAs('u-1')
    const refreshSpy = vi.spyOn(rawClient, 'post')

    expect(await ensureFreshToken()).toBe(true)
    expect(refreshSpy).not.toHaveBeenCalled()

    useAuthStore().setTokens({
      access_token: 'at_old',
      refresh_token: 'rt_valid',
      expires_in: 1,
      account_id: 'u-1',
    })
    expect(await ensureFreshToken()).toBe(true)
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })
})
