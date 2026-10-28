export interface DictionaryItem<V extends string = string> {
  readonly value: V
  readonly text: string
}

type DictionaryData = Record<string, DictionaryItem>

export type DictionaryKey<D extends DictionaryData> = keyof D & string
export type DictionaryValue<D extends DictionaryData> = D[keyof D]['value']

export interface Dictionary<D extends DictionaryData> {
  value: <K extends DictionaryKey<D>>(key: K) => D[K]['value']
  text: (key: DictionaryKey<D>) => string
  textOf: (value: string | null | undefined, fallback?: string) => string
  keyOf: (value: string | null | undefined) => DictionaryKey<D> | null
  is: (value: string | null | undefined, key: DictionaryKey<D>) => boolean
  options: () => Array<{ value: DictionaryValue<D>; label: string }>
}

export const createDictionary = <D extends DictionaryData>(
  name: string,
  data: D
): Dictionary<D> => {
  const items = Object.freeze(structuredClone(data)) as D
  const byValue = new Map<string, DictionaryKey<D>>(
    Object.entries(items).map(([key, item]) => [item.value, key as DictionaryKey<D>])
  )

  const keyOf = (value: string | null | undefined): DictionaryKey<D> | null => {
    if (value == null) return null
    const key = byValue.get(value)
    if (!key) {
      console.warn(`[dictionary:${name}] Неизвестное значение "${value}"`)
      return null
    }
    return key
  }

  return {
    value: key => items[key]!.value,
    text: key => items[key]!.text,
    textOf: (value, fallback = '—') => {
      const key = keyOf(value)
      return key ? items[key]!.text : fallback
    },
    keyOf,
    is: (value, key) => value != null && items[key]?.value === value,
    options: () =>
      Object.values(items).map(item => ({
        value: item.value as DictionaryValue<D>,
        label: item.text,
      })),
  }
}
