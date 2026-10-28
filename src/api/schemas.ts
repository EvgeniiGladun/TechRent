import { z } from 'zod'
import {
  USER_ROLE_DATA,
  LEGAL_TYPE_DATA,
  QUALIFICATION_DATA,
  VERIFICATION_DATA,
  EQUIPMENT_STATUS_DATA,
  PAYMENT_TYPE_DATA,
  RENTAL_STATUS_DATA,
} from '@/constants'
import type { DictionaryItem } from '@/utils/dictionary'

const enumOf = <D extends Record<string, DictionaryItem>>(data: D) =>
  z.enum(
    Object.values(data).map(item => item.value) as [D[keyof D]['value'], ...D[keyof D]['value'][]]
  )

export const sessionSchema = z.object({
  session_id: z.string(),
  retry_after: z.number().int().nonnegative(),
})

export const tokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int().positive(),
  account_id: z.string(),
})

export const resetTokenSchema = z.object({
  reset_token: z.string(),
})

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().email(),
  role: enumOf(USER_ROLE_DATA),
  legal_type: enumOf(LEGAL_TYPE_DATA),
  qualification: enumOf(QUALIFICATION_DATA),
  verification: enumOf(VERIFICATION_DATA),
  balance: z.number().nonnegative(),
  rented_this_year: z.number().nonnegative(),
  is_blocked: z.boolean(),
})

export const equipmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  owner: z.string(),
  description: z.string(),
  status: enumOf(EQUIPMENT_STATUS_DATA),
  payment_type: enumOf(PAYMENT_TYPE_DATA),
  rate: z.number().positive(),
  term_months: z.number().int().positive(),
  fleet_value: z.number().positive(),
  rented_value: z.number().nonnegative(),
  min_amount: z.number().positive().nullable(),
  renters_count: z.number().int().nonnegative(),
})

export const equipmentListSchema = z.array(equipmentSchema)

export const rentalOrderSchema = z.object({
  id: z.string(),
  equipment_id: z.string(),
  amount: z.number().positive(),
  created_at: z.string(),
})

export const rentalSchema = z.object({
  id: z.string(),
  equipment_id: z.string(),
  title: z.string(),
  owner: z.string(),
  status: enumOf(RENTAL_STATUS_DATA),
  amount: z.number().positive(),
  rate: z.number().positive(),
  total_rent: z.number().nonnegative(),
  started_at: z.string(),
  ends_at: z.string(),
})

export const paymentSchema = z.object({
  id: z.string(),
  rental_id: z.string(),
  date: z.string(),
  amount: z.number().positive(),
  paid_at: z.string().nullable(),
})

export const myRentalsSchema = z.object({
  rentals: z.array(rentalSchema),
  payments: z.array(paymentSchema),
})

export const questionnaireResultSchema = z.object({
  verification: enumOf(VERIFICATION_DATA),
})

export const adminUserPageSchema = z.object({
  items: z.array(userSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pages: z.number().int().positive(),
})

export const blockUsersResultSchema = z.object({
  updated: z.number().int().nonnegative(),
})

export type Tokens = z.infer<typeof tokensSchema>
export type User = z.infer<typeof userSchema>
export type Equipment = z.infer<typeof equipmentSchema>
export type Rental = z.infer<typeof rentalSchema>
export type Payment = z.infer<typeof paymentSchema>
export type MyRentals = z.infer<typeof myRentalsSchema>

export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  phone: string
  email: string
  password: string
}

export interface ConfirmRequest {
  session_id: string
  code: string
}

export interface RecoveryRequest {
  phone: string
}

export interface NewPasswordRequest {
  reset_token: string
  password: string
}

export interface RentRequest {
  equipment_id: string
  amount: number
}

export interface BlockUsersRequest {
  ids: string[]
  blocked: boolean
}
