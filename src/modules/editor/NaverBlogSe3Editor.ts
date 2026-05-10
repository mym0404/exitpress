import type { ParsedPost } from "../blocks/Types.js"
import { unique } from "../common/CollectionUtils.js"
import { NaverSe3CodeBlock } from "../blocks/naver-se3/CodeBlock.js"
import { NaverSe3DocumentTitleBlock } from "../blocks/naver-se3/DocumentTitleBlock.js"
import { NaverSe3ImageBlock } from "../blocks/naver-se3/ImageBlock.js"
import { NaverSe3LinkCardBlock } from "../blocks/naver-se3/LinkCardBlock.js"
import { NaverSe3QuoteBlock } from "../blocks/naver-se3/QuoteBlock.js"
import { NaverSe3TableBlock } from "../blocks/naver-se3/TableBlock.js"
import { NaverSe3TextBlock } from "../blocks/naver-se3/TextBlock.js"
import { BaseEditor } from "./BaseEditor.js"
import type { BaseEditorParseInput } from "./BaseEditor.js"

export class NaverBlogSE3Editor extends BaseEditor {
  override readonly type = "naver-se3"
  override readonly label = "SmartEditor 3"

  protected override readonly supportedBlocks = [
    new NaverSe3DocumentTitleBlock(),
    new NaverSe3TableBlock(),
    new NaverSe3QuoteBlock(),
    new NaverSe3CodeBlock(),
    new NaverSe3LinkCardBlock(),
    new NaverSe3ImageBlock(),
    new NaverSe3TextBlock(),
  ]

  override canParse(html: string) {
    return (
      html.replaceAll("&#034;", "\"").match(/smartEditorVersion["']?\s*:\s*["']?(\d+)["']?/i)?.[1] ===
        "3" || html.includes('class="se_component')
    )
  }

  override parse({ $, tags, options, captureBlockEvidence }: BaseEditorParseInput): ParsedPost {
    const container = $("#viewTypeSelector .se_component_wrap.sect_dsc").first()
    const blocks = this.runBlocks({
      $,
      nodes: container.children(".se_component").toArray(),
      tags,
      options,
      captureBlockEvidence,
    })

    return {
      tags: unique(tags),
      blocks,
      videos: [],
    } satisfies ParsedPost
  }

  override inspect({ $, tags, options }: BaseEditorParseInput) {
    return this.inspectBlocks({
      $,
      nodes: $("#viewTypeSelector .se_component_wrap.sect_dsc").first().children(".se_component").toArray(),
      tags,
      options,
    })
  }
}
