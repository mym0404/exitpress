import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4HeadingBlock", () => {
  it("parses section title components into heading blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-sectionTitle">
        <div class="se-module-text"><span>Section title</span></div>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "heading", level: 2, text: "Section title" }])
  })

  it("skips empty section title components", () => {
    const parsed = parseSe4Blocks(`
        <div class="se-component se-sectionTitle">
          <div class="se-module-text"><br /></div>
        </div>
      `)

    expect(parsed.blocks).toEqual([])
  })

  it("throws when a section title has no text module", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-sectionTitle"></div>
      `),
    ).toThrow("SE4 heading block parsing failed.")
  })
})
