import type { ParserBlockContext } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2StyleBlock extends LeafParserBlock {
  override readonly id = "style"
  override readonly label = "HTML 스타일"

  override match({ node }: ParserBlockContext) {
    return node.type === "style"
  }

  override convert() {
    return []
  }
}
