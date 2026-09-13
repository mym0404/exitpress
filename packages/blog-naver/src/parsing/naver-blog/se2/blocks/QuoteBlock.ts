import { convertHtmlWithImageAssets } from "@exitpress/engine/exporting/assets/convertHtmlWithImageAssets.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createQuoteBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2QuoteBlock extends LeafParserBlock {
  override readonly id = "quote"
  override readonly label = "인용문"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "인용문",
        template: "{{ text.split('\\n').map(line => `> ${line}`).join('\\n') }}",
      },
    ],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "blockquote"
  }

  override convert({ $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const converted = convertHtmlWithImageAssets({
      /* v8 ignore next */
      html: $node.html() ?? "",
      resolveLinkUrl: options.resolveLinkUrl,
    })

    const markdown = converted.text

    if (!markdown) {
      throw new Error("SE2 quote block parsing failed.")
    }

    return [
      {
        ...createQuoteBlock({ blockId, text: markdown }),
        ...(Object.keys(converted.assets).length ? { assets: converted.assets } : {}),
      },
    ]
  }
}
