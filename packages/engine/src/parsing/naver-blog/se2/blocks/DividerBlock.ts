import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createDividerBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2DividerBlock extends LeafParserBlock {
  override readonly id = "divider"
  override readonly label = "구분선"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "---" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "hr"
  }

  override convert({ blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    return [createDividerBlock({ blockId })]
  }
}
