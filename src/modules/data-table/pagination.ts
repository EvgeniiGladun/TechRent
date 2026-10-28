/**
 * Номера страниц для пагинатора: первая, последняя и соседи текущей,
 * пропуски обозначаются null («1 … 4 5 6 … 12»).
 */
export const getPageItems = (page: number, pages: number, siblings = 1): Array<number | null> => {
  const visible = new Set([1, pages])
  for (let item = page - siblings; item <= page + siblings; item++) {
    if (item >= 1 && item <= pages) visible.add(item)
  }

  const sorted = [...visible].sort((a, b) => a - b)
  return sorted.flatMap((item, index) => {
    const previous = sorted[index - 1]
    if (previous === undefined || item - previous === 1) return [item]
    // Пропуск ровно в одну страницу выгоднее показать числом, чем многоточием
    return item - previous === 2 ? [item - 1, item] : [null, item]
  })
}
