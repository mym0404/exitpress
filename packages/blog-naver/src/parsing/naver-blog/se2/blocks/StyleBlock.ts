import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2StyleBlock extends LeafParserBlock {
  override readonly id = "style"
  override readonly label = "HTML 스타일"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "ignore", label: "무시", template: "" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "style"
  }

  override convert() {
    return []
  }
}
