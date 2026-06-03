import { describe, expect, it } from "vitest"

import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2TextNodeBlock", () => {
  it("parses direct text nodes into paragraph blocks", () => {
    const parsed = parseSe2Blocks("plain legacy text")

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "plain legacy text" }])
    expect(parsed.tags).toEqual(["legacy", "archive"])
  })

  it("skips blank text nodes", () => {
    const parsed = parseSe2Blocks("   ")

    expect(parsed.blocks).toEqual([])
  })
})
