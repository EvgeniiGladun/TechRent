<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    class="v-button"
    :class="[`v-button--${variant}`, { 'v-button--block': block, 'v-button--loading': loading }]"
    :disabled="to ? undefined : disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="v-button__spinner" aria-hidden="true" />
    <span class="v-button__content"><slot /></span>
  </component>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    type?: 'button' | 'submit'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    to?: RouteLocationRaw
  }>(),
  { variant: 'primary', type: 'button' }
)
</script>

<style scoped>
.v-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-8);
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: var(--radius-m);
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    opacity 0.15s;
  text-decoration: none !important;
}

.v-button--block {
  width: 100%;
}

.v-button--primary {
  background: var(--color-accent);
  color: #fff;
}

.v-button--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.v-button--secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

.v-button--secondary:hover:not(:disabled) {
  border-color: var(--color-text-muted);
}

.v-button--ghost {
  background: transparent;
  color: var(--color-accent);
  padding: 0 8px;
  min-height: 32px;
}

.v-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.v-button--loading .v-button__content {
  opacity: 0.6;
}

.v-button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
