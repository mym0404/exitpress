import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2TextElementBlock", () => {
  it("falls back to markdown paragraphs for convertible html", () => {
    const parsed = parseSe2Blocks("<div><strong>Fallback</strong> html</div>")

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "**Fallback** html" }])
  })

  it("throws when unsupported html cannot be parsed", () => {
    expect(() => parseSe2Blocks("<section></section>")).toThrow(
      "파싱 가능한 naver-se2 block이 없습니다: section",
    )
  })

  it("does not treat script nodes as text elements", () => {
    expect(() => parseSe2Blocks("<script>alert(1)</script>")).toThrow(
      "파싱 가능한 naver-se2 block이 없습니다: script",
    )
  })

  it("throws when sanitized html drops non-empty noscript text", () => {
    expect(() => parseSe2Blocks("<noscript>fallback text</noscript>")).toThrow(
      "SE2 text element block markdown conversion failed: <noscript>",
    )
  })

  it("renders links inline", () => {
    const parsed = parseSe2Blocks(`<div>Classic <a href="https://example.com">link</a></div>`)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "Classic [link](https://example.com)" },
    ])
  })
})
