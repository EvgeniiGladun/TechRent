import { computed, reactive, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import {
  countActiveFilters,
  isFilterEmpty,
  isRangeFilter,
  type TableFilterValue,
  type TableQuery,
  type TableSort,
} from './table-query'

export interface UseTableQueryOptions<F extends Record<string, TableFilterValue>> {
  /** Пустые значения фильтров: по ним же определяется тип (строка или диапазон) */
  filters: F
  pageSize?: number
  searchDelay?: number
}

const FILTER_PREFIX = 'f.'
const RANGE_SEPARATOR = '..'

const parseNumber = (value: string | undefined): number | null =>
  value && !Number.isNaN(Number(value)) ? Number(value) : null

const parseSort = (value: unknown): TableSort | null => {
  if (typeof value !== 'string') return null
  const [key, order] = value.split(':')
  return key && (order === 'asc' || order === 'desc') ? { key, order } : null
}

const readFilters = <F extends Record<string, TableFilterValue>>(
  query: LocationQuery,
  defaults: F
) =>
  Object.fromEntries(
    Object.entries(defaults).map(([name, empty]) => {
      const raw = query[FILTER_PREFIX + name]
      if (typeof raw !== 'string') return [name, structuredClone(empty)]
      if (!isRangeFilter(empty)) return [name, raw]

      const [from, to] = raw.split(RANGE_SEPARATOR)
      return [name, { from: parseNumber(from), to: parseNumber(to) }]
    })
  ) as F

const writeFilters = (filters: Record<string, TableFilterValue>): LocationQueryRaw =>
  Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => !isFilterEmpty(value))
      .map(([name, value]) => [
        FILTER_PREFIX + name,
        isRangeFilter(value) ? `${value.from ?? ''}${RANGE_SEPARATOR}${value.to ?? ''}` : value,
      ])
  )

/**
 * Состояние таблицы (поиск, фильтры, сортировка, страница), синхронизированное с URL.
 * Ссылку на отфильтрованный список можно отправить коллеге, а после перезагрузки
 * страницы фильтры не теряются.
 */
export const useTableQuery = <F extends Record<string, TableFilterValue>>(
  options: UseTableQueryOptions<F>
) => {
  const route = useRoute()
  const router = useRouter()
  const { pageSize = 10, searchDelay = 300 } = options

  const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
  const filters = reactive(readFilters(route.query, options.filters)) as F
  const sort = ref<TableSort | null>(parseSort(route.query.sort))
  const page = ref(parseNumber(String(route.query.page ?? '')) ?? 1)

  const debouncedSearch = useDebouncedRef(search, searchDelay) as Ref<string>

  const query = computed<TableQuery>(() => ({
    search: debouncedSearch.value.trim(),
    // Снимок без reactive-прокси: structuredClone на Proxy падает с DataCloneError
    filters: JSON.parse(JSON.stringify(filters)),
    sort: sort.value,
    page: page.value,
    pageSize,
  }))

  const activeFiltersCount = computed(() => countActiveFilters(filters))

  // Любое изменение условий выборки возвращает на первую страницу
  watch(
    [debouncedSearch, () => ({ ...filters }), sort],
    () => {
      page.value = 1
    },
    { deep: true }
  )

  watch(query, value => {
    router.replace({
      query: {
        ...(value.search ? { q: value.search } : {}),
        ...(value.sort ? { sort: `${value.sort.key}:${value.sort.order}` } : {}),
        ...(value.page > 1 ? { page: String(value.page) } : {}),
        ...writeFilters(value.filters),
      },
    })
  })

  const resetFilters = () => {
    Object.assign(filters, structuredClone(options.filters))
  }

  return {
    search,
    filters,
    sort,
    page,
    query,
    activeFiltersCount,
    resetFilters,
  }
}
