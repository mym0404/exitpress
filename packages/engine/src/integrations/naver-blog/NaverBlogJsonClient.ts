import * as HttpRequests from "@exitpress/engine/infra/http/util/HttpRequests.js"
import { delay } from "@exitpress/engine/shared/async/util/AsyncTasks.js"

import { browserHeaders } from "./NaverBlogRequestHeaders.js"

export const fetchNaverBlogJson = async <Result>({
  blogId,
  url,
  retryDelays,
  requestTimeoutMs,
}: {
  blogId: string
  url: string
  retryDelays: number[]
  requestTimeoutMs: number
}): Promise<Result> => {
  let lastError: Error | null = null

  for (const retryDelay of retryDelays) {
    if (retryDelay > 0) {
      await delay(retryDelay)
    }

    let response: Response

    try {
      response = await HttpRequests.fetchWithTimeout({
        url,
        headers: browserHeaders({ blogId }),
        requestTimeoutMs,
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (HttpRequests.shouldRetryRequestError(error)) {
        continue
      }

      throw lastError
    }

    if (!response.ok) {
      lastError = new Error(`API 요청 실패: ${response.status} ${response.statusText}`)

      if (HttpRequests.shouldRetryStatus(response.status)) {
        continue
      }

      throw lastError
    }

    const payload = (await response.json()) as {
      isSuccess?: boolean
      result?: Result
    }

    if (!payload.result) {
      lastError = new Error("API 응답에 result가 없습니다.")
      continue
    }

    return payload.result
  }

  throw lastError ?? new Error("API 요청에 실패했습니다.")
}
