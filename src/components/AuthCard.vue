<template>
  <VCard class="auth-card">
    <div class="auth-card__head">
      <h1 class="auth-card__title">{{ title }}</h1>
      <p v-if="subtitle" class="muted">{{ subtitle }}</p>
    </div>
    <slot />
    <div v-if="$slots.footer" class="auth-card__footer">
      <slot name="footer" />
    </div>
  </VCard>
</template>

<script setup lang="ts">
import VCard from '@/components/ui/VCard.vue'

defineProps<{ title: string; subtitle?: string }>()
</script>

<style scoped>
.auth-card {
  display: flex;
  flex-direction: column;
  gap: var(--gap-24);
  width: 100%;
  max-width: 420px;
}

.auth-card__head {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}

.auth-card__title {
  font-size: 24px;
}

.auth-card__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--gap-8);
  padding-top: var(--gap-16);
  border-top: 1px solid var(--color-border);
  font-size: 14px;
}
</style>
