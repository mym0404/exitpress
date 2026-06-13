import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2LineBreakBlock", () => {
  it("skips standalone br tags instead of keeping rawHtml", () => {
    const parsed = parseSe2Blocks("<br /><br />")

    expect(parsed.blocks).toEqual([])
  })
})
