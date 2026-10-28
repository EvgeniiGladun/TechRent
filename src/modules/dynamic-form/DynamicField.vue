<template>
  <fieldset v-if="field.component === 'group'" class="dynamic-field__group">
    <legend v-if="field.label" class="dynamic-field__legend">{{ field.label }}</legend>
    <p v-if="field.hint" class="small muted dynamic-field__wide">{{ field.hint }}</p>
    <DynamicField
      v-for="(child, index) in field.fields"
      :key="child.name ?? index"
      :field="child"
    />
  </fieldset>

  <div
    v-else
    class="dynamic-field"
    :class="{ 'dynamic-field__wide': isWide }"
    :data-field="field.name"
  >
    <VInput
      v-if="field.component === 'text' || field.component === 'date'"
      :model-value="String(value ?? '')"
      :label="field.label ?? ''"
      :mask="field.mask"
      :placeholder="field.placeholder ?? (field.component === 'date' ? 'ДД.ММ.ГГГГ' : undefined)"
      :hint="field.hint"
      :error="error"
      :required="field.required"
      @update:model-value="update"
    />

    <VSelect
      v-else-if="field.component === 'select'"
      :model-value="String(value ?? '')"
      :label="field.label"
      :options="field.options ?? []"
      :placeholder="field.placeholder ?? 'Выберите'"
      :error="error"
      @update:model-value="update"
    />

    <div
      v-else-if="field.component === 'radio'"
      class="dynamic-field__choice"
      role="radiogroup"
      :aria-label="field.label"
      :aria-invalid="!!error"
    >
      <span class="dynamic-field__label">{{ field.label }}</span>
      <div class="dynamic-field__options">
        <label
          v-for="option in field.options"
          :key="option.value"
          class="dynamic-field__option"
          :class="{ 'dynamic-field__option--active': value === option.value }"
        >
          <input
            type="radio"
            :name="field.name"
            :value="option.value"
            :checked="value === option.value"
            @change="update(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
      <span v-if="error" class="dynamic-field__error" role="alert">{{ error }}</span>
    </div>

    <div v-else-if="field.component === 'checkbox'" class="dynamic-field__choice">
      <label class="dynamic-field__checkbox">
        <input
          type="checkbox"
          :name="field.name"
          :checked="value === true"
          :aria-invalid="!!error"
          @change="update(($event.target as HTMLInputElement).checked)"
        />
        <span>
          {{ field.label }}
          <span v-if="field.required" class="dynamic-field__required" aria-hidden="true">*</span>
        </span>
      </label>
      <span v-if="error" class="dynamic-field__error" role="alert">{{ error }}</span>
    </div>
  </div>

  <template v-for="(extension, index) in field.extensions" :key="`${field.name}-ext-${index}`">
    <Transition name="fade">
      <div v-if="isExtensionActive(extension, value)" class="dynamic-field__extension">
        <DynamicField
          v-for="(child, childIndex) in extension.fields"
          :key="child.name ?? childIndex"
          :field="child"
        />
      </div>
    </Transition>
  </template>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { isExtensionActive, type FieldSchema, type FieldValue } from './schema'
import { DYNAMIC_FORM_KEY } from './context'
import VInput from '@/components/ui/VInput.vue'
import VSelect from '@/components/ui/VSelect.vue'

defineOptions({ name: 'DynamicField' })

const props = defineProps<{ field: FieldSchema }>()

const form = inject(DYNAMIC_FORM_KEY)!

const value = computed(() => (props.field.name ? form.values[props.field.name] : undefined))
const error = computed(() => (props.field.name ? form.errors[props.field.name] : undefined))
const isWide = computed(
  () =>
    props.field.wide || props.field.component === 'checkbox' || props.field.component === 'radio'
)

const update = (next: FieldValue) => {
  if (props.field.name) form.setValue(props.field.name, next)
}
</script>

<style scoped>
.dynamic-field__group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-16);
  grid-column: 1 / -1;
  margin: 0;
  padding: 0;
  border: 0;
}

.dynamic-field__legend {
  grid-column: 1 / -1;
  margin-bottom: var(--gap-12);
  padding: 0;
  font-size: 17px;
  font-weight: 650;
}

.dynamic-field__wide,
.dynamic-field__extension {
  grid-column: 1 / -1;
}

.dynamic-field__extension {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-16);
  padding: var(--gap-16);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-s);
  background: var(--color-surface-muted);
}

.dynamic-field__choice {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}

.dynamic-field__label {
  font-size: 13px;
  font-weight: 550;
  color: var(--color-text-muted);
}

.dynamic-field__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-8);
}

.dynamic-field__option {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-8);
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  cursor: pointer;
}

.dynamic-field__option--active {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.dynamic-field__checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-8);
  cursor: pointer;
}

.dynamic-field input[type='radio'],
.dynamic-field input[type='checkbox'] {
  margin: 4px 0 0;
  accent-color: var(--color-accent);
}

.dynamic-field__required {
  color: var(--color-danger);
}

.dynamic-field__error {
  font-size: 13px;
  color: var(--color-danger);
}

@media (max-width: 600px) {
  .dynamic-field__group,
  .dynamic-field__extension {
    grid-template-columns: 1fr;
  }
}
</style>
