import { load } from "cheerio"
import { describe, expect, it } from "vitest"

import { NaverSe2ContainerBlock } from "./ContainerBlock.js"
import { NaverSe2TextNodeBlock } from "./TextNodeBlock.js"
import { LeafBlock } from "../BaseBlock.js"
import { BaseEditor } from "../../editor/BaseEditor.js"
import { defaultExportOptions } from "../../exporter/ExportOptions.js"
import type { AstBlock, ParsedPost } from "../Types.js"
import { parseSe2Blocks } from "../../../../tests/helpers/parser-test-utils.js"

class CustomSectionLeafBlock extends LeafBlock {
  override readonly id = "customSection"
  override readonly label = "Custom section"

  override match({ node }: Parameters<LeafBlock["match"]>[0]) {
    return node.type === "tag" && node.tagName.toLowerCase() === "section"
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    return [{ type: "paragraph" as const, text: `custom:${$node.text().trim()}` }]
  }
}

class CustomSe2Editor extends BaseEditor {
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
    const blocks = this.runBlocks({
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
      videos: [],
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

const wrappedLeafBlocks: AstBlock[] = [
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

  it("uses the current editor leaf blocks instead of a fixed child tag list", () => {
    const parsed = new CustomSe2Editor().parse()

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "custom:leaf child" }])
  })

  it("does not treat image-only wrappers as spacers", () => {
    expect(() => parseSe2Blocks(`<p><img alt="" /></p>`)).toThrow(
      "파싱 가능한 naver-se2 block이 없습니다: p",
    )
  })
})
