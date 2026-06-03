import { describe, expect, it } from "vitest"

import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2HeadingBlock", () => {
  it("parses heading tags into heading blocks", () => {
    const parsed = parseSe2Blocks("<h3>Legacy heading</h3>")

    expect(parsed.blocks).toEqual([{ type: "heading", level: 3, text: "Legacy heading" }])
  })

  it("throws when a heading has no text", () => {
    expect(() => parseSe2Blocks("<h2><br /></h2>")).toThrow(
      "SE2 heading block parsing failed: <h2>",
    )
  })

  it("throws when a heading has no html", () => {
    expect(() => parseSe2Blocks("<h2></h2>")).toThrow("SE2 heading block parsing failed: <h2>")
  })
})
