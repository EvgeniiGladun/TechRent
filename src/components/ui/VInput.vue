<template>
  <label class="v-input" :class="{ 'v-input--error': !!error, 'v-input--disabled': disabled }">
    <span class="v-input__label">
      {{ label }}
      <span v-if="required" class="v-input__required" aria-hidden="true">*</span>
    </span>
    <span class="v-input__field">
      <input
        :id="id"
        ref="inputRef"
        class="v-input__control"
        :value="modelValue"
        :type="currentType"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :aria-required="required || undefined"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${id}-hint` : undefined"
        @input="onInput"
      />
      <span v-if="suffix" class="v-input__suffix">{{ suffix }}</span>
      <button
        v-if="type === 'password'"
        type="button"
        class="v-input__toggle"
        :aria-label="isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'"
        @click="isPasswordVisible = !isPasswordVisible"
      >
        {{ isPasswordVisible ? 'Скрыть' : 'Показать' }}
      </button>
    </span>
    <Transition name="fade" mode="out-in">
      <span
        v-if="error"
        :id="`${id}-hint`"
        key="error"
        class="v-input__hint v-input__hint--error"
        role="alert"
      >
        {{ error }}
      </span>
      <span v-else-if="hint" :id="`${id}-hint`" key="hint" class="v-input__hint">{{ hint }}</span>
    </Transition>
  </label>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { formatPhoneInput } from '@/utils/phone-mask'
import { formatAmountInput, formatDateInput } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'password' | 'email' | 'tel'
    mask?: 'phone' | 'amount' | 'date'
    placeholder?: string
    autocomplete?: string
    error?: string
    hint?: string
    suffix?: string
    disabled?: boolean
    required?: boolean
  }>(),
  { type: 'text' }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const inputRef = ref<HTMLInputElement | null>(null)
const isPasswordVisible = ref(false)

const currentType = computed(() =>
  props.type === 'password' && isPasswordVisible.value ? 'text' : props.type
)

const inputmode = computed(() => {
  if (props.mask === 'phone') return 'tel'
  if (props.mask === 'amount') return 'decimal'
  if (props.mask === 'date') return 'numeric'
  return undefined
})

const applyMask = (value: string): string => {
  if (props.mask === 'phone') return formatPhoneInput(value)
  if (props.mask === 'amount') return formatAmountInput(value)
  if (props.mask === 'date') return formatDateInput(value)
  return value
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const masked = applyMask(target.value)
  if (masked !== target.value) target.value = masked
  emit('update:modelValue', masked)
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped>
.v-input {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
}

.v-input__label {
  font-size: 13px;
  font-weight: 550;
  color: var(--color-text-muted);
}

.v-input__required {
  color: var(--color-danger);
}

.v-input__field {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 0 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  transition: border-color 0.15s;
}

.v-input__field:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.v-input--error .v-input__field {
  border-color: var(--color-danger);
}

.v-input--disabled .v-input__field {
  background: var(--color-surface-muted);
}

.v-input__control {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  color: inherit;
}

.v-input__suffix {
  color: var(--color-text-muted);
}

.v-input__toggle {
  border: 0;
  background: none;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.v-input__hint {
  font-size: 13px;
  color: var(--color-text-muted);
}

.v-input__hint--error {
  color: var(--color-danger);
}
</style>
