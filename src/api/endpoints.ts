import { apiClient } from './client'
import {
  adminUserPageSchema,
  blockUsersResultSchema,
  myRentalsSchema,
  questionnaireResultSchema,
  rentalOrderSchema,
  equipmentListSchema,
  equipmentSchema,
  resetTokenSchema,
  sessionSchema,
  tokensSchema,
  userSchema,
  type BlockUsersRequest,
  type ConfirmRequest,
  type RentRequest,
  type LoginRequest,
  type NewPasswordRequest,
  type RecoveryRequest,
  type RegisterRequest,
} from './schemas'
import type { TableQuery } from '@/modules/data-table/table-query'

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post('/auth/login', body).then(({ data }) => sessionSchema.parse(data)),

  register: (body: RegisterRequest) =>
    apiClient.post('/auth/register', body).then(({ data }) => sessionSchema.parse(data)),

  recovery: (body: RecoveryRequest) =>
    apiClient.post('/auth/recovery', body).then(({ data }) => sessionSchema.parse(data)),

  resend: (sessionId: string) =>
    apiClient
      .post('/auth/resend', { session_id: sessionId })
      .then(({ data }) => sessionSchema.parse(data)),

  confirm: (body: ConfirmRequest) =>
    apiClient.post('/auth/confirm', body).then(({ data }) => tokensSchema.parse(data)),

  confirmRecovery: (body: ConfirmRequest) =>
    apiClient.post('/auth/confirm', body).then(({ data }) => resetTokenSchema.parse(data)),

  setNewPassword: (body: NewPasswordRequest) =>
    apiClient.post('/auth/recovery/password', body).then(() => undefined),

  logout: (refreshToken: string | null) =>
    apiClient.post('/auth/logout', { refresh_token: refreshToken }).then(() => undefined),
}

export const userApi = {
  me: () => apiClient.get('/me').then(({ data }) => userSchema.parse(data)),
}

export const equipmentApi = {
  list: () => apiClient.get('/equipment').then(({ data }) => equipmentListSchema.parse(data)),
  byId: (id: string) =>
    apiClient.get(`/equipment/${id}`).then(({ data }) => equipmentSchema.parse(data)),
  rent: (body: RentRequest) =>
    apiClient.post('/rentals', body).then(({ data }) => rentalOrderSchema.parse(data)),
}

export const rentalsApi = {
  get: () => apiClient.get('/rentals').then(({ data }) => myRentalsSchema.parse(data)),
}

export const questionnaireApi = {
  submit: (payload: Record<string, unknown>) =>
    apiClient
      .post('/questionnaire', payload)
      .then(({ data }) => questionnaireResultSchema.parse(data)),
}

export const adminApi = {
  // POST, а не GET: вложенные фильтры и диапазоны удобнее передавать телом запроса
  searchUsers: (query: TableQuery) =>
    apiClient
      .post('/admin/users/search', query)
      .then(({ data }) => adminUserPageSchema.parse(data)),

  blockUsers: (body: BlockUsersRequest) =>
    apiClient
      .post('/admin/users/block', body)
      .then(({ data }) => blockUsersResultSchema.parse(data)),
}
