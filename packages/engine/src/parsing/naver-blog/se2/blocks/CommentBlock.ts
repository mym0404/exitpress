import type { ParserBlockContext } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe2CommentBlock extends LeafParserBlock {
  override readonly id = "comment"
  override readonly label = "HTML 주석"

  override match({ node }: ParserBlockContext) {
    return node.type === "comment"
  }

  override convert() {
    return []
  }
}
