import { describe, expect, it } from "vitest"

import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2CommentBlock", () => {
  it("skips legacy SE object marker comments", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <!-- Not Allowed Attribute Filtered -->
        <p>본문</p>
        <!--__se_object_end -->
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "본문" }])
  })
})
