<template>
  <label class="v-select" :class="{ 'v-select--error': !!error }">
    <span v-if="label" class="v-select__label">{{ label }}</span>
    <select
      :id="id"
      class="v-select__control"
      :value="modelValue"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <span v-if="error" :id="`${id}-error`" class="v-select__error" role="alert">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string
    options: ReadonlyArray<{ value: string; label: string }>
    label?: string
    placeholder?: string
    error?: string
  }>(),
  { placeholder: 'Любой' }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
</script>

<style scoped>
.v-select {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
}

.v-select__label {
  font-size: 13px;
  font-weight: 550;
  color: var(--color-text-muted);
}

.v-select__control {
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.v-select__control:focus {
  outline: 0;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.v-select--error .v-select__control {
  border-color: var(--color-danger);
}

.v-select__error {
  font-size: 13px;
  color: var(--color-danger);
}
</style>
