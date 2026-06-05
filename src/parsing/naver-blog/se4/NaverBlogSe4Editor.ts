import type { AnyNode } from "domhandler"

import type { ParsedPost } from "../../../domain/parser/Types.js"
import type { BlogEditorParseInput } from "../core/BlogEditorParser.js"

import { unique } from "../../../shared/collection/CollectionUtils.js"
import { BlogEditorParser } from "../core/BlogEditorParser.js"
import { parseJsonAttribute } from "../core/JsonAttribute.js"

import { NaverSe4CodeBlock } from "./blocks/CodeBlock.js"
import { NaverSe4DividerBlock } from "./blocks/DividerBlock.js"
import { NaverSe4DocumentTitleBlock } from "./blocks/DocumentTitleBlock.js"
import { NaverSe4FileBlock } from "./blocks/FileBlock.js"
import { NaverSe4FormulaBlock } from "./blocks/FormulaBlock.js"
import { NaverSe4HeadingBlock } from "./blocks/HeadingBlock.js"
import { NaverSe4ImageBlock } from "./blocks/ImageBlock.js"
import { NaverSe4ImageGroupBlock } from "./blocks/ImageGroupBlock.js"
import { NaverSe4ImageStripBlock } from "./blocks/ImageStripBlock.js"
import { NaverSe4LinkCardBlock } from "./blocks/LinkCardBlock.js"
import { NaverSe4MapBlock } from "./blocks/MapBlock.js"
import { NaverSe4MaterialBlock } from "./blocks/MaterialBlock.js"
import { NaverSe4MrBlogBlock } from "./blocks/MrBlogBlock.js"
import { NaverSe4OembedBlock } from "./blocks/OembedBlock.js"
import { NaverSe4QuoteBlock } from "./blocks/QuoteBlock.js"
import { NaverSe4ScheduleBlock } from "./blocks/ScheduleBlock.js"
import { NaverSe4StickerBlock } from "./blocks/StickerBlock.js"
import { NaverSe4TableBlock } from "./blocks/TableBlock.js"
import { NaverSe4TalkTalkBlock } from "./blocks/TalkTalkBlock.js"
import { NaverSe4TextBlock } from "./blocks/TextBlock.js"
import { NaverSe4VideoBlock } from "./blocks/VideoBlock.js"
import { NaverSe4WrappingParagraphBlock } from "./blocks/WrappingParagraphBlock.js"

export class NaverBlogSE4Editor extends BlogEditorParser {
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
    new NaverSe4ScheduleBlock(),
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
      html
        .replaceAll("&#034;", '"')
        .match(/smartEditorVersion["']?\s*:\s*["']?(\d+)["']?/i)?.[1] === "4" ||
      html.includes('class="se-component')
    )
  }

  override parse({
    $,
    sourceUrl = "",
    tags,
    options,
    captureBlockParseEvidence,
  }: BlogEditorParseInput): ParsedPost {
    const blocks = this.parseSupportedParserBlocks({
      $,
      nodes: $("#viewTypeSelector .se-component").toArray(),
      sourceUrl,
      tags,
      options,
      captureBlockParseEvidence,
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

    return {
      tags: unique(tags),
      blocks,
    } satisfies ParsedPost
  }

  override inspect({ $, sourceUrl = "", tags, options }: BlogEditorParseInput) {
    return this.inspectSupportedParserBlocks({
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
