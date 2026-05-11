import { describe, expect, it } from "vitest"
import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2LineBreakBlock", () => {
  it("skips standalone br tags instead of keeping rawHtml", () => {
    const parsed = parseSe2Blocks("<br /><br />")

    expect(parsed.blocks).toEqual([])
  })
})
