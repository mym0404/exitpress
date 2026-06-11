import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2CommentBlock", () => {
  it("skips classic SE object marker comments", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <!-- Not Allowed Attribute Filtered -->
        <p>본문</p>
        <!--__se_object_end -->
      </div>
    `)

    expect(parsed.blocks).toEqual([{ blockId: "naver-se2:paragraph", props: { text: "본문" } }])
  })
})
