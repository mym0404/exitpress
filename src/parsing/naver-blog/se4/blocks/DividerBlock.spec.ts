import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4DividerBlock", () => {
  it("parses horizontal line components into divider blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-horizontalLine"></div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "divider",
      },
    ])
  })
})
