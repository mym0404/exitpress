import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe2StyleBlock extends LeafBlock {
  override readonly id = "style"
  override readonly label = "HTML 스타일"

  override match({ node }: ParserBlockContext) {
    return node.type === "style"
  }

  override convert() {
    return []
  }
}
