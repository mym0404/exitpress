import { compactText } from "@exitpress/engine/shared/text/TextUtils.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2TextNodeBlock extends LeafParserBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "text"
  }

  override convert({ node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    /* v8 ignore next */
    const text = node.type === "text" ? compactText(node.data ?? "") : ""

    return text ? [createParagraphBlock({ blockId, text })] : []
  }
}
