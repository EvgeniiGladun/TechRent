import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { queryClient } from '@/api/query-client'
import { queryKeys } from '@/api/queries'
import { userApi } from '@/api/endpoints'
import type { User } from '@/api/schemas'
import { legalType, qualification, userRole, verification } from '@/utils/dictionaries'
import type { DictionaryKey } from '@/utils/dictionary'
import { TIME, type USER_ROLE_DATA } from '@/constants'

export type UserRoleKey = DictionaryKey<typeof USER_ROLE_DATA>

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

  const roleKey = computed<UserRoleKey | null>(() => userRole.keyOf(user.value?.role))
  const isAdmin = computed(() => userRole.is(user.value?.role, 'ADMIN'))
  const isRenter = computed(() => userRole.is(user.value?.role, 'RENTER'))
  const isIndividual = computed(() => legalType.is(user.value?.legal_type, 'INDIVIDUAL'))
  const isQualified = computed(() => qualification.is(user.value?.qualification, 'YES'))
  const isVerified = computed(() => verification.is(user.value?.verification, 'CONFIRMED'))

  const hasYearlyLimit = computed(() => isIndividual.value && !isQualified.value)

  const rentBlockReason = computed<string | null>(() => {
    if (!user.value) return 'Профиль не загружен'
    if (!isRenter.value) return 'Оформить аренду могут только арендаторы'
    if (!isVerified.value) return 'Пройдите верификацию, чтобы арендовать технику'
    if (user.value.balance <= 0) return 'Внесите залог на счёт, чтобы арендовать технику'
    return null
  })

  const load = async (force = false): Promise<User> => {
    const loaded = await queryClient.fetchQuery({
      queryKey: queryKeys.me,
      queryFn: userApi.me,
      staleTime: force ? 0 : 5 * TIME.MINUTE,
    })
    user.value = loaded
    return loaded
  }

  const setUser = (value: User | null): void => {
    user.value = value
  }

  const reset = (): void => {
    user.value = null
    queryClient.removeQueries({ queryKey: queryKeys.me })
  }

  return {
    user,
    roleKey,
    isAdmin,
    isRenter,
    isIndividual,
    isQualified,
    isVerified,
    hasYearlyLimit,
    rentBlockReason,
    load,
    setUser,
    reset,
  }
})
