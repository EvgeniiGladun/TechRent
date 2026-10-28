import type { Equipment, User } from '../schemas'

export interface MockUser extends User {
  password: string
}

export interface MockSession {
  id: string
  phone: string
  purpose: 'login' | 'register' | 'recovery'
  attempts: number
  resendAvailableAt: number
  pendingUser?: Pick<MockUser, 'phone' | 'email' | 'password'>
}

export const DEMO_CODE = '12345'
export const DEMO_PASSWORD = 'Demo123!'
export const ACCESS_TTL_SEC = 30
export const MAX_CODE_ATTEMPTS = 3
export const RESEND_COOLDOWN_SEC = 30

const baseUser = {
  password: DEMO_PASSWORD,
  verification: 'C',
  is_blocked: false,
} as const

export const users: MockUser[] = [
  {
    ...baseUser,
    id: 'u-1',
    name: 'Анна Смирнова',
    phone: '+7 (900) 000-00-01',
    email: 'anna@example.com',
    role: 'renter',
    legal_type: 'FL',
    qualification: 'N',
    balance: 750_000,
    rented_this_year: 200_000,
  },
  {
    ...baseUser,
    id: 'u-2',
    name: 'ООО «Вектор»',
    phone: '+7 (900) 000-00-02',
    email: 'vector@example.com',
    role: 'renter',
    legal_type: 'LE',
    qualification: 'N',
    balance: 5_000_000,
    rented_this_year: 1_500_000,
  },
  {
    ...baseUser,
    id: 'u-3',
    name: 'Илья Админов',
    phone: '+7 (900) 000-00-03',
    email: 'admin@example.com',
    role: 'admin',
    legal_type: 'FL',
    qualification: 'Y',
    balance: 0,
    rented_this_year: 0,
  },
  {
    ...baseUser,
    id: 'u-4',
    name: 'Пётр Заблокированный',
    phone: '+7 (900) 000-00-04',
    email: 'blocked@example.com',
    role: 'renter',
    legal_type: 'FL',
    qualification: 'N',
    balance: 10_000,
    rented_this_year: 0,
    is_blocked: true,
  },
  {
    ...baseUser,
    id: 'u-5',
    name: 'Ольга Новикова',
    phone: '+7 (900) 000-00-05',
    email: 'olga@example.com',
    role: 'renter',
    legal_type: 'FL',
    qualification: 'N',
    verification: 'P',
    balance: 100_000,
    rented_this_year: 0,
  },
]

const MALE_NAMES = ['Алексей', 'Дмитрий', 'Сергей', 'Андрей', 'Максим']
const FEMALE_NAMES = ['Мария', 'Елена', 'Наталья', 'Ирина', 'Дарья']
// Фамилия в мужской форме; женская получается добавлением «а»
const LAST_NAMES = ['Иванов', 'Петров', 'Соколов', 'Кузнецов', 'Попов', 'Васильев', 'Морозов']
const COMPANIES = ['ООО «Северный ветер»', 'ООО «Гранит»', 'ИП Белов', 'ООО «Атлас»', 'ИП Зайцева']

/** Детерминированный набор пользователей, чтобы в админке было что фильтровать и листать */
const generatedUsers: MockUser[] = Array.from({ length: 42 }, (_, index) => {
  const number = index + 6
  const isCompany = index % 6 === 0
  const name = isCompany
    ? COMPANIES[index % COMPANIES.length]!
    : index % 2
      ? `${FEMALE_NAMES[index % FEMALE_NAMES.length]} ${LAST_NAMES[(index * 3) % LAST_NAMES.length]}а`
      : `${MALE_NAMES[index % MALE_NAMES.length]} ${LAST_NAMES[(index * 3) % LAST_NAMES.length]}`

  return {
    ...baseUser,
    id: `u-${number}`,
    name,
    phone: `+7 (901) ${String(100 + index).padStart(3, '0')}-${String(10 + (index % 90)).padStart(2, '0')}-${String(number).padStart(2, '0')}`,
    email: `user${number}@example.com`,
    role: index % 9 === 4 ? 'owner' : 'renter',
    legal_type: isCompany ? 'LE' : index % 5 === 2 ? 'IE' : 'FL',
    qualification: index % 7 === 3 ? 'Y' : 'N',
    verification: (['C', 'C', 'P', 'C', 'N', 'C', 'R'] as const)[index % 7]!,
    balance: ((index * 37_919) % 2_000_000) + 5_000,
    rented_this_year: (index * 21_313) % 600_000,
    is_blocked: index % 11 === 7,
  }
})

users.push(...generatedUsers)

export const equipment: Equipment[] = [
  {
    id: 'eq-101',
    title: 'Экскаватор-погрузчик JCB 3CX',
    owner: 'ООО «СтройТехПарк»',
    description: 'Для земляных работ и погрузки сыпучих грузов. Доставка трейлером по области.',
    status: 'available',
    payment_type: 'annuity',
    rate: 21,
    term_months: 12,
    fleet_value: 3_000_000,
    rented_value: 1_840_000,
    min_amount: 10_000,
    renters_count: 64,
  },
  {
    id: 'eq-102',
    title: 'Вилочный погрузчик Toyota 8FD25',
    owner: 'ООО «Логистика Плюс»',
    description: 'Дизельный, грузоподъёмность 2,5 т. Подходит для склада и открытой площадки.',
    status: 'available',
    payment_type: 'bullet',
    rate: 18.5,
    term_months: 6,
    fleet_value: 8_000_000,
    rented_value: 7_650_000,
    min_amount: 50_000,
    renters_count: 112,
  },
  {
    id: 'eq-103',
    title: 'Автокран «Галичанин» 25 т',
    owner: 'ООО «ТехПром»',
    description: 'Стрела 28 м, техника проходит ТО у арендодателя. Машинист — по запросу.',
    status: 'available',
    payment_type: 'annuity',
    rate: 24,
    term_months: 24,
    fleet_value: 15_000_000,
    rented_value: 2_100_000,
    min_amount: null,
    renters_count: 23,
  },
  {
    id: 'eq-104',
    title: 'Мини-экскаватор Bobcat E35',
    owner: 'ООО «Быстро»',
    description: 'Весь парк сейчас в аренде, идут платежи по графику.',
    status: 'rented_out',
    payment_type: 'annuity',
    rate: 19,
    term_months: 18,
    fleet_value: 5_000_000,
    rented_value: 5_000_000,
    min_amount: 10_000,
    renters_count: 201,
  },
]

export const sessions = new Map<string, MockSession>()
export const accessTokens = new Map<string, { userId: string; expiresAt: number }>()
export const refreshTokens = new Map<string, string>()
export const resetTokens = new Map<string, string>()
