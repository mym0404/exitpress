import { describe, expect, it } from "vitest"
import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2QuoteBlock", () => {
  it("parses blockquote tags into quote blocks", () => {
    const parsed = parseSe2Blocks("<blockquote><p>Legacy <strong>quote</strong></p></blockquote>")

    expect(parsed.blocks).toEqual([{ type: "quote", text: "Legacy **quote**" }])
  })

  it("throws when a quote has no markdown content", () => {
    expect(() => parseSe2Blocks("<blockquote><br /></blockquote>")).toThrow(
      "SE2 quote block parsing failed.",
    )
  })
})
