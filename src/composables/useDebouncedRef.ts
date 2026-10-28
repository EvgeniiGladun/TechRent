import { onScopeDispose, ref, watch, type Ref } from 'vue'

export const useDebouncedRef = <T>(source: Ref<T>, delay = 300): Readonly<Ref<T>> => {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(source, value => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
  })

  return debounced
}
