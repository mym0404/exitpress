import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2TextNodeBlock", () => {
  it("parses direct text nodes into paragraph blocks", () => {
    const parsed = parseSe2Blocks("plain classic text")

    expect(parsed.blocks).toEqual([
      { blockId: "naver-se2:paragraph", props: { text: "plain classic text" } },
    ])
    expect(parsed.tags).toEqual(["classic", "archive"])
  })

  it("skips blank text nodes", () => {
    const parsed = parseSe2Blocks("   ")

    expect(parsed.blocks).toEqual([])
  })
})
