import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { ensureFreshToken } from '@/api/refresh'
import { logError } from '@/utils/error'
import { homeFor, resolveAccess, type AccessMeta } from './access'

declare module 'vue-router' {
  interface RouteMeta extends AccessMeta {
    title?: string
    layout?: 'auth' | 'app'
  }
}

const APP_NAME = 'TechRent'

const routes: RouteRecordRaw[] = [
  {
    path: ROUTES.HOME,
    redirect: () => {
      const userStore = useUserStore()
      return homeFor(userStore.roleKey)
    },
  },
  {
    path: ROUTES.LOGIN,
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Вход' },
  },
  {
    path: ROUTES.REGISTER,
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Регистрация' },
  },
  {
    path: ROUTES.CONFIRM,
    component: () => import('@/pages/ConfirmPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Подтверждение' },
  },
  {
    path: ROUTES.RECOVERY,
    component: () => import('@/pages/RecoveryPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Восстановление пароля' },
  },
  {
    path: ROUTES.NEW_PASSWORD,
    component: () => import('@/pages/NewPasswordPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Новый пароль' },
  },
  {
    path: ROUTES.STATUS,
    component: () => import('@/pages/StatusPage.vue'),
    meta: { layout: 'auth', title: 'Статус' },
  },
  {
    path: ROUTES.CATALOG,
    component: () => import('@/pages/CatalogPage.vue'),
    meta: { requiresAuth: true, roles: ['RENTER', 'ADMIN'], title: 'Каталог техники' },
  },
  {
    path: ROUTES.EQUIPMENT,
    component: () => import('@/pages/EquipmentPage.vue'),
    meta: { requiresAuth: true, roles: ['RENTER', 'ADMIN'], title: 'Техника' },
  },
  {
    path: ROUTES.RENTALS,
    component: () => import('@/pages/RentalsPage.vue'),
    meta: { requiresAuth: true, roles: ['RENTER'], title: 'Мои аренды' },
  },
  {
    path: ROUTES.QUESTIONNAIRE,
    component: () => import('@/pages/QuestionnairePage.vue'),
    meta: { requiresAuth: true, roles: ['RENTER'], title: 'Анкета арендатора' },
  },
  {
    path: ROUTES.ADMIN_USERS,
    component: () => import('@/pages/admin/UsersPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'], title: 'Пользователи' },
  },
  {
    path: ROUTES.FORBIDDEN,
    component: () => import('@/pages/ForbiddenPage.vue'),
    meta: { title: 'Доступ запрещён' },
  },
  {
    path: ROUTES.PATH_NOT_FOUND,
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'Страница не найдена' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach(async to => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const isAuthenticated = await ensureFreshToken()

  if (isAuthenticated && !userStore.user) {
    try {
      await userStore.load()
    } catch (error) {
      logError(error, 'Router')
      authStore.clear()
      userStore.reset()
    }
  }

  const redirect = resolveAccess(to.meta, {
    isAuthenticated: authStore.isAuthenticated && !!userStore.user,
    role: userStore.roleKey,
    targetPath: to.fullPath,
  })

  return redirect ?? true
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} — ${APP_NAME}` : APP_NAME
})

router.onError((error, to) => {
  if (error instanceof Error && error.message.includes('dynamically imported module')) {
    window.location.assign(to.fullPath)
    return
  }
  logError(error, 'Router')
})
