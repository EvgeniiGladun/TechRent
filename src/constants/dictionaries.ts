export const USER_ROLE_DATA = {
  RENTER: { value: 'renter', text: 'Арендатор' },
  OWNER: { value: 'owner', text: 'Арендодатель' },
  ADMIN: { value: 'admin', text: 'Администратор' },
} as const

export const LEGAL_TYPE_DATA = {
  INDIVIDUAL: { value: 'FL', text: 'Физическое лицо' },
  ENTREPRENEUR: { value: 'IE', text: 'Индивидуальный предприниматель' },
  COMPANY: { value: 'LE', text: 'Юридическое лицо' },
} as const

export const QUALIFICATION_DATA = {
  NO: { value: 'N', text: 'Без подтверждения' },
  YES: { value: 'Y', text: 'Проверенный арендатор' },
  PENDING: { value: 'W', text: 'Статус на проверке' },
} as const

export const VERIFICATION_DATA = {
  NONE: { value: 'N', text: 'Не верифицирован' },
  PENDING: { value: 'P', text: 'На проверке' },
  CONFIRMED: { value: 'C', text: 'Верифицирован' },
  REJECTED: { value: 'R', text: 'Отклонено' },
} as const

export const EQUIPMENT_STATUS_DATA = {
  AVAILABLE: { value: 'available', text: 'Есть в наличии' },
  RENTED_OUT: { value: 'rented_out', text: 'Весь парк в аренде' },
  RETIRED: { value: 'retired', text: 'Снята с аренды' },
} as const

export const RENTAL_STATUS_DATA = {
  ACTIVE: { value: 'active', text: 'Идут платежи' },
  CLOSED: { value: 'closed', text: 'Выкуплена' },
} as const

export const PAYMENT_TYPE_DATA = {
  ANNUITY: { value: 'annuity', text: 'Равные платежи' },
  BULLET: { value: 'bullet', text: 'Выкуп в конце срока' },
} as const
