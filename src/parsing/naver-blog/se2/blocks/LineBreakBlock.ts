import type { ParserBlockContext } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2LineBreakBlock extends LeafParserBlock {
  override readonly id = "lineBreak"
  override readonly label = "줄바꿈"

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "br"
  }

  override convert() {
    return []
  }
}
