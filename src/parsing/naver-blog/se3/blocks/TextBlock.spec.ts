import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3TextBlock", () => {
  it("parses text components into paragraph blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_text">
        <div class="se_textarea">Alpha <strong>beta</strong></div>
        <div class="se_textarea">Gamma</div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "Alpha **beta**" },
      { type: "paragraph", text: "Gamma" },
    ])
    expect(parsed.tags).toEqual(["daily", "legacy"])
  })

  it("preserves hard breaks inside text components", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_text">
        <div class="se_textarea">첫 줄<br>둘째 줄</div>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "첫 줄  \n둘째 줄" }])
  })

  it("skips text components with no text blocks", () => {
    const parsed = parseSe3Blocks(`
        <div class="se_component se_text">
          <div class="se_textarea"><br /></div>
        </div>
      `)

    expect(parsed.blocks).toEqual([])
  })

  it("skips text areas with no html", () => {
    const parsed = parseSe3Blocks(`
        <div class="se_component se_text">
          <div class="se_textarea"></div>
        </div>
      `)

    expect(parsed.blocks).toEqual([])
  })

  it("renders links inline", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_text">
        <div class="se_textarea">Alpha <a href="https://example.com">link</a></div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "Alpha [link](https://example.com)" },
    ])
  })

  it("parses legacy paragraph and section title text components", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_paragraph default">
        <div class="se_textarea">Paragraph text</div>
      </div>
      <div class="se_component se_sectionTitle">
        <div class="se_textarea">Section title text</div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "Paragraph text" },
      { type: "paragraph", text: "Section title text" },
    ])
  })

  it("does not absorb text areas from nested components", () => {
    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_unknown">
          <div class="se_component se_text">
            <div class="se_textarea">Nested text</div>
          </div>
        </div>
      `),
    ).toThrow("파싱 가능한 naver-se3 block이 없습니다")
  })
})
