import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3QuoteBlock", () => {
  it("parses quote components into quote blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_quote">
        <blockquote><p>Quoted <strong>SE3</strong></p></blockquote>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "quote", text: "Quoted **SE3**" }])
  })

  it("throws when a quote has no markdown content", () => {
    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_quote">
          <blockquote><br /></blockquote>
        </div>
      `),
    ).toThrow("SE3 quote block parsing failed.")
  })
})
