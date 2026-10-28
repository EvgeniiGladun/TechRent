<template>
  <AuthCard v-if="screen" :title="screen.title">
    <div class="status">
      <span class="status__icon" :class="`status__icon--${screen.tone}`" aria-hidden="true">
        {{ screen.tone === 'danger' ? '!' : '✓' }}
      </span>
      <p class="muted">{{ screen.text }}</p>
    </div>
    <VButton block :to="screen.action.to">{{ screen.action.label }}</VButton>
  </AuthCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ROUTES, SCREEN_STATUS, type ScreenStatus } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import AuthCard from '@/components/AuthCard.vue'
import VButton from '@/components/ui/VButton.vue'

interface StatusScreen {
  title: string
  text: string
  tone: 'success' | 'danger'
  action: { label: string; to: string }
}

const SCREENS: Record<ScreenStatus, StatusScreen> = {
  [SCREEN_STATUS.AUTHORIZED]: {
    title: 'Вы вошли',
    text: 'Сессия активна. Токен будет обновляться автоматически.',
    tone: 'success',
    action: { label: 'Перейти в каталог', to: ROUTES.HOME },
  },
  [SCREEN_STATUS.REGISTERED]: {
    title: 'Аккаунт создан',
    text: 'Телефон подтверждён. Следующий шаг — верификация, после неё можно арендовать технику.',
    tone: 'success',
    action: { label: 'Перейти в каталог', to: ROUTES.HOME },
  },
  [SCREEN_STATUS.PASSWORD_CHANGED]: {
    title: 'Пароль изменён',
    text: 'Войдите с новым паролем.',
    tone: 'success',
    action: { label: 'Войти', to: ROUTES.LOGIN },
  },
  [SCREEN_STATUS.BLOCKED]: {
    title: 'Аккаунт заблокирован',
    text: 'Вход временно недоступен. Обратитесь в поддержку.',
    tone: 'danger',
    action: { label: 'На страницу входа', to: ROUTES.LOGIN },
  },
}

const router = useRouter()
const { screenStatus } = storeToRefs(useAuthStore())

const screen = computed(() => (screenStatus.value ? SCREENS[screenStatus.value] : null))

onMounted(() => {
  if (!screen.value) router.replace(ROUTES.HOME)
})
</script>

<style scoped>
.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-16);
  text-align: center;
}

.status__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 28px;
  font-weight: 700;
}

.status__icon--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.status__icon--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
</style>
