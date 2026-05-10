import type { AstBlock, ParsedPost } from "../blocks/Types.js"
import { unique } from "../common/CollectionUtils.js"
import { NaverSe2BookWidgetBlock } from "../blocks/naver-se2/BookWidgetBlock.js"
import { NaverSe2CodeBlock } from "../blocks/naver-se2/CodeBlock.js"
import { NaverSe2CommentBlock } from "../blocks/naver-se2/CommentBlock.js"
import { NaverSe2ContainerBlock } from "../blocks/naver-se2/ContainerBlock.js"
import { NaverSe2DividerBlock } from "../blocks/naver-se2/DividerBlock.js"
import { NaverSe2EmbeddedVideoBlock } from "../blocks/naver-se2/EmbeddedVideoBlock.js"
import { NaverSe2HeadingBlock } from "../blocks/naver-se2/HeadingBlock.js"
import { NaverSe2ImageBlock } from "../blocks/naver-se2/ImageBlock.js"
import { NaverSe2InlineGifVideoBlock } from "../blocks/naver-se2/InlineGifVideoBlock.js"
import { NaverSe2LineBreakBlock } from "../blocks/naver-se2/LineBreakBlock.js"
import { NaverSe2QuoteBlock } from "../blocks/naver-se2/QuoteBlock.js"
import { NaverSe2SpacerBlock } from "../blocks/naver-se2/SpacerBlock.js"
import { NaverSe2TableBlock } from "../blocks/naver-se2/TableBlock.js"
import { NaverSe2TextElementBlock } from "../blocks/naver-se2/TextElementBlock.js"
import { NaverSe2TextNodeBlock } from "../blocks/naver-se2/TextNodeBlock.js"
import { BaseEditor } from "./BaseEditor.js"
import type { BaseEditorParseInput } from "./BaseEditor.js"

export class NaverBlogSE2Editor extends BaseEditor {
  override readonly type = "naver-se2"
  override readonly label = "SmartEditor 2"

  protected override readonly supportedBlocks = [
    new NaverSe2CommentBlock(),
    new NaverSe2TextNodeBlock(),
    new NaverSe2BookWidgetBlock(),
    new NaverSe2TableBlock(),
    new NaverSe2ContainerBlock(),
    new NaverSe2DividerBlock(),
    new NaverSe2LineBreakBlock(),
    new NaverSe2QuoteBlock(),
    new NaverSe2HeadingBlock(),
    new NaverSe2CodeBlock(),
    new NaverSe2InlineGifVideoBlock(),
    new NaverSe2EmbeddedVideoBlock(),
    new NaverSe2ImageBlock(),
    new NaverSe2SpacerBlock(),
    new NaverSe2TextElementBlock(),
  ]

  override canParse(html: string) {
    return !html.includes('class="se-component') && !html.includes('class="se_component')
  }

  override parse({ $, tags, options, captureBlockEvidence }: BaseEditorParseInput): ParsedPost {
    const container = $("#viewTypeSelector").first()
    const blocks = this.runBlocks({
      $,
      nodes: container.contents().toArray(),
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

  override inspect({ $, tags, options }: BaseEditorParseInput) {
    return this.inspectBlocks({
      $,
      nodes: $("#viewTypeSelector").first().contents().toArray(),
      tags,
      options,
    })
  }
}
