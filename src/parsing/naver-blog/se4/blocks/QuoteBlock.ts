import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { convertHtmlToMarkdown } from "../../../../markdown/TurndownMarkdownConverter.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe4QuoteBlock extends LeafBlock {
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

  override match({ hasQuote }: ParserBlockContext) {
    return Boolean(hasQuote)
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const quoteMarkdown = convertHtmlToMarkdown({
      /* v8 ignore next */
      html: $node.find("blockquote.se-quotation-container").html() ?? "",
      resolveLinkUrl: options.resolveLinkUrl,
    })

    return quoteMarkdown ? [{ type: "quote" as const, text: quoteMarkdown }] : []
  }
}
