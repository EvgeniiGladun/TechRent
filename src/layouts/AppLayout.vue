<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="app-header__inner">
        <RouterLink :to="ROUTES.HOME" class="app-header__logo"><AppLogo /></RouterLink>

        <nav class="app-header__nav" aria-label="Основное меню">
          <RouterLink v-for="item in menu" :key="item.to" :to="item.to" class="app-header__link">
            {{ item.label }}
          </RouterLink>
        </nav>

        <div v-if="user" class="app-header__user">
          <div class="app-header__user-info">
            <span class="app-header__name">{{ user.name }}</span>
            <span class="muted small">
              {{ userRole.textOf(user.role) }}
              <template v-if="userStore.isRenter">· {{ formatCurrency(user.balance) }}</template>
            </span>
          </div>
          <VButton variant="secondary" :loading="isLoading" @click="logout">Выйти</VButton>
        </div>

        <button
          type="button"
          class="app-header__burger"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-menu"
          :aria-label="isMenuOpen ? 'Закрыть меню' : 'Открыть меню'"
          @click="isMenuOpen = !isMenuOpen"
        >
          <span class="app-header__burger-line" />
          <span class="app-header__burger-line" />
          <span class="app-header__burger-line" />
        </button>
      </div>
    </header>

    <Transition name="drawer">
      <div v-if="isMenuOpen" class="mobile-menu" @click.self="isMenuOpen = false">
        <aside id="mobile-menu" class="mobile-menu__panel" aria-label="Меню">
          <div v-if="user" class="mobile-menu__user">
            <span class="app-header__name">{{ user.name }}</span>
            <span class="muted small">{{ userRole.textOf(user.role) }}</span>
            <strong v-if="userStore.isRenter" class="tabular">
              {{ formatCurrency(user.balance) }}
            </strong>
          </div>
          <nav class="mobile-menu__nav">
            <RouterLink v-for="item in menu" :key="item.to" :to="item.to" class="mobile-menu__link">
              {{ item.label }}
            </RouterLink>
          </nav>
          <VButton variant="secondary" block :loading="isLoading" @click="logout">Выйти</VButton>
        </aside>
      </div>
    </Transition>

    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ROUTES } from '@/constants'
import { useUserStore } from '@/stores/user'
import { useLogout } from '@/composables/useLogout'
import { formatCurrency } from '@/utils/format'
import { userRole } from '@/utils/dictionaries'
import AppLogo from '@/components/AppLogo.vue'
import VButton from '@/components/ui/VButton.vue'

const route = useRoute()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { logout, isLoading } = useLogout()

const isMenuOpen = ref(false)

const menu = computed(() => [
  { to: ROUTES.CATALOG, label: 'Каталог' },
  ...(userStore.isRenter
    ? [
        { to: ROUTES.RENTALS, label: 'Мои аренды' },
        { to: ROUTES.QUESTIONNAIRE, label: 'Анкета' },
      ]
    : []),
  ...(userStore.isAdmin ? [{ to: ROUTES.ADMIN_USERS, label: 'Пользователи' }] : []),
])

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') isMenuOpen.value = false
}

// Пока меню открыто, страница под ним не прокручивается
watch(isMenuOpen, isOpen => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  }
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: var(--gap-24);
  max-width: 1120px;
  margin: 0 auto;
  padding: 12px var(--gap-16);
}

.app-header__logo {
  text-decoration: none !important;
}

.app-header__nav {
  display: flex;
  gap: var(--gap-4);
  flex: 1;
}

.app-header__link {
  padding: 6px 12px;
  border-radius: var(--radius-s);
  color: var(--color-text-muted);
  font-weight: 550;
  text-decoration: none !important;
}

.app-header__link:hover,
.app-header__link.router-link-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.app-header__user {
  display: flex;
  align-items: center;
  gap: var(--gap-12);
}

.app-header__user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}

.app-header__name {
  font-weight: 600;
}

.app-header__burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  margin-left: auto;
  padding: 0 11px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  cursor: pointer;
}

.app-header__burger-line {
  height: 2px;
  border-radius: 2px;
  background: var(--color-text);
}

.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgb(21 33 43 / 40%);
}

.mobile-menu__panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-24);
  width: min(320px, 85vw);
  height: 100%;
  margin-left: auto;
  padding: var(--gap-24) var(--gap-16);
  background: var(--color-surface);
  overflow-y: auto;
}

.mobile-menu__user {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: var(--gap-16);
  border-bottom: 1px solid var(--color-border);
}

.mobile-menu__nav {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
  flex: 1;
}

.mobile-menu__link {
  padding: 12px;
  border-radius: var(--radius-m);
  color: var(--color-text);
  font-weight: 550;
  text-decoration: none !important;
}

.mobile-menu__link.router-link-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: background-color 0.2s ease;
}

.drawer-enter-active .mobile-menu__panel,
.drawer-leave-active .mobile-menu__panel {
  transition: transform 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  background-color: transparent;
}

.drawer-enter-from .mobile-menu__panel,
.drawer-leave-to .mobile-menu__panel {
  transform: translateX(100%);
}

.app-layout__main {
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--gap-32) var(--gap-16);
}

@media (max-width: 860px) {
  .app-header__nav,
  .app-header__user {
    display: none;
  }

  .app-header__burger {
    display: flex;
  }

  .app-layout__main {
    padding-top: var(--gap-24);
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active,
  .drawer-enter-active .mobile-menu__panel,
  .drawer-leave-active .mobile-menu__panel {
    transition: none;
  }
}
</style>
