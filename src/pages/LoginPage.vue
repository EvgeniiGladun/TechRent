<template>
  <AuthCard title="Вход" subtitle="Введите телефон и пароль — мы отправим код подтверждения">
    <form class="stack" novalidate @submit.prevent="submit">
      <VInput
        v-model="form.phone"
        label="Телефон"
        mask="phone"
        placeholder="+7 (___) ___-__-__"
        autocomplete="tel"
        :error="errors.phone"
      />
      <VInput
        v-model="form.password"
        label="Пароль"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
      />

      <VAlert v-if="errorMessage && !hasFieldError" variant="danger">{{ errorMessage }}</VAlert>

      <VButton type="submit" block :loading="isLoading">Получить код</VButton>
      <RouterLink :to="ROUTES.RECOVERY" class="small">Забыли пароль?</RouterLink>
    </form>

    <DemoAccounts @pick="fillDemo" />

    <template #footer>
      <span class="muted">Нет аккаунта?</span>
      <RouterLink :to="ROUTES.REGISTER">Зарегистрироваться</RouterLink>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { CONFIRM_PURPOSE, HTTP_STATUS, ROUTES, SCREEN_STATUS } from '@/constants'
import { flowStorage } from '@/utils/session-storage'
import { validateForm, validatePassword, validatePhone } from '@/utils/validation'
import AuthCard from '@/components/AuthCard.vue'
import DemoAccounts from '@/components/DemoAccounts.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VInput from '@/components/ui/VInput.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({ phone: '', password: '' })
const errors = reactive({ phone: '', password: '' })
const isLoading = ref(false)

const { handleError, clearError, errorMessage } = useErrorHandler({
  context: 'Login',
  statusHandlers: {
    [HTTP_STATUS.UNAUTHORIZED]: error => {
      errors.password = error.message
    },
    [HTTP_STATUS.LOCKED]: () => {
      authStore.setScreenStatus(SCREEN_STATUS.BLOCKED)
      router.push(ROUTES.STATUS)
    },
  },
  handlers: {
    VALIDATION: error => Object.assign(errors, error.fields),
  },
})

const hasFieldError = computed(() => !!errors.phone || !!errors.password)

watch(
  () => form.phone,
  () => (errors.phone = '')
)
watch(
  () => form.password,
  () => (errors.password = '')
)

const fillDemo = (phone: string, password: string) => {
  form.phone = phone
  form.password = password
}

const submit = async () => {
  clearError()
  const result = validateForm(form, {
    phone: validatePhone,
    password: value => validatePassword(value),
  })
  Object.assign(errors, result.errors)
  if (!result.valid) return

  isLoading.value = true
  try {
    const { session_id } = await authApi.login({ ...form })
    flowStorage.login.save({ phone: form.phone, session_id })
    await router.push({
      path: ROUTES.CONFIRM,
      query: { purpose: CONFIRM_PURPOSE.LOGIN, redirect: route.query.redirect },
    })
  } catch (error) {
    handleError(error)
  } finally {
    isLoading.value = false
  }
}
</script>
