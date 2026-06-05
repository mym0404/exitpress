import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"
import { createDividerBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe4DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-horizontalLine")
  }

  override convert({ blockId }: Parameters<LeafBlock["convert"]>[0]) {
    return [createDividerBlock({ blockId })]
  }
}
