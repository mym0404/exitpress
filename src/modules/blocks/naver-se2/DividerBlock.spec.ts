import { describe, expect, it } from "vitest"

import { parseSe2Blocks } from "../../../../tests/helpers/parser-test-utils.js"

describe("NaverSe2DividerBlock", () => {
  it("parses hr tags into divider blocks", () => {
    const parsed = parseSe2Blocks("<hr />")

    expect(parsed.blocks).toEqual([
      {
        type: "divider",
      },
    ])
  })
})
