import { unique } from "@exitpress/engine/shared/collection/util/unique.js"

import type { ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"

import type { BlogEditorParseInput } from "../core/BlogEditorParser.js"

import { BlogEditorParser } from "../core/BlogEditorParser.js"

import { NaverSe2BookWidgetBlock } from "./blocks/BookWidgetBlock.js"
import { NaverSe2CodeBlock } from "./blocks/CodeBlock.js"
import { NaverSe2CommentBlock } from "./blocks/CommentBlock.js"
import { NaverSe2ContainerBlock } from "./blocks/ContainerBlock.js"
import { NaverSe2DividerBlock } from "./blocks/DividerBlock.js"
import { NaverSe2EmbeddedVideoBlock } from "./blocks/EmbeddedVideoBlock.js"
import { NaverSe2HeadingBlock } from "./blocks/HeadingBlock.js"
import { NaverSe2ImageBlock } from "./blocks/ImageBlock.js"
import { NaverSe2InlineGifVideoBlock } from "./blocks/InlineGifVideoBlock.js"
import { NaverSe2LineBreakBlock } from "./blocks/LineBreakBlock.js"
import { NaverSe2PollBlock } from "./blocks/PollBlock.js"
import { NaverSe2QuoteBlock } from "./blocks/QuoteBlock.js"
import { NaverSe2SpacerBlock } from "./blocks/SpacerBlock.js"
import { NaverSe2StyleBlock } from "./blocks/StyleBlock.js"
import { NaverSe2TableBlock } from "./blocks/TableBlock.js"
import { NaverSe2TextElementBlock } from "./blocks/TextElementBlock.js"
import { NaverSe2TextNodeBlock } from "./blocks/TextNodeBlock.js"

export class NaverBlogSE2Editor extends BlogEditorParser {
  override readonly type = "naver-se2"
  override readonly label = "SmartEditor 2"

  protected override readonly supportedBlocks = [
    new NaverSe2StyleBlock(),
    new NaverSe2CommentBlock(),
    new NaverSe2TextNodeBlock(),
    new NaverSe2BookWidgetBlock(),
    new NaverSe2CodeBlock(),
    new NaverSe2TableBlock(),
    new NaverSe2ContainerBlock(),
    new NaverSe2DividerBlock(),
    new NaverSe2LineBreakBlock(),
    new NaverSe2QuoteBlock(),
    new NaverSe2HeadingBlock(),
    new NaverSe2InlineGifVideoBlock(),
    new NaverSe2PollBlock(),
    new NaverSe2EmbeddedVideoBlock(),
    new NaverSe2ImageBlock(),
    new NaverSe2SpacerBlock(),
    new NaverSe2TextElementBlock(),
  ]

  override canParse(html: string) {
    return !html.includes('class="se-component') && !html.includes('class="se_component')
  }

  override parse({
    $,
    tags,
    options,
    captureBlockParseEvidence,
  }: BlogEditorParseInput): ParsedPost {
    const container = $("#viewTypeSelector").first()
    const blocks = this.parseSupportedParserBlocks({
      $,
      nodes: container.contents().toArray(),
      tags,
      options,
      captureBlockParseEvidence,
    })

    return {
      tags: unique(tags),
      blocks,
    } satisfies ParsedPost
  }

  override inspect({ $, tags, options }: BlogEditorParseInput) {
    return this.inspectSupportedParserBlocks({
      $,
      nodes: $("#viewTypeSelector").first().contents().toArray(),
      tags,
      options,
    })
  }
}
