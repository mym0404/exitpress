import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2CommentBlock extends LeafParserBlock {
  override readonly id = "comment"
  override readonly label = "HTML 주석"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "ignore", label: "무시", template: "" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

  override match({ node }: ParserBlockContext) {
    return node.type === "comment"
  }

  override convert() {
    return []
  }
}
