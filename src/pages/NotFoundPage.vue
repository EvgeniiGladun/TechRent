<template>
  <div class="error-page">
    <span class="error-page__code">404</span>
    <h1>Страница не найдена</h1>
    <p class="muted">Возможно, ссылка устарела или в адресе опечатка.</p>
    <VButton :to="ROUTES.HOME">На главную</VButton>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from '@/constants'
import VButton from '@/components/ui/VButton.vue'
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-12);
  padding: 64px 0;
  text-align: center;
}

.error-page__code {
  font-size: 72px;
  font-weight: 750;
  line-height: 1;
  color: var(--color-accent);
}
</style>
