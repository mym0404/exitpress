import { writeFile } from "node:fs/promises"
import path from "node:path"

import { delay } from "../../shared/async/util/AsyncTasks.js"
import { ensureDir } from "../node/FilePaths.js"

type RetryHttpOptions = {
  headers: Record<string, string>
  failureLabel: string
  retryDelays: number[]
  requestTimeoutMs: number
}

// Network aborts and fetch-level failures are safe retry candidates.
export const shouldRetryRequestError = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true
  }

  return error instanceof TypeError
}

// Retries server throttling and transient server errors.
export const shouldRetryStatus = (status: number) => status === 429 || status >= 500

// Applies an AbortController timeout to a single fetch call.
export const fetchWithTimeout = async ({
  url,
  headers,
  requestTimeoutMs,
}: {
  url: string
  headers: Record<string, string>
  requestTimeoutMs: number
}) => {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => {
    controller.abort()
  }, requestTimeoutMs)

  try {
    return await fetch(url, {
      headers,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutHandle)
  }
}

// Fetches a response with bounded retries for transient failures.
export const fetchResponseWithRetry = async ({
  url,
  headers,
  failureLabel,
  retryDelays,
  requestTimeoutMs,
}: {
  url: string
} & RetryHttpOptions) => {
  let lastError: Error | null = null

  for (const retryDelay of retryDelays) {
    if (retryDelay > 0) {
      await delay(retryDelay)
    }

    let response: Response

    try {
      response = await fetchWithTimeout({
        url,
        headers,
        requestTimeoutMs,
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (shouldRetryRequestError(error)) {
        continue
      }

      throw lastError
    }

    if (!response.ok) {
      lastError = new Error(`${failureLabel}: ${response.status} ${response.statusText}`)

      if (shouldRetryStatus(response.status)) {
        continue
      }

      throw lastError
    }

    return response
  }

  throw lastError ?? new Error(`${failureLabel}: 알 수 없는 오류`)
}

// Downloads binary content into memory with content-type metadata.
export const fetchBinary = async ({
  sourceUrl,
  headers,
  failureLabel,
  retryDelays,
  requestTimeoutMs,
}: {
  sourceUrl: string
} & RetryHttpOptions) => {
  const response = await fetchResponseWithRetry({
    url: sourceUrl,
    headers,
    failureLabel,
    retryDelays,
    requestTimeoutMs,
  })
  const arrayBuffer = await response.arrayBuffer()

  return {
    bytes: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type"),
  }
}

// Downloads binary content directly to a local file.
export const downloadBinary = async ({
  destinationPath,
  ...input
}: {
  sourceUrl: string
  destinationPath: string
} & RetryHttpOptions) => {
  const binary = await fetchBinary(input)
  await ensureDir(path.dirname(destinationPath))
  await writeFile(destinationPath, binary.bytes)
}
