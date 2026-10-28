<template>
  <div class="auth-layout">
    <header class="auth-layout__header">
      <RouterLink :to="ROUTES.HOME" class="auth-layout__logo">
        <AppLogo />
      </RouterLink>
    </header>
    <main class="auth-layout__main">
      <slot />
    </main>
    <footer class="auth-layout__footer muted small">
      Демо-проект. Все данные вымышлены, запросы обслуживает встроенный mock-сервер.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from '@/constants'
import AppLogo from '@/components/AppLogo.vue'
</script>

<style scoped>
.auth-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: var(--gap-24) var(--gap-16);
}

.auth-layout__header {
  display: flex;
  justify-content: center;
}

.auth-layout__logo {
  text-decoration: none !important;
}

.auth-layout__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap-32) 0;
}

.auth-layout__footer {
  text-align: center;
}
</style>
