import { parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe4MrBlogBlock", () => {
  it("parses mrBlog components into quote blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-mrBlog se-l-default">
        <strong class="se-mrBlog-from">From, 블로그씨</strong>
        <p class="se-mrBlog-question">
          이러지 마 제발~ 정말 듣기 싫은 잔소리 TOP 3는 무엇인가요?
        </p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "quote",
        text: "From, 블로그씨\n\n이러지 마 제발~ 정말 듣기 싫은 잔소리 TOP 3는 무엇인가요?",
      },
    ])
  })

  it("throws when an mrBlog component has no visible text", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-mrBlog"></div>
      `),
    ).toThrow("SE4 mrBlog block parsing failed.")
  })
})
