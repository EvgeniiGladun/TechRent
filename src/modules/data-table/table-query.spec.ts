import { describe, expect, it } from 'vitest'
import {
  applyTableQuery,
  countActiveFilters,
  toggleSort,
  type TableConfig,
  type TableQuery,
} from './table-query'
import { getPageItems } from './pagination'
import { toCsv } from './csv'

interface Row {
  id: number
  name: string
  role: string
  balance: number
}

const rows: Row[] = [
  { id: 1, name: 'Мария', role: 'renter', balance: 1_200_000 },
  { id: 2, name: 'Алексей', role: 'admin', balance: 0 },
  { id: 3, name: 'Борис', role: 'renter', balance: 50_000 },
  { id: 4, name: 'Вера', role: 'owner', balance: 300_000 },
]

const config: TableConfig<Row> = {
  searchIn: [row => row.name, row => row.balance],
  filters: {
    role: { type: 'equals', get: row => row.role },
    balance: { type: 'range', get: row => row.balance },
  },
  sortBy: { name: row => row.name, balance: row => row.balance },
}

const query = (patch: Partial<TableQuery> = {}): TableQuery => ({
  search: '',
  filters: {},
  sort: null,
  page: 1,
  pageSize: 10,
  ...patch,
})

const ids = (patch: Partial<TableQuery>) =>
  applyTableQuery(rows, query(patch), config).items.map(row => row.id)

describe('applyTableQuery', () => {
  it('поиск не зависит от регистра и пробелов в числах', () => {
    expect(ids({ search: 'МАР' })).toEqual([1])
    expect(ids({ search: '1 200 000' })).toEqual([1])
  })

  it('фильтр по значению и диапазону работают вместе', () => {
    expect(ids({ filters: { role: 'renter', balance: { from: 100_000, to: null } } })).toEqual([1])
  })

  it('пустые фильтры игнорируются', () => {
    expect(ids({ filters: { role: '', balance: { from: null, to: null } } })).toHaveLength(4)
  })

  it('строки сортируются по алфавиту с учётом кириллицы, числа — по значению', () => {
    expect(ids({ sort: { key: 'name', order: 'asc' } })).toEqual([2, 3, 4, 1])
    expect(ids({ sort: { key: 'balance', order: 'desc' } })).toEqual([1, 4, 3, 2])
  })

  it('страница за пределами диапазона прижимается к последней', () => {
    const page = applyTableQuery(rows, query({ page: 9, pageSize: 3 }), config)
    expect(page).toMatchObject({ page: 2, pages: 2, total: 4 })
    expect(page.items.map(row => row.id)).toEqual([4])
  })

  it('пустой результат — одна пустая страница, а не ноль страниц', () => {
    expect(applyTableQuery(rows, query({ search: 'нет такого' }), config)).toMatchObject({
      items: [],
      total: 0,
      pages: 1,
    })
  })
})

describe('toggleSort', () => {
  it('по кругу: возрастание → убывание → без сортировки', () => {
    const asc = toggleSort(null, 'name')
    const desc = toggleSort(asc, 'name')
    expect(asc).toEqual({ key: 'name', order: 'asc' })
    expect(desc).toEqual({ key: 'name', order: 'desc' })
    expect(toggleSort(desc, 'name')).toBeNull()
  })

  it('клик по другой колонке начинает с возрастания', () => {
    expect(toggleSort({ key: 'name', order: 'desc' }, 'balance')).toEqual({
      key: 'balance',
      order: 'asc',
    })
  })
})

describe('countActiveFilters', () => {
  it('диапазон считается активным, если задана хотя бы одна граница', () => {
    expect(countActiveFilters({ role: '', a: { from: null, to: 5 }, b: 'x' })).toBe(2)
  })
})

describe('getPageItems', () => {
  it('показывает края и соседей текущей, пропуски — многоточием', () => {
    expect(getPageItems(6, 12)).toEqual([1, null, 5, 6, 7, null, 12])
  })

  it('пропуск в одну страницу заменяется её номером', () => {
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, null, 7])
  })
})

describe('toCsv', () => {
  it('экранирует разделитель и кавычки, добавляет BOM для Excel', () => {
    const csv = toCsv(
      [{ name: 'ООО «Вектор»; филиал', note: 'он сказал "да"' }],
      [
        { label: 'Имя', value: row => row.name },
        { label: 'Комментарий', value: row => row.note },
      ]
    )
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Имя;Комментарий',
      '"ООО «Вектор»; филиал";"он сказал ""да"""',
    ])
  })
})
