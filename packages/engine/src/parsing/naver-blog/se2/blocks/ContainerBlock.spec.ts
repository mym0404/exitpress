import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { load } from "cheerio"
import { describe, expect, it } from "vitest"

import type { ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"

import { BlogEditorParser } from "../../core/BlogEditorParser.js"
import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { NaverSe2ContainerBlock } from "./ContainerBlock.js"
import { NaverSe2TextNodeBlock } from "./TextNodeBlock.js"

class CustomSectionLeafBlock extends LeafParserBlock {
  override readonly id = "customSection"
  override readonly label = "Custom section"

  override match({ node }: Parameters<LeafParserBlock["match"]>[0]) {
    return node.type === "tag" && node.tagName.toLowerCase() === "section"
  }

  override convert({ $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    return [createParagraphBlock({ blockId, text: `custom:${$node.text().trim()}` })]
  }
}

class CustomSe2Editor extends BlogEditorParser {
  override readonly type = "custom-se2"
  override readonly label = "Custom SE2"

  protected override readonly supportedBlocks = [
    new NaverSe2TextNodeBlock(),
    new NaverSe2ContainerBlock(),
    new CustomSectionLeafBlock(),
  ]

  override canParse() {
    return true
  }

  override parse(): ParsedPost {
    const $ = load(customLeafFixture)
    const blocks = this.parseSupportedParserBlocks({
      $,
      nodes: $("#viewTypeSelector").contents().toArray(),
      tags: [],
      options: {
        blockOutputs: defaultExportOptions().blockOutputs,
      },
    })

    return {
      tags: [],
      blocks,
    }
  }
}

const customLeafFixture = `
  <div id="viewTypeSelector">
    <span>
      <section>leaf child</section>
    </span>
  </div>
`

const wrappedLeafFixture = `
  <span>
    <div><p>첫 문단</p></div>
    <div><h2>둘째 제목</h2></div>
    <div><blockquote><p>셋째 인용</p></blockquote></div>
    <div><hr /></div>
    <div><pre>const nested = true</pre></div>
  </span>
`

const wrappedLeafBlocks = [
  { type: "paragraph", text: "첫 문단" },
  { type: "heading", level: 2, text: "둘째 제목" },
  { type: "quote", text: "셋째 인용" },
  { type: "divider" },
  {
    type: "code",
    language: null,
    code: "const nested = true",
  },
]

describe("NaverSe2ContainerBlock", () => {
  it("unwraps malformed inline wrappers that only contain nested block nodes", () => {
    const parsed = parseSe2Blocks(wrappedLeafFixture)

    expect(parsed.blocks).toEqual(wrappedLeafBlocks)
  })

  it("unwraps deeply nested font wrappers that only contain block nodes", () => {
    const parsed = parseSe2Blocks(`
      <font color="#464646">
        <span>
          <span>
            <div>
              <table>
                <tbody>
                  <tr>
                    <td>연말결산</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </span>
        </span>
      </font>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "연말결산" }])
  })

  it("unwraps strong wrappers that only contain table blocks", () => {
    const parsed = parseSe2Blocks(`
      <strong>
        <table>
          <tbody>
            <tr>
              <td>행사명</td>
              <td>DEVIEW</td>
            </tr>
          </tbody>
        </table>
      </strong>
    `)

    expect(parsed.blocks).toMatchObject([
      {
        type: "table",
        rows: [[{ text: "행사명" }, { text: "DEVIEW" }]],
      },
    ])
  })

  it("keeps strong formatting when it wraps inline strike text", () => {
    const parsed = parseSe2Blocks(`
      <strong><strike><span>강조 문장</span></strike></strong>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "**~강조 문장~**" }])
  })

  it("uses the current editor leaf blocks instead of a fixed child tag list", () => {
    const parsed = new CustomSe2Editor().parse()

    expect(parsed.blocks).toEqual([
      { blockId: "custom-se2:customSection", props: { text: "custom:leaf child" } },
    ])
  })

  it("does not treat image-only wrappers as spacers", () => {
    expect(() => parseSe2Blocks(`<p><img alt="" /></p>`)).toThrow(
      "파싱 가능한 naver-se2 block이 없습니다: p",
    )
  })
})
