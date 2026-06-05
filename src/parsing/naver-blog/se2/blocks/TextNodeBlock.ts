import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe2TextNodeBlock extends LeafBlock {
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

  override convert({ node, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next */
    const text = node.type === "text" ? compactText(node.data ?? "") : ""

    return text ? [createParagraphBlock({ blockId, text })] : []
  }
}
