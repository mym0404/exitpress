import {
  createSe4ModuleScript,
  expectBlockTemplateDefinition,
  parseSe4Blocks,
  parseSe4BlocksWithOptions,
} from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe4TableBlock", () => {
  it("parses simple table components into table blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-table">
        ${createSe4ModuleScript({ type: "v2_table" })}
        <table>
          <tr><th>name</th><th>value</th></tr>
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
          { text: "name", colspan: 1, rowspan: 1, isHeader: true },
          { text: "value", colspan: 1, rowspan: 1, isHeader: true },
        ],
        [
          { text: "a", colspan: 1, rowspan: 1, isHeader: false },
          { text: "1", colspan: 1, rowspan: 1, isHeader: false },
        ],
      ],
    })
  })

  it("throws when a table component has no table element", () => {
    expect(() =>
      parseSe4Blocks(`
      <div class="se-component se-table">
        ${createSe4ModuleScript({ type: "v2_table" })}
        <div class="se-table-placeholder"></div>
      </div>
      `),
    ).toThrow("SE4 table block parsing failed.")
  })

  it("applies every output option", () => {
    expectBlockTemplateDefinition({
      editorType: "naver-se4",
      blockId: "table",
      parse: (blockOutputs) =>
        parseSe4BlocksWithOptions({
          blockOutputs,
          components: [
            `
              <div class="se-component se-table">
                ${createSe4ModuleScript({ type: "v2_table" })}
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
