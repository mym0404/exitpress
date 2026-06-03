import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe2LineBreakBlock extends LeafBlock {
  override readonly id = "lineBreak"
  override readonly label = "줄바꿈"

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "br"
  }

  override convert() {
    return []
  }
}
