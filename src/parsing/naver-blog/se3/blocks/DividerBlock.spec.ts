import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3DividerBlock", () => {
  it("parses line5 horizontal line components into divider blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_horizontalLine line5">
        <div class="se_horizontalLineView"></div>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "divider" }])
  })
})
