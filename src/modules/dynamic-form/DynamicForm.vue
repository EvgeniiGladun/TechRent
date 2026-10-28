<template>
  <form ref="formRef" class="dynamic-form" novalidate @submit.prevent="submit">
    <div class="dynamic-form__fields">
      <DynamicField v-for="(field, index) in schema" :key="field.name ?? index" :field="field" />
    </div>

    <div class="dynamic-form__footer">
      <div class="dynamic-form__progress">
        <span class="small muted">
          Обязательные поля: {{ progress.filled }} из {{ progress.total }}
        </span>
        <VProgress
          :value="progress.filled"
          :max="progress.total || 1"
          label="Заполнение обязательных полей"
        />
      </div>
      <VButton type="submit" :loading="submitting">{{ submitText }}</VButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, provide, reactive, ref, watch } from 'vue'
import {
  buildPayload,
  createInitialValues,
  getRequiredProgress,
  getVisibleFields,
  validateField,
  validateForm,
  type FieldSchema,
  type FieldValue,
  type FormErrors,
  type Payload,
} from './schema'
import { DYNAMIC_FORM_KEY } from './context'
import DynamicField from './DynamicField.vue'
import VButton from '@/components/ui/VButton.vue'
import VProgress from '@/components/ui/VProgress.vue'

const props = withDefaults(
  defineProps<{
    schema: FieldSchema[]
    submitting?: boolean
    submitText?: string
    /** Ошибки бэкенда по полям (ответ 422): { inn: 'ИНН не найден' } */
    serverErrors?: FormErrors
  }>(),
  { submitText: 'Отправить' }
)

const emit = defineEmits<{ submit: [payload: Payload] }>()

const formRef = ref<HTMLFormElement | null>(null)
const values = reactive(createInitialValues(props.schema))
const errors = reactive<FormErrors>({})

const progress = computed(() => getRequiredProgress(props.schema, values))

const setValue = (name: string, value: FieldValue) => {
  values[name] = value
  // Ошибку убираем при исправлении, а не при первом же символе, чтобы она не «мигала»
  if (errors[name] && !validateField(findField(name)!, value)) delete errors[name]
}

const findField = (name: string) =>
  getVisibleFields(props.schema, values).find(field => field.name === name)

provide(DYNAMIC_FORM_KEY, { values, errors, setValue })

const replaceErrors = (next: FormErrors) => {
  Object.keys(errors).forEach(key => delete errors[key])
  Object.assign(errors, next)
}

/** Прокрутка к первой ошибке в порядке полей на экране и фокус на её поле ввода */
const focusFirstError = async () => {
  await nextTick()
  const first = getVisibleFields(props.schema, values).find(field => errors[field.name!])
  const element = first && formRef.value?.querySelector<HTMLElement>(`[data-field="${first.name}"]`)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true })
}

const submit = () => {
  replaceErrors(validateForm(props.schema, values))
  if (Object.keys(errors).length) {
    focusFirstError()
    return
  }
  emit('submit', buildPayload(props.schema, values))
}

watch(
  () => props.serverErrors,
  next => {
    if (!next || !Object.keys(next).length) return
    replaceErrors(next)
    focusFirstError()
  }
)
</script>

<style scoped>
.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-32);
}

.dynamic-form__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-24) var(--gap-16);
}

.dynamic-form__footer {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-16);
  margin: 0 calc(var(--gap-24) * -1) calc(var(--gap-24) * -1);
  padding: var(--gap-16) var(--gap-24);
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-l) var(--radius-l);
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(6px);
}

.dynamic-form__progress {
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
  flex: 0 1 280px;
}

@media (max-width: 600px) {
  .dynamic-form__fields {
    grid-template-columns: 1fr;
  }

  .dynamic-form__footer {
    flex-direction: column;
    align-items: stretch;
    margin: 0 calc(var(--gap-16) * -1) calc(var(--gap-16) * -1);
    padding: var(--gap-16);
  }

  .dynamic-form__progress {
    flex-basis: auto;
  }
}
</style>
