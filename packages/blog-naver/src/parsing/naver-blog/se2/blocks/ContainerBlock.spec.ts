import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { load } from "cheerio"
import { describe, expect, it } from "vitest"

import type { ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"

import type { ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { BlogEditorParser } from "../../core/BlogEditorParser.js"
import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { NaverSe2ContainerBlock } from "./ContainerBlock.js"
import { NaverSe2TextNodeBlock } from "./TextNodeBlock.js"

class CustomSectionLeafBlock extends LeafParserBlock {
  override readonly id = "customSection"
  override readonly label = "Custom section"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "paragraph", label: "본문", template: "{{ text }}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

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
  { blockId: "naver-se2:paragraph", props: { text: "첫 문단" } },
  { blockId: "naver-se2:heading", props: { level: 2, text: "둘째 제목" } },
  { blockId: "naver-se2:quote", props: { text: "셋째 인용" } },
  { blockId: "naver-se2:divider", props: {} },
  {
    blockId: "naver-se2:code",
    props: {
      language: null,
      code: "const nested = true",
    },
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

    expect(parsed.blocks).toEqual([{ blockId: "naver-se2:paragraph", props: { text: "연말결산" } }])
  })

  it("unwraps text wrappers that mix paragraphs and Color Scripter code tables", () => {
    const parsed = parseSe2Blocks(`
      <div>
        해결책은 다음과 같다.
        <table class="colorscripter-code-table">
          <tbody>
            <tr>
              <td>
                <div>
                  <div style="white-space:pre"><span>interface</span>&nbsp;EventHandler&nbsp;{</div>
                  <div style="white-space:pre">&nbsp;&nbsp;fun&nbsp;onSee()</div>
                  <div style="white-space:pre">}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        이후 설명
      </div>
    `)

    expect(parsed.blocks).toEqual([
      { blockId: "naver-se2:paragraph", props: { text: "해결책은 다음과 같다." } },
      {
        blockId: "naver-se2:code",
        props: {
          language: null,
          code: "interface EventHandler {\n  fun onSee()\n}",
        },
      },
      { blockId: "naver-se2:paragraph", props: { text: "이후 설명" } },
    ])
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
        blockId: "naver-se2:table",
        props: {
          rows: [[{ text: "행사명" }, { text: "DEVIEW" }]],
        },
      },
    ])
  })

  it("keeps strong formatting when it wraps inline strike text", () => {
    const parsed = parseSe2Blocks(`
      <strong><strike><span>강조 문장</span></strike></strong>
    `)

    expect(parsed.blocks).toEqual([
      { blockId: "naver-se2:paragraph", props: { text: "**~강조 문장~**" } },
    ])
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
