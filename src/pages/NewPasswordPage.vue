<template>
  <AuthCard title="Новый пароль" subtitle="Придумайте пароль, которого не было раньше">
    <form class="stack" novalidate @submit.prevent="submit">
      <VInput
        v-model="form.password"
        label="Новый пароль"
        type="password"
        autocomplete="new-password"
        hint="Минимум 8 символов: заглавная и строчная буква, цифра и спецсимвол"
        :error="errors.password"
      />
      <VInput
        v-model="form.passwordConfirm"
        label="Повторите пароль"
        type="password"
        autocomplete="new-password"
        :error="errors.passwordConfirm"
      />
      <VAlert v-if="errorMessage" variant="danger">{{ errorMessage }}</VAlert>
      <VButton type="submit" block :loading="isLoading">Сохранить</VButton>
    </form>
  </AuthCard>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { HTTP_STATUS, ROUTES, SCREEN_STATUS } from '@/constants'
import { clearAllFlows, flowStorage } from '@/utils/session-storage'
import { validateForm, validatePassword, validatePasswordMatch } from '@/utils/validation'
import AuthCard from '@/components/AuthCard.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VInput from '@/components/ui/VInput.vue'

const router = useRouter()
const authStore = useAuthStore()
const recovery = flowStorage.recovery.get()

const form = reactive({ password: '', passwordConfirm: '' })
const errors = reactive({ password: '', passwordConfirm: '' })
const isLoading = ref(false)

const { handleError, clearError, errorMessage } = useErrorHandler({
  context: 'NewPassword',
  statusHandlers: {
    [HTTP_STATUS.UNAUTHORIZED]: () => {
      clearAllFlows()
      router.replace(ROUTES.RECOVERY)
    },
  },
})

const submit = async () => {
  if (!recovery?.reset_token) return

  clearError()
  const result = validateForm(form, {
    password: value => validatePassword(value, { minLength: 8, strict: true }),
    passwordConfirm: (value, values) => validatePasswordMatch(values.password, value),
  })
  Object.assign(errors, result.errors)
  if (!result.valid) return

  isLoading.value = true
  try {
    await authApi.setNewPassword({ reset_token: recovery.reset_token, password: form.password })
    clearAllFlows()
    authStore.setScreenStatus(SCREEN_STATUS.PASSWORD_CHANGED)
    await router.push(ROUTES.STATUS)
  } catch (error) {
    handleError(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!recovery?.reset_token) router.replace(ROUTES.RECOVERY)
})
</script>
