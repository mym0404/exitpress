import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3DividerBlock", () => {
  it("parses default horizontal line components into divider blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_horizontalLine default">
        <div class="se_sectionArea">
          <div class="se_editArea">
            <div class="viewArea">
              <div class="se_horizontalLineView">
                <div class="se_hr"><hr /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "divider",
      },
    ])
  })

  it("parses line2 horizontal line components into divider blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_horizontalLine line2">
        <div class="se_horizontalLineView"></div>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ type: "divider" }])
  })
})
