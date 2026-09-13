import { renderTemplateExpressions } from "@exitpress/domain/template/util/renderTemplateExpressions.js"
import {
  createSe4ModuleScript,
  expectBlockTemplateDefinition,
  parseSe4Blocks,
  parseSe4BlocksWithOptions,
} from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

import { NaverSe4TableBlock } from "./TableBlock.js"

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
      blockId: "naver-se4:table",
      props: {
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
      },
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

it("renders code-bearing table cells as HTML without altering code whitespace or pipes", () => {
  const parsed = parseSe4Blocks(
    '<div class="se-component se-table"><table><tr><td><pre>if (a | b) {\n  return x;\n}</pre></td><td>code</td></tr></table></div>',
  )

  expect(
    renderTemplateExpressions({
      template: new NaverSe4TableBlock().templateDefinition.presets[0].template,
      props: parsed.blocks[0]!.props,
    }),
  ).toBe(
    "<table><tbody><tr><td><pre>if (a | b) {\n  return x;\n}</pre></td><td>code</td></tr></tbody></table>",
  )
})

it("keeps a literal backslash before an escaped table pipe", () => {
  const parsed = parseSe4Blocks(
    String.raw`<div class="se-component se-table"><table><tr><td>path\|value</td><td>tail</td></tr></table></div>`,
  )

  expect(parsed.blocks[0]?.props.rows).toMatchObject([
    [{ text: String.raw`path\\\|value` }, { text: "tail" }],
  ])
})

it("keeps parsed image assets on table blocks", () => {
  const parsed = parseSe4Blocks(
    '<div class="se-component se-table"><table><tr><td><img src="https://example.com/diagram.png"></td><td>label</td></tr></table></div>',
  )

  expect(parsed.blocks[0]?.assets).toMatchObject({
    "rows.0.0.text:image:0": { sourceUrl: "https://example.com/diagram.png" },
    "html:image:0": { sourceUrl: "https://example.com/diagram.png" },
  })
})
