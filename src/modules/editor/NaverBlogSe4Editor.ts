import type { AnyNode } from "domhandler"

import type { AstBlock, ParsedPost } from "../blocks/Types.js"
import type { UnknownRecord } from "../common/Types.js"
import { unique } from "../common/CollectionUtils.js"
import { NaverSe4CodeBlock } from "../blocks/naver-se4/CodeBlock.js"
import { NaverSe4DividerBlock } from "../blocks/naver-se4/DividerBlock.js"
import { NaverSe4DocumentTitleBlock } from "../blocks/naver-se4/DocumentTitleBlock.js"
import { NaverSe4FileBlock } from "../blocks/naver-se4/FileBlock.js"
import { NaverSe4FormulaBlock } from "../blocks/naver-se4/FormulaBlock.js"
import { NaverSe4HeadingBlock } from "../blocks/naver-se4/HeadingBlock.js"
import { NaverSe4ImageBlock } from "../blocks/naver-se4/ImageBlock.js"
import { NaverSe4ImageGroupBlock } from "../blocks/naver-se4/ImageGroupBlock.js"
import { NaverSe4ImageStripBlock } from "../blocks/naver-se4/ImageStripBlock.js"
import { NaverSe4LinkCardBlock } from "../blocks/naver-se4/LinkCardBlock.js"
import { NaverSe4MapBlock } from "../blocks/naver-se4/MapBlock.js"
import { NaverSe4MaterialBlock } from "../blocks/naver-se4/MaterialBlock.js"
import { NaverSe4MrBlogBlock } from "../blocks/naver-se4/MrBlogBlock.js"
import { NaverSe4OembedBlock } from "../blocks/naver-se4/OembedBlock.js"
import { NaverSe4QuoteBlock } from "../blocks/naver-se4/QuoteBlock.js"
import { NaverSe4StickerBlock } from "../blocks/naver-se4/StickerBlock.js"
import { NaverSe4TableBlock } from "../blocks/naver-se4/TableBlock.js"
import { NaverSe4TalkTalkBlock } from "../blocks/naver-se4/TalkTalkBlock.js"
import { NaverSe4TextBlock } from "../blocks/naver-se4/TextBlock.js"
import { NaverSe4VideoBlock } from "../blocks/naver-se4/VideoBlock.js"
import { NaverSe4WrappingParagraphBlock } from "../blocks/naver-se4/WrappingParagraphBlock.js"
import { BaseEditor } from "./BaseEditor.js"
import type { BaseEditorParseInput } from "./BaseEditor.js"

const parseJsonAttribute = (value: string | undefined) => {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as UnknownRecord
  } catch {
    return null
  }
}

export class NaverBlogSE4Editor extends BaseEditor {
  override readonly type = "naver-se4"
  override readonly label = "SmartEditor 4"

  protected override readonly supportedBlocks = [
    new NaverSe4DocumentTitleBlock(),
    new NaverSe4FormulaBlock(),
    new NaverSe4CodeBlock(),
    new NaverSe4LinkCardBlock(),
    new NaverSe4FileBlock(),
    new NaverSe4VideoBlock(),
    new NaverSe4OembedBlock(),
    new NaverSe4MapBlock(),
    new NaverSe4TalkTalkBlock(),
    new NaverSe4TableBlock(),
    new NaverSe4ImageStripBlock(),
    new NaverSe4ImageGroupBlock(),
    new NaverSe4StickerBlock(),
    new NaverSe4ImageBlock(),
    new NaverSe4WrappingParagraphBlock(),
    new NaverSe4HeadingBlock(),
    new NaverSe4DividerBlock(),
    new NaverSe4QuoteBlock(),
    new NaverSe4MrBlogBlock(),
    new NaverSe4TextBlock(),
    new NaverSe4MaterialBlock(),
  ]

  override canParse(html: string) {
    return (
      html.replaceAll("&#034;", "\"").match(/smartEditorVersion["']?\s*:\s*["']?(\d+)["']?/i)?.[1] ===
        "4" || html.includes('class="se-component')
    )
  }

  override parse({ $, sourceUrl = "", tags, options, captureBlockEvidence }: BaseEditorParseInput): ParsedPost {
    const blocks = this.runBlocks({
      $,
      nodes: $("#viewTypeSelector .se-component").toArray(),
      sourceUrl,
      tags,
      options,
      captureBlockEvidence,
      moduleContext: (node: AnyNode) => {
        const $component = $(node)
        const moduleScript = $component.find("script.__se_module_data").first()
        const moduleData =
          parseJsonAttribute(moduleScript.attr("data-module-v2")) ??
          parseJsonAttribute(moduleScript.attr("data-module"))

        return {
          moduleData,
          moduleType: typeof moduleData?.type === "string" ? moduleData.type : null,
          hasQuote: $component.find("blockquote.se-quotation-container").length > 0,
        }
      },
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
      nodes: $("#viewTypeSelector .se-component").toArray(),
      sourceUrl,
      tags,
      options,
      moduleContext: (node: AnyNode) => {
        const $component = $(node)
        const moduleScript = $component.find("script.__se_module_data").first()
        const moduleData =
          parseJsonAttribute(moduleScript.attr("data-module-v2")) ??
          parseJsonAttribute(moduleScript.attr("data-module"))

        return {
          moduleData,
          moduleType: typeof moduleData?.type === "string" ? moduleData.type : null,
          hasQuote: $component.find("blockquote.se-quotation-container").length > 0,
        }
      },
    })
  }
}
