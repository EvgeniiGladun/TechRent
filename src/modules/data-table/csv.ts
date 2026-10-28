export interface CsvColumn<T> {
  label: string
  value: (row: T) => string | number | null | undefined
}

const DELIMITER = ';'
/** BOM нужен, чтобы Excel открыл файл в UTF-8, а не в cp1251 */
const BOM = '﻿'

const escapeCell = (value: unknown): string => {
  const text = String(value ?? '')
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = <T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string => {
  const header = columns.map(column => escapeCell(column.label)).join(DELIMITER)
  const body = rows.map(row => columns.map(column => escapeCell(column.value(row))).join(DELIMITER))
  return BOM + [header, ...body].join('\r\n')
}

export const downloadCsv = (fileName: string, content: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
