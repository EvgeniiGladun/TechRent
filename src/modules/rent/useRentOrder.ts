import { computed, ref, watch, type Ref } from 'vue'
import type { Equipment, User } from '@/api/schemas'
import { useRentMutation } from '@/api/queries'
import { useUserStore } from '@/stores/user'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { formatAmountInput, parseAmount } from '@/utils/format'
import { calcLimits, isRentPossible, validateAmount } from './limits'
import { buildSchedule } from './schedule'

export const useRentOrder = (equipment: Ref<Equipment>, user: Ref<User>) => {
  const userStore = useUserStore()
  const { mutateAsync, isPending } = useRentMutation()
  const { handleError, clearError, errorMessage, fieldErrors } = useErrorHandler({
    context: 'Rent',
  })

  const limits = computed(() =>
    calcLimits({
      equipmentMin: equipment.value.min_amount,
      fleetValue: equipment.value.fleet_value,
      rentedValue: equipment.value.rented_value,
      balance: user.value.balance,
      rentedThisYear: user.value.rented_this_year,
      hasYearlyLimit: userStore.hasYearlyLimit,
    })
  )

  const amountInput = ref(formatAmountInput(limits.value.min))
  const touched = ref(false)
  const isSuccess = ref(false)

  const amount = computed(() => parseAmount(amountInput.value))
  const amountError = computed(() => {
    if (!touched.value) return ''
    return validateAmount(amountInput.value, limits.value) ?? fieldErrors.value.amount ?? ''
  })
  const canSubmit = computed(
    () => isRentPossible(limits.value) && !validateAmount(amountInput.value, limits.value)
  )

  const debouncedAmount = useDebouncedRef(amount, 250)
  const schedule = computed(() => {
    const value = debouncedAmount.value
    if (validateAmount(value, limits.value)) return null
    return buildSchedule({
      amount: value,
      rate: equipment.value.rate,
      termMonths: equipment.value.term_months,
      type: equipment.value.payment_type,
    })
  })

  watch(amountInput, () => {
    touched.value = true
    isSuccess.value = false
    clearError()
  })

  const setAmount = (value: number) => {
    amountInput.value = formatAmountInput(value)
  }

  const submit = async (): Promise<boolean> => {
    touched.value = true
    if (!canSubmit.value) return false

    try {
      await mutateAsync({ equipment_id: equipment.value.id, amount: amount.value })
      await userStore.load(true)
      isSuccess.value = true
      return true
    } catch (error) {
      handleError(error)
      return false
    }
  }

  return {
    limits,
    amountInput,
    amount,
    amountError,
    schedule,
    canSubmit,
    isPending,
    isSuccess,
    errorMessage,
    setAmount,
    submit,
  }
}
