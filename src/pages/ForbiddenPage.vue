<template>
  <div class="error-page">
    <span class="error-page__code">403</span>
    <h1>Доступ запрещён</h1>
    <p class="muted">У вашей роли нет доступа к этому разделу.</p>
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
