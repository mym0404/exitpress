import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { LeafBlock } from "../../core/BaseBlock.js"
import { createDividerBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe2DividerBlock extends LeafBlock {
  override readonly id = "divider"
  override readonly label = "구분선"

  override match({ node }: ParserBlockContext) {
    return node.type === "tag" && node.tagName.toLowerCase() === "hr"
  }

  override convert({ blockId }: Parameters<LeafBlock["convert"]>[0]) {
    return [createDividerBlock({ blockId })]
  }
}
