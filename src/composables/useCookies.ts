export interface CookieOptions {
  path?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
  maxAge?: number
}

const DEFAULT_OPTIONS: CookieOptions = { path: '/', sameSite: 'Lax' }

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

export const useCookies = () => {
  const get = (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapeRegExp(name)}=([^;]*)`))
    return match?.[1] ? decodeURIComponent(match[1]) : undefined
  }

  const set = (name: string, value: string, options: CookieOptions = {}): void => {
    if (typeof document === 'undefined') return
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]

    if (opts.path) parts.push(`path=${opts.path}`)
    if (opts.maxAge != null) parts.push(`max-age=${opts.maxAge}`)
    if (opts.sameSite) parts.push(`samesite=${opts.sameSite}`)
    if (opts.secure) parts.push('secure')

    document.cookie = parts.join('; ')
  }

  const setMany = (cookies: Record<string, string | undefined>, options?: CookieOptions): void => {
    Object.entries(cookies).forEach(([name, value]) => {
      if (value?.trim()) set(name, value, options)
    })
  }

  const remove = (names: readonly string[]): void => {
    if (typeof document === 'undefined') return
    names.forEach(name => {
      document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0`
    })
  }

  return { get, set, setMany, remove }
}
