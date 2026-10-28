export * from './dictionaries'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CONFIRM: '/confirm',
  RECOVERY: '/recovery',
  NEW_PASSWORD: '/recovery/new-password',
  STATUS: '/status',
  CATALOG: '/equipment',
  EQUIPMENT: '/equipment/:id',
  RENTALS: '/rentals',
  QUESTIONNAIRE: '/questionnaire',
  ADMIN_USERS: '/admin/users',
  FORBIDDEN: '/403',
  PATH_NOT_FOUND: '/:pathMatch(.*)*',
} as const

export const SCREEN_STATUS = {
  AUTHORIZED: 'authorized',
  REGISTERED: 'registered',
  BLOCKED: 'blocked',
  PASSWORD_CHANGED: 'password-changed',
} as const

export type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS]

export const CONFIRM_PURPOSE = {
  REGISTER: 'register',
  LOGIN: 'login',
  RECOVERY: 'recovery',
} as const

export type ConfirmPurpose = (typeof CONFIRM_PURPOSE)[keyof typeof CONFIRM_PURPOSE]

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const

export const AUTH_COOKIE = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  EXPIRES: 'token_expires',
  ACCOUNT: 'account_id',
} as const

export const OTP = {
  LENGTH: 5,
  RESEND_COOLDOWN_SEC: 30,
} as const

export const TOKEN = {
  REFRESH_BUFFER_SEC: 10,
  REFRESH_TIMEOUT_MS: 10 * TIME.SECOND,
  UNIX_TIMESTAMP_THRESHOLD: 1_000_000_000,
} as const

export const RENT_LIMITS = {
  UNQUALIFIED_YEARLY: 600_000,
  DEFAULT_MIN: 10_000,
} as const

export const RENT_CHIPS = [10_000, 50_000, 100_000, 300_000, 500_000] as const
