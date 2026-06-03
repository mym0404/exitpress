import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"

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
