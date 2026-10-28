<template>
  <div
    class="v-alert"
    :class="`v-alert--${variant}`"
    :role="variant === 'danger' ? 'alert' : 'status'"
  >
    <strong v-if="title" class="v-alert__title">{{ title }}</strong>
    <div class="v-alert__body"><slot /></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'info' | 'success' | 'warning' | 'danger'
    title?: string
  }>(),
  { variant: 'info' }
)
</script>

<style scoped>
.v-alert {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
  padding: 12px 14px;
  border-radius: var(--radius-m);
  font-size: 14px;
}

.v-alert--info {
  background: var(--color-surface-muted);
}

.v-alert--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.v-alert--warning {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.v-alert--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
</style>
