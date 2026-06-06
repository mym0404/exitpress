import type { ParserBlockContext } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4DocumentTitleBlock extends LeafParserBlock {
  override readonly id = "documentTitle"
  override readonly label = "문서 제목"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-documentTitle")
  }

  override convert() {
    return []
  }
}
