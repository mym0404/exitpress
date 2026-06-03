import { describe, expect, it } from "vitest"

import { createSupportUnitPrCheck, extractDiscoveredSupportUnits } from "./ingest-pr-check.js"
import { createSupportUnitClaim } from "./ingest-pr-claims.js"

describe("extractDiscoveredSupportUnits", () => {
  it("reads discovered support units first", () => {
    expect(
      extractDiscoveredSupportUnits({
        discoveredSupportUnits: [
          { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", logNos: ["1"] },
        ],
        allFailureGroups: [
          { supportUnitKey: "naver-se4:v2_map", failureBlockHash: "maphash", logNos: ["2"] },
        ],
      }),
    ).toEqual([
      { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", logNos: ["1"] },
    ])
  })

  it("falls back to failure group fields and merges repeated support units", () => {
    expect(
      extractDiscoveredSupportUnits({
        allFailureGroups: [
          { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", logNos: ["1"] },
          { supportUnitKey: "naver-se4:v2_poll", logNos: ["1", "2"] },
        ],
      }),
    ).toEqual([
      { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", logNos: ["1", "2"] },
    ])
  })
})

describe("createSupportUnitPrCheck", () => {
  it("marks support units as claimed by ready open PR body markers", () => {
    const check = createSupportUnitPrCheck({
      supportUnits: [
        { supportUnitKey: "naver-se4:v2_poll", logNos: ["1"] },
        { supportUnitKey: "naver-se4:v2_map", logNos: ["2"] },
      ],
      pullRequests: [
        { number: 1, isDraft: false, body: createSupportUnitClaim("naver-se4:v2_poll") },
        { number: 2, isDraft: false, body: createSupportUnitClaim("naver-se4:v2_map") },
      ],
    })

    expect(check.complete).toBe(true)
    expect(check.claimedSupportUnitCount).toBe(2)
    expect(check.missingSupportUnits).toEqual([])
    expect(check.draftOnlyClaims).toEqual([])
  })

  it("reports missing support units", () => {
    const check = createSupportUnitPrCheck({
      supportUnits: [
        { supportUnitKey: "naver-se4:v2_poll", logNos: ["1"] },
        { supportUnitKey: "naver-se4:v2_map", logNos: ["2"] },
      ],
      pullRequests: [{ number: 1, body: createSupportUnitClaim("naver-se4:v2_poll") }],
    })

    expect(check.complete).toBe(false)
    expect(check.missingSupportUnits).toEqual([
      { supportUnitKey: "naver-se4:v2_map", logNos: ["2"] },
    ])
  })

  it("does not treat draft PR claims as complete", () => {
    const check = createSupportUnitPrCheck({
      supportUnits: [{ supportUnitKey: "naver-se4:v2_poll", logNos: ["1"] }],
      pullRequests: [
        { number: 1, isDraft: true, body: createSupportUnitClaim("naver-se4:v2_poll") },
      ],
    })

    expect(check.complete).toBe(false)
    expect(check.claimedSupportUnitCount).toBe(0)
    expect(check.missingSupportUnits).toEqual([
      { supportUnitKey: "naver-se4:v2_poll", logNos: ["1"] },
    ])
    expect(check.draftOnlyClaims).toEqual([
      {
        supportUnitKey: "naver-se4:v2_poll",
        pullRequest: {
          number: 1,
          isDraft: true,
          body: createSupportUnitClaim("naver-se4:v2_poll"),
        },
      },
    ])
  })

  it("allows multiple ready PR claims for one support unit", () => {
    const check = createSupportUnitPrCheck({
      supportUnits: [{ supportUnitKey: "naver-se4:v2_poll", logNos: ["1"] }],
      pullRequests: [
        { number: 1, isDraft: false, body: createSupportUnitClaim("naver-se4:v2_poll") },
        { number: 2, isDraft: false, body: createSupportUnitClaim("naver-se4:v2_poll") },
      ],
    })

    expect(check.complete).toBe(true)
    expect(check.claimedSupportUnitCount).toBe(1)
    expect(check.missingSupportUnits).toEqual([])
    expect(check.draftOnlyClaims).toEqual([])
  })
})
