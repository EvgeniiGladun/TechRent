import { MockHttpError } from './http-error'
import { applyTableQuery, type TableQuery } from '@/modules/data-table/table-query'
import { usersTableConfig } from '@/modules/admin-users/users-table'
import { addRental, rentalsByUser } from './rentals'
import {
  ACCESS_TTL_SEC,
  DEMO_CODE,
  MAX_CODE_ATTEMPTS,
  RESEND_COOLDOWN_SEC,
  accessTokens,
  equipment,
  refreshTokens,
  resetTokens,
  sessions,
  users,
  type MockSession,
  type MockUser,
} from './db'

export interface MockRequest {
  params: Record<string, string>
  body: Record<string, unknown>
  token: string | null
}

interface MockResult {
  status?: number
  data?: unknown
}

interface Route {
  method: 'GET' | 'POST'
  pattern: RegExp
  handler: (request: MockRequest) => MockResult | void | Promise<MockResult | void>
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`
const now = () => Date.now()

const publicUser = ({ password: _password, ...user }: MockUser) => user

const findUserByPhone = (phone: unknown) => users.find(user => user.phone === phone)

const requireUser = (token: string | null): MockUser => {
  const record = token ? accessTokens.get(token) : undefined
  if (!record || record.expiresAt < now()) {
    throw new MockHttpError(401, { message: 'Токен недействителен' })
  }
  const user = users.find(item => item.id === record.userId)
  if (!user) throw new MockHttpError(401, { message: 'Пользователь не найден' })
  return user
}

const requireAdmin = (token: string | null): MockUser => {
  const user = requireUser(token)
  if (user.role !== 'admin') throw new MockHttpError(403, { message: 'Недостаточно прав' })
  return user
}

const issueTokens = (userId: string) => {
  const access = uid('at')
  const refresh = uid('rt')
  accessTokens.set(access, { userId, expiresAt: now() + ACCESS_TTL_SEC * 1000 })
  refreshTokens.set(refresh, userId)
  return {
    access_token: access,
    refresh_token: refresh,
    expires_in: ACCESS_TTL_SEC,
    account_id: userId,
  }
}

const startSession = (session: Omit<MockSession, 'id' | 'attempts' | 'resendAvailableAt'>) => {
  const id = uid('ses')
  sessions.set(id, {
    ...session,
    id,
    attempts: 0,
    resendAvailableAt: now() + RESEND_COOLDOWN_SEC * 1000,
  })
  return { status: 201, data: { session_id: id, retry_after: RESEND_COOLDOWN_SEC } }
}

const getSession = (id: unknown): MockSession => {
  const session = typeof id === 'string' ? sessions.get(id) : undefined
  if (!session) throw new MockHttpError(404, { message: 'Сессия подтверждения не найдена' })
  return session
}

export const routes: Route[] = [
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    handler: ({ body }) => {
      const user = findUserByPhone(body.phone)
      if (!user || user.password !== body.password) {
        throw new MockHttpError(401, { message: 'Неверный телефон или пароль' })
      }
      if (user.is_blocked) {
        throw new MockHttpError(423, { message: 'Аккаунт заблокирован' })
      }
      return startSession({ phone: user.phone, purpose: 'login' })
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/register$/,
    handler: ({ body }) => {
      if (findUserByPhone(body.phone)) {
        throw new MockHttpError(409, {
          message: 'Пользователь с таким телефоном уже зарегистрирован',
          fields: { phone: ['Номер уже используется'] },
        })
      }
      return startSession({
        phone: String(body.phone),
        purpose: 'register',
        pendingUser: {
          phone: String(body.phone),
          email: String(body.email),
          password: String(body.password),
        },
      })
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/recovery$/,
    handler: ({ body }) => {
      const user = findUserByPhone(body.phone)
      if (!user) {
        throw new MockHttpError(404, {
          message: 'Аккаунт с таким номером не найден',
          fields: { phone: ['Аккаунт с таким номером не найден'] },
        })
      }
      return startSession({ phone: user.phone, purpose: 'recovery' })
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/resend$/,
    handler: ({ body }) => {
      const session = getSession(body.session_id)
      const waitMs = session.resendAvailableAt - now()
      if (waitMs > 0) {
        throw new MockHttpError(429, {
          message: 'Код уже отправлен',
          retry_after: Math.ceil(waitMs / 1000),
        })
      }
      session.attempts = 0
      session.resendAvailableAt = now() + RESEND_COOLDOWN_SEC * 1000
      return { data: { session_id: session.id, retry_after: RESEND_COOLDOWN_SEC } }
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/confirm$/,
    handler: ({ body }) => {
      const session = getSession(body.session_id)

      if (session.attempts >= MAX_CODE_ATTEMPTS) {
        throw new MockHttpError(429, {
          message: 'Превышено число попыток, запросите новый код',
          retry_after: Math.max(0, Math.ceil((session.resendAvailableAt - now()) / 1000)),
        })
      }

      if (body.code !== DEMO_CODE) {
        session.attempts += 1
        const left = MAX_CODE_ATTEMPTS - session.attempts
        throw new MockHttpError(422, {
          message: left > 0 ? `Неверный код. Осталось попыток: ${left}` : 'Попытки закончились',
          fields: { code: ['Неверный код'] },
        })
      }

      sessions.delete(session.id)

      if (session.purpose === 'recovery') {
        const user = findUserByPhone(session.phone)!
        const resetToken = uid('rst')
        resetTokens.set(resetToken, user.id)
        return { data: { reset_token: resetToken } }
      }

      if (session.purpose === 'register' && session.pendingUser) {
        const user: MockUser = {
          ...session.pendingUser,
          id: uid('u'),
          name: 'Новый пользователь',
          role: 'renter',
          legal_type: 'FL',
          qualification: 'N',
          verification: 'N',
          balance: 0,
          rented_this_year: 0,
          is_blocked: false,
        }
        users.push(user)
        return { status: 201, data: issueTokens(user.id) }
      }

      return { data: issueTokens(findUserByPhone(session.phone)!.id) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/recovery\/password$/,
    handler: ({ body }) => {
      const userId = resetTokens.get(String(body.reset_token))
      const user = users.find(item => item.id === userId)
      if (!user) throw new MockHttpError(401, { message: 'Ссылка восстановления устарела' })

      user.password = String(body.password)
      resetTokens.delete(String(body.reset_token))
      return { status: 204 }
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/refresh$/,
    handler: ({ body }) => {
      const token = String(body.refresh_token)
      const userId = refreshTokens.get(token)
      if (!userId) throw new MockHttpError(401, { message: 'Refresh token отозван' })

      refreshTokens.delete(token)
      return { data: issueTokens(userId) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/logout$/,
    handler: ({ body, token }) => {
      if (token) accessTokens.delete(token)
      refreshTokens.delete(String(body.refresh_token))
      return { status: 204 }
    },
  },
  {
    method: 'GET',
    pattern: /^\/me$/,
    handler: ({ token }) => ({ data: publicUser(requireUser(token)) }),
  },
  {
    method: 'GET',
    pattern: /^\/equipment$/,
    handler: ({ token }) => {
      requireUser(token)
      return { data: equipment }
    },
  },
  {
    method: 'GET',
    pattern: /^\/equipment\/(?<id>[\w-]+)$/,
    handler: ({ token, params }) => {
      requireUser(token)
      const machine = equipment.find(item => item.id === params.id)
      if (!machine) throw new MockHttpError(404, { message: 'Техника не найдена' })
      return { data: machine }
    },
  },
  {
    method: 'POST',
    pattern: /^\/rentals$/,
    handler: ({ token, body }) => {
      const user = requireUser(token)
      const machine = equipment.find(item => item.id === body.equipment_id)
      const amount = Number(body.amount)

      if (!machine) throw new MockHttpError(404, { message: 'Техника не найдена' })
      if (amount > user.balance) {
        throw new MockHttpError(422, {
          message: 'Недостаточно залога',
          fields: { amount: ['Недостаточно залога на счёте'] },
        })
      }
      if (amount > machine.fleet_value - machine.rented_value) {
        throw new MockHttpError(422, {
          message: 'Столько свободной техники в парке нет',
          fields: { amount: ['Столько свободной техники в парке нет'] },
        })
      }

      // Залог блокируется на счёте на время аренды
      user.balance -= amount
      user.rented_this_year += amount
      machine.rented_value += amount
      machine.renters_count += 1
      if (machine.rented_value >= machine.fleet_value) machine.status = 'rented_out'
      addRental(user.id, { id: uid('r'), equipment: machine, amount, monthsAgo: 0 })

      return {
        status: 201,
        data: {
          id: uid('ord'),
          equipment_id: machine.id,
          amount,
          created_at: new Date().toISOString(),
        },
      }
    },
  },
  {
    method: 'GET',
    pattern: /^\/rentals$/,
    handler: ({ token }) => {
      const user = requireUser(token)
      return { data: rentalsByUser.get(user.id) ?? { rentals: [], payments: [] } }
    },
  },
  {
    method: 'POST',
    pattern: /^\/questionnaire$/,
    handler: ({ token, body }) => {
      const user = requireUser(token)
      const passport = body.passport as Record<string, string> | undefined

      // Проверки, которые может сделать только сервер: сверка с реестрами и т. п.
      const fields: Record<string, string[]> = {}
      if (body.inn === '000000000000') fields.inn = ['ИНН не найден в реестре ФНС']
      if (passport?.passport_number?.replace(/\s/g, '') === '0000000000') {
        fields.passport_number = ['Паспорт недействителен']
      }
      if (Object.keys(fields).length) {
        throw new MockHttpError(422, { message: 'Проверьте данные анкеты', fields })
      }

      if (user.verification !== 'C') user.verification = 'P'
      return { status: 201, data: { verification: user.verification } }
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/users\/search$/,
    handler: ({ token, body }) => {
      requireAdmin(token)
      const page = applyTableQuery(
        users.map(publicUser),
        body as unknown as TableQuery,
        usersTableConfig
      )
      return { data: page }
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/users\/block$/,
    handler: ({ token, body }) => {
      const admin = requireAdmin(token)
      const ids = new Set(Array.isArray(body.ids) ? body.ids.map(String) : [])

      if (ids.has(admin.id)) {
        throw new MockHttpError(422, { message: 'Нельзя заблокировать собственный аккаунт' })
      }

      const targets = users.filter(user => ids.has(user.id))
      targets.forEach(user => {
        user.is_blocked = Boolean(body.blocked)
      })
      return { data: { updated: targets.length } }
    },
  },
]
