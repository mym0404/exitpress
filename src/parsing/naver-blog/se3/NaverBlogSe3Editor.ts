import type { AstBlock, ParsedPost } from "../../../domain/ast/Types.js"
import type { BaseEditorParseInput } from "../core/BaseEditor.js"
import { unique } from "../../../shared/collection/CollectionUtils.js"
import { BaseEditor } from "../core/BaseEditor.js"
import { NaverSe3CodeBlock } from "./blocks/CodeBlock.js"
import { NaverSe3DividerBlock } from "./blocks/DividerBlock.js"
import { NaverSe3DocumentTitleBlock } from "./blocks/DocumentTitleBlock.js"
import { NaverSe3FileBlock } from "./blocks/FileBlock.js"
import { NaverSe3ImageBlock } from "./blocks/ImageBlock.js"
import { NaverSe3LinkCardBlock } from "./blocks/LinkCardBlock.js"
import { NaverSe3MapBlock } from "./blocks/MapBlock.js"
import { NaverSe3MapTextBlock } from "./blocks/MapTextBlock.js"
import { NaverSe3QuoteBlock } from "./blocks/QuoteBlock.js"
import { NaverSe3SubjectMatterBlock } from "./blocks/SubjectMatterBlock.js"
import { NaverSe3TableBlock } from "./blocks/TableBlock.js"
import { NaverSe3TextBlock } from "./blocks/TextBlock.js"
import { NaverSe3VideoBlock } from "./blocks/VideoBlock.js"

export class NaverBlogSE3Editor extends BaseEditor {
  override readonly type = "naver-se3"
  override readonly label = "SmartEditor 3"

  protected override readonly supportedBlocks = [
    new NaverSe3DocumentTitleBlock(),
    new NaverSe3DividerBlock(),
    new NaverSe3TableBlock(),
    new NaverSe3QuoteBlock(),
    new NaverSe3CodeBlock(),
    new NaverSe3LinkCardBlock(),
    new NaverSe3MapBlock(),
    new NaverSe3MapTextBlock(),
    new NaverSe3VideoBlock(),
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

  override parse({
    $,
    sourceUrl = "",
    tags,
    options,
    captureBlockEvidence,
  }: BaseEditorParseInput): ParsedPost {
    const container = $("#viewTypeSelector .se_component_wrap.sect_dsc").first()
    const blocks = this.runBlocks({
      $,
      nodes: container.children(".se_component").toArray(),
      sourceUrl,
      tags,
      options,
      captureBlockEvidence,
    })
    const videos = blocks
      .filter((block): block is Extract<AstBlock, { type: "video" }> => block.type === "video")
      .map((block) => block.video)

    return {
      tags: unique(tags),
      blocks,
      videos,
    } satisfies ParsedPost
  }

  override inspect({ $, sourceUrl = "", tags, options }: BaseEditorParseInput) {
    return this.inspectBlocks({
      $,
      nodes: $("#viewTypeSelector .se_component_wrap.sect_dsc")
        .first()
        .children(".se_component")
        .toArray(),
      sourceUrl,
      tags,
      options,
    })
  }
}
