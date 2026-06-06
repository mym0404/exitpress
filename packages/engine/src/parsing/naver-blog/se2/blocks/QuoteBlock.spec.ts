import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2QuoteBlock", () => {
  it("parses blockquote tags into quote blocks", () => {
    const parsed = parseSe2Blocks("<blockquote><p>Classic <strong>quote</strong></p></blockquote>")

    expect(parsed.blocks).toEqual([{ type: "quote", text: "Classic **quote**" }])
  })

  it("throws when a quote has no markdown content", () => {
    expect(() => parseSe2Blocks("<blockquote><br /></blockquote>")).toThrow(
      "SE2 quote block parsing failed.",
    )
  })
})
