import { convertHtmlWithImageAssets } from "@exitpress/engine/exporting/assets/convertHtmlWithImageAssets.js"
import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2TextElementBlock extends LeafParserBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "본문", template: "{{ text }}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node, $node }: ParserBlockContext) {
    if (node.type !== "tag") {
      return false
    }

    if (compactText($node.text()) === "") {
      return false
    }

    return !["table", "hr", "br", "blockquote", "pre"].includes(node.tagName.toLowerCase())
  }

  override convert({
    $,
    $node,
    node,
    options,
    blockId,
  }: Parameters<LeafParserBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (node.type !== "tag") {
      throw new Error("SE2 text element block received a non-tag node.")
    }

    /* v8 ignore next */
    const html = $.html($node) ?? ""
    const converted = convertHtmlWithImageAssets({
      html,
      resolveLinkUrl: options.resolveLinkUrl,
    })

    const markdown = converted.text

    if (markdown) {
      return [
        {
          ...createParagraphBlock({ blockId, text: markdown }),
          ...(Object.keys(converted.assets).length ? { assets: converted.assets } : {}),
        },
      ]
    }

    const text = compactText($node.text())

    /* v8 ignore next 3 */
    if (!text) {
      throw new Error(`SE2 text element block parsing failed: <${node.tagName.toLowerCase()}>`)
    }

    throw new Error(
      `SE2 text element block markdown conversion failed: <${node.tagName.toLowerCase()}>`,
    )
  }
}
