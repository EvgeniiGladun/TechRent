<template>
  <div class="data-table" :class="{ 'data-table--loading': loading }" :aria-busy="loading">
    <!-- На мобильных заголовки скрыты, поэтому сортировка вынесена в отдельный select -->
    <label v-if="sortableColumns.length" class="data-table__mobile-sort">
      <span class="small muted">Сортировка</span>
      <select :value="mobileSortValue" @change="onMobileSort">
        <option value="">По умолчанию</option>
        <template v-for="column in sortableColumns" :key="column.key">
          <option :value="`${column.key}:asc`">{{ column.label }} ↑</option>
          <option :value="`${column.key}:desc`">{{ column.label }} ↓</option>
        </template>
      </select>
    </label>

    <table class="data-table__table">
      <thead>
        <tr>
          <th v-if="selectable" scope="col" class="data-table__check">
            <input
              type="checkbox"
              aria-label="Выбрать все на странице"
              :checked="isAllSelected"
              :indeterminate="isPartiallySelected"
              :disabled="!rows.length"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="`data-table__cell--${column.align ?? 'left'}`"
            :aria-sort="ariaSort(column.key)"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="data-table__sort"
              :class="{ 'data-table__sort--active': sort?.key === column.key }"
              @click="emit('update:sort', toggleSort(sort, column.key))"
            >
              {{ column.label }}
              <span class="data-table__arrow" aria-hidden="true">{{ sortArrow(column.key) }}</span>
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row[rowKey] as PropertyKey"
          :class="[rowClass?.(row), { 'data-table__row--selected': isSelected(row) }]"
        >
          <td v-if="selectable" class="data-table__check">
            <input
              type="checkbox"
              :aria-label="`Выбрать строку ${String(row[rowKey])}`"
              :checked="isSelected(row)"
              @change="toggleRow(row)"
            />
          </td>
          <td
            v-for="column in columns"
            :key="column.key"
            :data-label="column.label"
            :class="`data-table__cell--${column.align ?? 'left'}`"
          >
            <slot :name="`cell-${column.key}`" :row="row">
              {{ column.value ? column.value(row) : cellValue(row, column.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!rows.length && !loading" class="data-table__empty">
      <slot name="empty">Ничего не найдено</slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed } from 'vue'
import { toggleSort, type TableSort } from './table-query'

export interface TableColumn<Row> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right'
  value?: (row: Row) => string | number
}

const props = defineProps<{
  rows: T[]
  columns: TableColumn<T>[]
  rowKey: keyof T
  sort?: TableSort | null
  selectable?: boolean
  selected?: string[]
  loading?: boolean
  rowClass?: (row: T) => string | undefined
}>()

const emit = defineEmits<{
  'update:sort': [value: TableSort | null]
  'update:selected': [value: string[]]
}>()

const sortableColumns = computed(() => props.columns.filter(column => column.sortable))
const selectedSet = computed(() => new Set(props.selected ?? []))
const idOf = (row: T) => String(row[props.rowKey])
const cellValue = (row: T, key: string) => (row as Record<string, unknown>)[key]

const isSelected = (row: T) => selectedSet.value.has(idOf(row))
const isAllSelected = computed(() => !!props.rows.length && props.rows.every(isSelected))
const isPartiallySelected = computed(() => !isAllSelected.value && props.rows.some(isSelected))

const toggleRow = (row: T) => {
  const next = new Set(selectedSet.value)
  if (next.has(idOf(row))) next.delete(idOf(row))
  else next.add(idOf(row))
  emit('update:selected', [...next])
}

// Выбор действует на текущую страницу и не трогает строки, выбранные на других
const toggleAll = () => {
  const next = new Set(selectedSet.value)
  const pageIds = props.rows.map(idOf)
  if (isAllSelected.value) pageIds.forEach(id => next.delete(id))
  else pageIds.forEach(id => next.add(id))
  emit('update:selected', [...next])
}

const sortArrow = (key: string) => {
  if (props.sort?.key !== key) return '↕'
  return props.sort.order === 'asc' ? '↑' : '↓'
}

const ariaSort = (key: string) => {
  if (props.sort?.key !== key) return undefined
  return props.sort.order === 'asc' ? 'ascending' : 'descending'
}

const mobileSortValue = computed(() => (props.sort ? `${props.sort.key}:${props.sort.order}` : ''))

const onMobileSort = (event: Event) => {
  const [key, order] = (event.target as HTMLSelectElement).value.split(':')
  emit('update:sort', key && order ? { key, order: order as TableSort['order'] } : null)
}
</script>

<style scoped>
.data-table {
  position: relative;
  overflow-x: auto;
  transition: opacity 0.15s;
}

.data-table--loading {
  opacity: 0.55;
  pointer-events: none;
}

.data-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table__table th,
.data-table__table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.data-table__table thead th {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-weight: 550;
  font-size: 13px;
}

.data-table__table tbody tr:last-child td {
  border-bottom: 0;
}

.data-table__table tbody tr:hover td {
  background: var(--color-surface-muted);
}

.data-table__row--selected td {
  background: var(--color-accent-soft) !important;
}

.data-table__cell--right {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
}

.data-table__check {
  width: 44px;
}

.data-table__check input,
.data-table__mobile-sort select {
  accent-color: var(--color-accent);
}

.data-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.data-table__sort--active {
  color: var(--color-text);
}

.data-table__arrow {
  opacity: 0.6;
  font-size: 12px;
}

.data-table__empty {
  padding: var(--gap-32) var(--gap-16);
  text-align: center;
  color: var(--color-text-muted);
}

.data-table__mobile-sort {
  display: none;
}

/* Мобильная версия: строка таблицы превращается в карточку «подпись — значение» */
@media (max-width: 720px) {
  .data-table__mobile-sort {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-12);
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
  }

  .data-table__mobile-sort select {
    min-height: 36px;
    padding: 0 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    font: inherit;
  }

  .data-table__table thead {
    display: none;
  }

  .data-table__table,
  .data-table__table tbody,
  .data-table__table tr,
  .data-table__table td {
    display: block;
    width: 100%;
  }

  .data-table__table tr {
    position: relative;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
  }

  .data-table__table tbody tr:hover td {
    background: none;
  }

  .data-table__table td {
    display: flex;
    justify-content: space-between;
    gap: var(--gap-16);
    padding: 4px 0;
    border: 0;
    white-space: normal;
    text-align: right;
  }

  .data-table__table td::before {
    content: attr(data-label);
    color: var(--color-text-muted);
    text-align: left;
  }

  .data-table__table td.data-table__check::before {
    content: 'Выбрать';
  }
}
</style>
