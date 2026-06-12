import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2DividerBlock", () => {
  it("parses hr tags into divider blocks", () => {
    const parsed = parseSe2Blocks("<hr />")

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:divider",
        props: {},
      },
    ])
  })
})
