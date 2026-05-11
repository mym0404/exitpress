import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe3DocumentTitleBlock extends LeafBlock {
  override readonly id = "documentTitle"
  override readonly label = "문서 제목"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_documentTitle")
  }

  override convert() {
    return []
  }
}
