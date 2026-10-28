const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
})

export const formatCurrency = (value: number | string | null | undefined): string => {
  const number = Number(value)
  if (value == null || value === '' || Number.isNaN(number)) return '—'
  return currencyFormatter.format(number).replace(/ | /g, ' ')
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU')

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export const formatPercent = (value: number): string => `${percentFormatter.format(value)} %`

export const formatSeconds = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`
}

export const maskPhone = (phone: string): string =>
  phone.replace(/(\d{3})-(\d{2})-(\d{2})$/, (_, __, ___, last) => `***-**-${last}`)

export const plural = (count: number, forms: readonly [string, string, string]): string => {
  const mod10 = Math.abs(count) % 10
  const mod100 = Math.abs(count) % 100

  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export const formatAmountInput = (value: string | number): string => {
  const raw = typeof value === 'number' ? String(value) : value
  const [int = '', fraction] = raw
    .replace(/[^\d,.]/g, '')
    .replace('.', ',')
    .split(',')
  const grouped = int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return fraction !== undefined ? `${grouped},${fraction.slice(0, 2)}` : grouped
}

/** «01022000» → «01.02.2000» по мере ввода */
export const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('.')
}

export const parseAmount = (input: string | number): number => {
  if (typeof input === 'number') return input
  const normalized = input
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
  return normalized ? Number(normalized) : NaN
}
