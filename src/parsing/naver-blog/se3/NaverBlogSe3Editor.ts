import type { ParsedPost } from "../../../domain/ast/Types.js"
import type { BaseEditorParseInput } from "../core/BaseEditor.js"
import { unique } from "../../../shared/collection/CollectionUtils.js"
import { BaseEditor } from "../core/BaseEditor.js"
import { NaverSe3CodeBlock } from "./blocks/CodeBlock.js"
import { NaverSe3DocumentTitleBlock } from "./blocks/DocumentTitleBlock.js"
import { NaverSe3FileBlock } from "./blocks/FileBlock.js"
import { NaverSe3ImageBlock } from "./blocks/ImageBlock.js"
import { NaverSe3LinkCardBlock } from "./blocks/LinkCardBlock.js"
import { NaverSe3QuoteBlock } from "./blocks/QuoteBlock.js"
import { NaverSe3SubjectMatterBlock } from "./blocks/SubjectMatterBlock.js"
import { NaverSe3TableBlock } from "./blocks/TableBlock.js"
import { NaverSe3TextBlock } from "./blocks/TextBlock.js"

export class NaverBlogSE3Editor extends BaseEditor {
  override readonly type = "naver-se3"
  override readonly label = "SmartEditor 3"

  protected override readonly supportedBlocks = [
    new NaverSe3DocumentTitleBlock(),
    new NaverSe3TableBlock(),
    new NaverSe3QuoteBlock(),
    new NaverSe3CodeBlock(),
    new NaverSe3LinkCardBlock(),
    new NaverSe3FileBlock(),
    new NaverSe3SubjectMatterBlock(),
    new NaverSe3ImageBlock(),
    new NaverSe3TextBlock(),
  ]

  override canParse(html: string) {
    return (
      html
        .replaceAll("&#034;", '"')
        .match(/smartEditorVersion["']?\s*:\s*["']?(\d+)["']?/i)?.[1] === "3" ||
      html.includes('class="se_component')
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
      nodes: $("#viewTypeSelector .se_component_wrap.sect_dsc")
        .first()
        .children(".se_component")
        .toArray(),
      tags,
      options,
    })
  }
}
