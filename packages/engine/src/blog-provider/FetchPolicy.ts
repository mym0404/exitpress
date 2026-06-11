export type FetchPolicy = {
  concurrency: number
  minimumIntervalMs: number
  timeoutMs: number
  retryDelaysMs: number[]
  requestBudget: number
  cacheTtlMs: number
}

export const createDefaultFetchPolicy = (): FetchPolicy => ({
  concurrency: 1,
  minimumIntervalMs: 1_000,
  timeoutMs: 10_000,
  retryDelaysMs: [0, 1_000, 3_000],
  requestBudget: 30,
  cacheTtlMs: 86_400_000,
})

export const consumeRequestBudget = ({ remaining }: { remaining: number }) => {
  if (remaining <= 0) {
    return { remaining: 0, allowed: false }
  }

  return { remaining: remaining - 1, allowed: true }
}

export const parseRetryAfterMs = (value: string | undefined) => {
  if (!value) {
    return undefined
  }

  const seconds = Number(value)

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000
  }

  const dateMs = Date.parse(value)

  if (!Number.isFinite(dateMs)) {
    return undefined
  }

  return Math.max(0, dateMs - Date.now())
}

export const getRetryDelayMs = ({
  retryAfter,
  retryDelaysMs,
  attemptIndex,
}: {
  retryAfter?: string
  retryDelaysMs: number[]
  attemptIndex: number
}) => parseRetryAfterMs(retryAfter) ?? retryDelaysMs[attemptIndex] ?? undefined
