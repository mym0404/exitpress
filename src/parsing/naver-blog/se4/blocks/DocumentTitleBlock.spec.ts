import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4DocumentTitleBlock", () => {
  it("skips document title components", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-documentTitle">
        <div class="se-module-text">Document title</div>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })
})
