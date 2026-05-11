import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4QuoteBlock", () => {
  it("parses quotation components into quote blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-quotation">
        <blockquote class="se-quotation-container"><p>Quoted <strong>text</strong></p></blockquote>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "quote", text: "Quoted **text**" }])
  })

  it("skips quotations with no markdown content", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-quotation">
        <blockquote class="se-quotation-container"><br /></blockquote>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })
})
