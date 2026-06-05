import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createQuoteBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe2QuoteBlock extends LeafBlock {
  override readonly id = "quote"
  override readonly label = "인용문"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "> ${text}",
      },
    ],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "blockquote"
  }

  override convert({ $node, options, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    const markdown = convertHtmlToMarkdown({
      /* v8 ignore next */
      html: $node.html() ?? "",
      resolveLinkUrl: options.resolveLinkUrl,
    })

    if (!markdown) {
      throw new Error("SE2 quote block parsing failed.")
    }

    return [createQuoteBlock({ blockId, text: markdown })]
  }
}
