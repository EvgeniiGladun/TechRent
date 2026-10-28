import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/constants'
import { resolveAccess, safeRedirect, type AccessContext } from './access'

const guest: AccessContext = { isAuthenticated: false, role: null, targetPath: '/equipment/p-1' }
const renter: AccessContext = {
  isAuthenticated: true,
  role: 'RENTER',
  targetPath: '/admin/users',
}
const admin: AccessContext = { isAuthenticated: true, role: 'ADMIN', targetPath: '/admin/users' }

describe('resolveAccess', () => {
  it('гость на закрытой странице → логин с redirect обратно', () => {
    expect(resolveAccess({ requiresAuth: true }, guest)).toEqual({
      path: ROUTES.LOGIN,
      query: { redirect: '/equipment/p-1' },
    })
  })

  it('авторизованный на гостевой странице → домой по роли', () => {
    expect(resolveAccess({ guestOnly: true }, renter)).toEqual({ path: ROUTES.CATALOG })
    expect(resolveAccess({ guestOnly: true }, admin)).toEqual({ path: ROUTES.ADMIN_USERS })
  })

  it('роль не подходит → 403', () => {
    expect(resolveAccess({ requiresAuth: true, roles: ['ADMIN'] }, renter)).toEqual({
      path: ROUTES.FORBIDDEN,
    })
  })

  it('роль подходит → доступ разрешён', () => {
    expect(resolveAccess({ requiresAuth: true, roles: ['ADMIN'] }, admin)).toBeNull()
  })

  it('публичная страница доступна всем', () => {
    expect(resolveAccess({}, guest)).toBeNull()
    expect(resolveAccess({}, renter)).toBeNull()
  })
})

describe('safeRedirect', () => {
  it.each([
    ['/equipment/1', '/equipment/1'],
    ['//evil.example.com', '/status'],
    ['https://evil.example.com', '/status'],
    [undefined, '/status'],
    [['/a', '/b'], '/status'],
  ])('%s → %s', (input, expected) => {
    expect(safeRedirect(input, '/status')).toBe(expected)
  })
})
