export const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const mapConcurrent = async <Item, Result>({
  items,
  concurrency,
  mapper,
}: {
  items: Item[]
  concurrency: number
  mapper: (item: Item, index: number) => Promise<Result>
}) => {
  const results = new Array<Result>(items.length)
  let cursor = 0

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor
      cursor += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  })

  await Promise.all(workers)

  return results
}
