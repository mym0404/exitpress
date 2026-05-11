import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3DocumentTitleBlock", () => {
  it("skips document title components", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_documentTitle">
        <div class="se_textarea">Document title</div>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })
})
