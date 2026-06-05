import { describe, expect, it } from "vitest"

import {
  expectBlockTemplateDefinition,
  parseSe3Blocks,
  parseSe3BlocksWithOptions,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3TableBlock", () => {
  it("parses table components into table blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_table">
        <table>
          <tr><th>h</th><th>v</th></tr>
          <tr><td>a</td><td>1</td></tr>
        </table>
      </div>
    `)

    expect(parsed.blocks).toHaveLength(1)
    expect(parsed.blocks[0]).toMatchObject({
      type: "table",
      complex: false,
      rows: [
        [
          { text: "h", isHeader: true },
          { text: "v", isHeader: true },
        ],
        [
          { text: "a", isHeader: false },
          { text: "1", isHeader: false },
        ],
      ],
    })
  })

  it("applies every output option", () => {
    expectBlockTemplateDefinition({
      editorType: "naver-se3",
      blockId: "table",
      parse: (blockOutputs) =>
        parseSe3BlocksWithOptions({
          blockOutputs,
          components: [
            `
              <div class="se_component se_table">
                <table>
                  <tr><th>name</th><th>value</th></tr>
                  <tr><td>alpha</td><td>1</td></tr>
                </table>
              </div>
            `,
          ],
        }),
    })
  })
})
