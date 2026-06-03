import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe2CommentBlock extends LeafBlock {
  override readonly id = "comment"
  override readonly label = "HTML 주석"

  override match({ node }: ParserBlockContext) {
    return node.type === "comment"
  }

  override convert() {
    return []
  }
}
