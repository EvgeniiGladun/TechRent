<template>
  <AuthCard title="Восстановление пароля" subtitle="Отправим код на номер, привязанный к аккаунту">
    <form class="stack" novalidate @submit.prevent="submit">
      <VInput
        v-model="phone"
        label="Телефон"
        mask="phone"
        placeholder="+7 (___) ___-__-__"
        autocomplete="tel"
        :error="phoneError"
      />
      <VAlert v-if="errorMessage && !phoneError" variant="danger">{{ errorMessage }}</VAlert>
      <VButton type="submit" block :loading="isLoading">Получить код</VButton>
    </form>

    <template #footer>
      <RouterLink :to="ROUTES.LOGIN">Вернуться ко входу</RouterLink>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/endpoints'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { CONFIRM_PURPOSE, ROUTES } from '@/constants'
import { flowStorage } from '@/utils/session-storage'
import { validatePhone } from '@/utils/validation'
import AuthCard from '@/components/AuthCard.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VInput from '@/components/ui/VInput.vue'

const router = useRouter()

const phone = ref('')
const phoneError = ref('')
const isLoading = ref(false)

const { handleError, clearError, errorMessage } = useErrorHandler({
  context: 'Recovery',
  handlers: {
    VALIDATION: error => {
      phoneError.value = error.fields.phone ?? ''
    },
  },
})

watch(phone, () => (phoneError.value = ''))

const submit = async () => {
  clearError()
  phoneError.value = validatePhone(phone.value) ?? ''
  if (phoneError.value) return

  isLoading.value = true
  try {
    const { session_id } = await authApi.recovery({ phone: phone.value })
    flowStorage.recovery.save({ phone: phone.value, session_id })
    await router.push({ path: ROUTES.CONFIRM, query: { purpose: CONFIRM_PURPOSE.RECOVERY } })
  } catch (error) {
    handleError(error)
  } finally {
    isLoading.value = false
  }
}
</script>
