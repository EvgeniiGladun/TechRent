import type { User } from '@/api/schemas'
import type { RangeFilter, TableConfig } from '@/modules/data-table/table-query'

export const USER_STATUS_FILTER = {
  ACTIVE: { value: 'active', label: 'Активен' },
  BLOCKED: { value: 'blocked', label: 'Заблокирован' },
} as const

export const USERS_TABLE_FILTERS = {
  role: '',
  legal_type: '',
  verification: '',
  status: '',
  balance: { from: null, to: null } as RangeFilter,
}

export const userStatusOf = (user: Pick<User, 'is_blocked'>): string =>
  user.is_blocked ? USER_STATUS_FILTER.BLOCKED.value : USER_STATUS_FILTER.ACTIVE.value

/**
 * Правила выборки пользователей. На настоящем проекте это делает бэкенд,
 * здесь их выполняет mock-сервер, а фронт отправляет только TableQuery.
 */
export const usersTableConfig: TableConfig<User> = {
  searchIn: [user => user.name, user => user.phone, user => user.email],
  filters: {
    role: { type: 'equals', get: user => user.role },
    legal_type: { type: 'equals', get: user => user.legal_type },
    verification: { type: 'equals', get: user => user.verification },
    status: { type: 'equals', get: userStatusOf },
    balance: { type: 'range', get: user => user.balance },
  },
  sortBy: {
    name: user => user.name,
    balance: user => user.balance,
    rented_this_year: user => user.rented_this_year,
  },
}
