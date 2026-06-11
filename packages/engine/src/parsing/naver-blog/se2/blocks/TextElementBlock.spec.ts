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

  it("drops Naver blank spacer images from markdown paragraphs", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <a href="https://example.com">reference</a>
        <img src="https://ssl.pstatic.net/static/blog/blank.gif" />
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "[reference](https://example.com)" }])
  })

  it("keeps nested Color Scripter tables parseable as code blocks", () => {
    const parsed = parseSe2Blocks(`
      <div>
        코드 예시
        <span>
          <table class="colorscripter-code-table">
            <tbody>
              <tr>
                <td>
                  <div _foo="padding:0 6px; white-space:pre; line-height:130%">val&nbsp;count&nbsp;=&nbsp;1</div>
                  <div _foo="padding:0 6px; white-space: pre; line-height:130%">println(count)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </span>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "코드 예시" },
      {
        type: "code",
        language: null,
        code: "val count = 1\nprintln(count)",
      },
    ])
  })

  it("escapes angle bracket code-like text in markdown paragraphs", () => {
    const parsed = parseSe2Blocks(`<div>vector&lt;int&gt;와 &lt;br /&gt; 예시</div>`)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "vector\\<int\\>와 \\<br /\\> 예시" },
    ])
  })
})
