/**
 * Поиск, фильтры, сортировка и пагинация для табличных данных.
 * Чистые функции: на фронте их использует mock-сервер (имитация серверной пагинации),
 * а сами правила покрыты unit-тестами без монтирования компонентов.
 */

export type SortOrder = 'asc' | 'desc'

export interface TableSort {
  key: string
  order: SortOrder
}

export interface RangeFilter {
  from: number | null
  to: number | null
}

export type TableFilterValue = string | RangeFilter

export interface TableQuery {
  search: string
  filters: Record<string, TableFilterValue>
  sort: TableSort | null
  page: number
  pageSize: number
}

export interface TablePage<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export interface FilterRule<T> {
  type: 'equals' | 'range'
  get: (row: T) => unknown
}

export interface TableConfig<T> {
  /** Поля, по которым работает строка поиска */
  searchIn: Array<(row: T) => unknown>
  filters: Record<string, FilterRule<T>>
  sortBy: Record<string, (row: T) => string | number>
}

/** «1 000 000», «1000000» и «1 000 000» должны находиться одинаково */
export const normalizeSearch = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s/g, '')

export const isRangeFilter = (value: TableFilterValue | undefined): value is RangeFilter =>
  typeof value === 'object' && value !== null

export const isFilterEmpty = (value: TableFilterValue | undefined): boolean => {
  if (value === undefined || value === '') return true
  return isRangeFilter(value) && value.from == null && value.to == null
}

export const countActiveFilters = (filters: Record<string, TableFilterValue>): number =>
  Object.values(filters).filter(value => !isFilterEmpty(value)).length

export const matchesSearch = <T>(row: T, search: string, config: TableConfig<T>): boolean => {
  const query = normalizeSearch(search)
  if (!query) return true
  return config.searchIn.some(get => normalizeSearch(get(row)).includes(query))
}

export const matchesFilters = <T>(
  row: T,
  filters: Record<string, TableFilterValue>,
  config: TableConfig<T>
): boolean =>
  Object.entries(filters).every(([name, value]) => {
    const rule = config.filters[name]
    if (!rule || isFilterEmpty(value)) return true

    const cell = rule.get(row)

    if (rule.type === 'range' && isRangeFilter(value)) {
      const number = Number(cell)
      if (value.from != null && number < value.from) return false
      if (value.to != null && number > value.to) return false
      return true
    }

    return String(cell) === value
  })

export const compareBy = <T>(get: (row: T) => string | number, order: SortOrder) => {
  const direction = order === 'asc' ? 1 : -1

  return (a: T, b: T): number => {
    const valueA = get(a)
    const valueB = get(b)

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB, 'ru') * direction
    }
    return (Number(valueA) - Number(valueB)) * direction
  }
}

export const sortRows = <T>(rows: readonly T[], sort: TableSort | null, config: TableConfig<T>) => {
  const get = sort ? config.sortBy[sort.key] : undefined
  if (!sort || !get) return rows.slice()
  return rows.slice().sort(compareBy(get, sort.order))
}

/** Клик по заголовку: по возрастанию → по убыванию → без сортировки */
export const toggleSort = (current: TableSort | null, key: string): TableSort | null => {
  if (current?.key !== key) return { key, order: 'asc' }
  if (current.order === 'asc') return { key, order: 'desc' }
  return null
}

export const paginate = <T>(rows: readonly T[], page: number, pageSize: number): TablePage<T> => {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(Math.max(1, page), pages)
  const start = (safePage - 1) * pageSize

  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page: safePage,
    pages,
  }
}

export const applyTableQuery = <T>(
  rows: readonly T[],
  query: TableQuery,
  config: TableConfig<T>
): TablePage<T> => {
  const filtered = rows.filter(
    row => matchesSearch(row, query.search, config) && matchesFilters(row, query.filters, config)
  )
  return paginate(sortRows(filtered, query.sort, config), query.page, query.pageSize)
}
