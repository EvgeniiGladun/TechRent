<template>
  <div class="v-skeleton" :style="{ height, borderRadius: radius }" aria-hidden="true" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ height?: string; radius?: string }>(), {
  height: '16px',
  radius: '8px',
})
</script>

<style scoped>
.v-skeleton {
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--color-surface-muted) 25%,
    var(--color-border) 50%,
    var(--color-surface-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
