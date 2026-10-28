import { TOKEN } from '@/constants'

export const toExpirationTimestamp = (
  ttl: number | string | null | undefined,
  now: number = Math.floor(Date.now() / 1000)
): number | null => {
  if (ttl == null || ttl === '') return null

  const parsed = typeof ttl === 'string' ? parseInt(ttl, 10) : ttl
  if (Number.isNaN(parsed)) return null

  return parsed > TOKEN.UNIX_TIMESTAMP_THRESHOLD ? parsed : now + parsed
}

export const isTokenExpired = (
  expiresAt: number | null | undefined,
  now: number = Math.floor(Date.now() / 1000)
): boolean => {
  if (expiresAt == null) return true
  return now >= expiresAt - TOKEN.REFRESH_BUFFER_SEC
}
