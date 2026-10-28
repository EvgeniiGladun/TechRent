import {
  USER_ROLE_DATA,
  LEGAL_TYPE_DATA,
  QUALIFICATION_DATA,
  VERIFICATION_DATA,
  EQUIPMENT_STATUS_DATA,
  PAYMENT_TYPE_DATA,
  RENTAL_STATUS_DATA,
} from '@/constants'
import { createDictionary, type DictionaryValue } from './dictionary'

export const userRole = createDictionary('userRole', USER_ROLE_DATA)
export const legalType = createDictionary('legalType', LEGAL_TYPE_DATA)
export const qualification = createDictionary('qualification', QUALIFICATION_DATA)
export const verification = createDictionary('verification', VERIFICATION_DATA)
export const equipmentStatus = createDictionary('equipmentStatus', EQUIPMENT_STATUS_DATA)
export const paymentType = createDictionary('paymentType', PAYMENT_TYPE_DATA)
export const rentalStatus = createDictionary('rentalStatus', RENTAL_STATUS_DATA)

export type PaymentTypeValue = DictionaryValue<typeof PAYMENT_TYPE_DATA>
