import { convertHtmlToMarkdown } from "@exitpress/engine/markdown/utils/convertHtmlToMarkdown.js"
import { compactMarkdownText } from "@exitpress/engine/shared/text/TextUtils.js"

import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

const textComponentClasses = ["se_text", "se_paragraph", "se_sectionTitle"]

const parseTextNodes = ({
  $,
  $component,
  options,
  selector,
}: {
  $: CheerioAPI
  $component: ReturnType<CheerioAPI>
  options: ParserBlockContext["options"]
  selector: string
}) =>
  findInComponentRoot({ $, $component, selector })
    .toArray()
    .map((node) =>
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $(node).html() ?? "",
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )
    .map((text) => compactMarkdownText(text))
    .filter(Boolean)

const parseTextBlocks = ({
  $,
  $component,
  blockId,
  options,
}: {
  $: CheerioAPI
  $component: ReturnType<CheerioAPI>
  blockId: string
  options: ParserBlockContext["options"]
}) =>
  parseTextNodes({ $, $component, options, selector: ".se_textarea" })
    .concat(parseTextNodes({ $, $component, options, selector: ".se_textView" }))
    .filter((text, index, texts) => texts.indexOf(text) === index)
    .map((text) => createParagraphBlock({ blockId, text }))

export class NaverSe3TextBlock extends LeafParserBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $, $node }: ParserBlockContext) {
    return (
      textComponentClasses.some((className) => $node.hasClass(className)) &&
      findInComponentRoot({ $, $component: $node, selector: ".se_textarea" }).length > 0
    )
  }

  override convert({ $, $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const blocks = parseTextBlocks({ $, $component: $node, blockId, options })

    if (blocks.length === 0) {
      return []
    }

    return blocks
  }
}
