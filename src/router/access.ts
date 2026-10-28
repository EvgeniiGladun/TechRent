import type { RouteLocationRaw } from 'vue-router'
import { ROUTES } from '@/constants'
import type { UserRoleKey } from '@/stores/user'

export interface AccessMeta {
  requiresAuth?: boolean
  guestOnly?: boolean
  roles?: readonly UserRoleKey[]
}

export interface AccessContext {
  isAuthenticated: boolean
  role: UserRoleKey | null
  targetPath: string
}

export const homeFor = (role: UserRoleKey | null): string =>
  role === 'ADMIN' ? ROUTES.ADMIN_USERS : ROUTES.CATALOG

export const resolveAccess = (meta: AccessMeta, ctx: AccessContext): RouteLocationRaw | null => {
  if (meta.requiresAuth && !ctx.isAuthenticated) {
    return { path: ROUTES.LOGIN, query: { redirect: ctx.targetPath } }
  }

  if (meta.guestOnly && ctx.isAuthenticated) {
    return { path: homeFor(ctx.role) }
  }

  if (meta.roles?.length && (!ctx.role || !meta.roles.includes(ctx.role))) {
    return { path: ROUTES.FORBIDDEN }
  }

  return null
}

export const safeRedirect = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
