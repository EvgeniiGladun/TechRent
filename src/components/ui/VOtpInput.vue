<template>
  <div class="v-otp">
    <span :id="labelId" class="v-otp__label">{{ label }}</span>
    <div class="v-otp__cells" role="group" :aria-labelledby="labelId" @paste.prevent="onPaste">
      <input
        v-for="(digit, index) in digits"
        :key="index"
        :ref="el => (cells[index] = el as HTMLInputElement)"
        class="v-otp__cell"
        :class="{ 'v-otp__cell--error': !!error, 'v-otp__cell--filled': !!digit }"
        :value="digit"
        :disabled="disabled"
        :aria-label="`Цифра ${index + 1}`"
        inputmode="numeric"
        autocomplete="one-time-code"
        @input="onInput(index, $event)"
        @keydown="onKeydown(index, $event)"
        @focus="onFocus(index, $event)"
      />
    </div>
    <Transition name="fade">
      <span v-if="error" class="v-otp__error" role="alert">{{ error }}</span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    length?: number
    label?: string
    error?: string
    disabled?: boolean
  }>(),
  { length: 5, label: 'Код из СМС' }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  complete: [value: string]
}>()

const labelId = useId()
const cells = ref<HTMLInputElement[]>([])

const toDigits = (value: string): string[] =>
  Array.from({ length: props.length }, (_, index) => value[index] ?? '')

// Храним цифры у себя, а не читаем из props: родитель обновляет props только
// при следующей перерисовке, и при быстром вводе мы бы работали со старым кодом.
const digits = ref<string[]>(toDigits(props.modelValue))

const focusCell = (index: number) => {
  const target = cells.value[Math.min(Math.max(index, 0), props.length - 1)]
  target?.focus()
}

const firstEmptyIndex = (): number => {
  const index = digits.value.findIndex(digit => !digit)
  return index === -1 ? props.length - 1 : index
}

const commit = (next: string[]) => {
  digits.value = next
  const code = next.join('')
  emit('update:modelValue', code)
  if (code.length === props.length) emit('complete', code)
}

/**
 * В одну ячейку может прилететь сразу несколько цифр — телефон подставил код из СМС
 * или пользователь печатает в уже заполненную ячейку. Новые цифры раскладываем
 * по ячейкам начиная с текущей, а если ячейка была занята — заменяем её цифру, а не дописываем.
 */
const onInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const typed = target.value.replace(/\D/g, '')
  const current = digits.value[index] ?? ''
  const incoming = current && typed.length > 1 && typed.startsWith(current) ? typed.slice(1) : typed

  const next = digits.value.slice()
  if (incoming) {
    next.splice(index, incoming.length, ...incoming.split(''))
  } else {
    next[index] = ''
  }
  const normalized = next.slice(0, props.length)
  target.value = normalized[index] ?? ''

  commit(normalized)
  if (incoming) focusCell(index + incoming.length)
}

const onFocus = (index: number, event: FocusEvent) => {
  const empty = firstEmptyIndex()
  if (index > empty) {
    focusCell(empty)
    return
  }
  ;(event.target as HTMLInputElement).select()
}

const onKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    event.preventDefault()
    const next = digits.value.slice()
    next[index - 1] = ''
    commit(next)
    focusCell(index - 1)
  } else if (event.key === 'ArrowLeft') {
    focusCell(index - 1)
  } else if (event.key === 'ArrowRight') {
    focusCell(index + 1)
  }
}

const onPaste = (event: ClipboardEvent) => {
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
  commit(toDigits(pasted.slice(0, props.length)))
  nextTick(() => focusCell(pasted.length))
}

watch(
  () => props.modelValue,
  value => {
    if (value === digits.value.join('')) return
    digits.value = toDigits(value)
    if (!value) nextTick(() => focusCell(0))
  }
)

onMounted(() => focusCell(0))
</script>

<style scoped>
.v-otp {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}

.v-otp__label {
  font-size: 13px;
  font-weight: 550;
  color: var(--color-text-muted);
}

.v-otp__cells {
  display: flex;
  gap: var(--gap-8);
}

.v-otp__cell {
  width: 52px;
  height: 58px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  text-align: center;
  font: inherit;
  font-size: 22px;
  font-weight: 650;
  outline: 0;
  transition: border-color 0.15s;
}

.v-otp__cell:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.v-otp__cell--filled {
  border-color: var(--color-text-muted);
}

.v-otp__cell--error {
  border-color: var(--color-danger);
}

.v-otp__error {
  font-size: 13px;
  color: var(--color-danger);
}

@media (max-width: 400px) {
  .v-otp__cell {
    width: 46px;
    height: 52px;
  }
}
</style>
