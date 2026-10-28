<template>
  <div
    class="v-progress"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
  >
    <div class="v-progress__bar" :style="{ width: `${percent}%` }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number; max: number; label?: string }>()

const percent = computed(() =>
  props.max > 0 ? Math.min(100, Math.round((props.value / props.max) * 100)) : 0
)
</script>

<style scoped>
.v-progress {
  height: 8px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.v-progress__bar {
  height: 100%;
  border-radius: inherit;
  background: var(--color-accent);
  transition: width 0.4s ease;
}
</style>
