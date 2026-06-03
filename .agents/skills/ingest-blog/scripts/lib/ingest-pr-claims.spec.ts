import { describe, expect, it } from "vitest"

import {
  createIngestBlogPrTitle,
  createSupportUnitClaim,
  parseSupportUnitClaim,
} from "./ingest-pr-claims.js"

describe("ingest PR claims", () => {
  it("parses support unit claim markers from PR bodies", () => {
    const claim = createSupportUnitClaim("naver-se4:v2_poll")

    expect(parseSupportUnitClaim(`body\n${claim}\n`)).toBe("naver-se4:v2_poll")
  })

  it("formats PR titles", () => {
    expect(createIngestBlogPrTitle({ type: "newBlockParser", title: "SE4 poll block 지원" })).toBe(
      "[📦 New Block Parser] SE4 poll block 지원",
    )
    expect(
      createIngestBlogPrTitle({
        type: "parserImprovement",
        title: "[📦 New Block Parser] SE4 quote block 개선",
      }),
    ).toBe("[🎉 Parser Improvement] SE4 quote block 개선")
    expect(
      createIngestBlogPrTitle({
        type: "parserImprovement",
        title: "[🎉 Parser Improvement] SE4 quote block 개선",
      }),
    ).toBe("[🎉 Parser Improvement] SE4 quote block 개선")
  })
})
