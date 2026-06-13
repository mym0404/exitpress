import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2LineBreakBlock extends LeafParserBlock {
  override readonly id = "lineBreak"
  override readonly label = "줄바꿈"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "ignore", label: "무시", template: "" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "br"
  }

  override convert() {
    return []
  }
}
