<template>
  <AuthCard
    title="Регистрация"
    subtitle="Аккаунт арендатора. После подтверждения телефона можно пройти верификацию"
  >
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
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="errors.email"
      />
      <VInput
        v-model="form.password"
        label="Пароль"
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

      <VAlert v-if="errorMessage && !hasFieldError" variant="danger">{{ errorMessage }}</VAlert>

      <VButton type="submit" block :loading="isLoading">Зарегистрироваться</VButton>
    </form>

    <template #footer>
      <span class="muted">Уже есть аккаунт?</span>
      <RouterLink :to="ROUTES.LOGIN">Войти</RouterLink>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/endpoints'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { CONFIRM_PURPOSE, ROUTES } from '@/constants'
import { flowStorage } from '@/utils/session-storage'
import {
  validateEmail,
  validateForm,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
} from '@/utils/validation'
import AuthCard from '@/components/AuthCard.vue'
import VAlert from '@/components/ui/VAlert.vue'
import VButton from '@/components/ui/VButton.vue'
import VInput from '@/components/ui/VInput.vue'

type Field = 'phone' | 'email' | 'password' | 'passwordConfirm'

const router = useRouter()

const form = reactive<Record<Field, string>>({
  phone: '',
  email: '',
  password: '',
  passwordConfirm: '',
})
const errors = reactive<Record<Field, string>>({
  phone: '',
  email: '',
  password: '',
  passwordConfirm: '',
})
const isLoading = ref(false)

const { handleError, clearError, errorMessage } = useErrorHandler({
  context: 'Register',
  handlers: { VALIDATION: error => Object.assign(errors, error.fields) },
})

const hasFieldError = computed(() => Object.values(errors).some(Boolean))

;(Object.keys(form) as Field[]).forEach(field => {
  watch(
    () => form[field],
    () => (errors[field] = '')
  )
})

const submit = async () => {
  clearError()
  const result = validateForm(form, {
    phone: validatePhone,
    email: validateEmail,
    password: value => validatePassword(value, { minLength: 8, strict: true }),
    passwordConfirm: (value, values) => validatePasswordMatch(values.password, value),
  })
  Object.assign(errors, result.errors)
  if (!result.valid) return

  isLoading.value = true
  try {
    const { session_id } = await authApi.register({
      phone: form.phone,
      email: form.email.trim(),
      password: form.password,
    })
    flowStorage.register.save({ phone: form.phone, session_id })
    await router.push({ path: ROUTES.CONFIRM, query: { purpose: CONFIRM_PURPOSE.REGISTER } })
  } catch (error) {
    handleError(error)
  } finally {
    isLoading.value = false
  }
}
</script>
