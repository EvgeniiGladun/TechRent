import type { InjectionKey } from 'vue'
import type { FieldValue, FormErrors, FormValues } from './schema'

export interface DynamicFormContext {
  values: FormValues
  errors: FormErrors
  setValue: (name: string, value: FieldValue) => void
}

/** Поля любой вложенности получают состояние формы без проброса props через группы */
export const DYNAMIC_FORM_KEY: InjectionKey<DynamicFormContext> = Symbol('dynamic-form')
