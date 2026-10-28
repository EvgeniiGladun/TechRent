<template>
  <component :is="tag" class="v-card" :class="{ 'v-card--padded': padded }">
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tag?: string; padded?: boolean }>(), { tag: 'section', padded: true })
</script>

<style scoped>
.v-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-card);
}

.v-card--padded {
  padding: var(--gap-24);
}

@media (max-width: 600px) {
  .v-card--padded {
    padding: var(--gap-16);
  }
}
</style>
