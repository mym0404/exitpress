import { LeafBlock } from "../BaseBlock.js"
import type { ParserBlockContext } from "../ParserNode.js"

export class NaverSe4DocumentTitleBlock extends LeafBlock {
  override readonly id = "documentTitle"
  override readonly label = "문서 제목"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-documentTitle")
  }

  override convert() {
    return []
  }
}
