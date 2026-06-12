import { describe, expect, it } from "vitest"

import {
  consumeRequestBudget,
  createDefaultFetchPolicy,
  getRetryDelayMs,
  parseRetryAfterMs,
} from "./FetchPolicy.js"

describe("FetchPolicy", () => {
  it("creates conservative defaults", () => {
    expect(createDefaultFetchPolicy()).toEqual({
      concurrency: 1,
      minimumIntervalMs: 1_000,
      timeoutMs: 10_000,
      retryDelaysMs: [0, 1_000, 3_000],
      requestBudget: 30,
      cacheTtlMs: 86_400_000,
    })
  })

  it("consumes request budget without going negative", () => {
    expect(consumeRequestBudget({ remaining: 2 })).toEqual({ remaining: 1, allowed: true })
    expect(consumeRequestBudget({ remaining: 0 })).toEqual({ remaining: 0, allowed: false })
  })

  it("parses Retry-After seconds", () => {
    expect(parseRetryAfterMs("3")).toBe(3_000)
  })

  it("prefers Retry-After over retry schedule", () => {
    expect(getRetryDelayMs({ retryAfter: "5", retryDelaysMs: [0, 1_000], attemptIndex: 1 })).toBe(
      5_000,
    )
  })
})
